use super::super::{
    pojos,
    util,
};
use crate::{
    auth_service::{
        Claims,
        Session,
    },
    database_adapters::{
        self,
        couchbase as couchbase_adapters,
        AdapterError,
    },
    http_service::{
        util as http_util,
        HttpError,
        HttpResult,
    },
};
use hyper::{
    body::{
        Body,
        Buf,
    },
    StatusCode,
};
use lazy_static::lazy_static;
use log::error;
use regex::Regex;
use serde::de::DeserializeOwned;
use serde_json::{
    json,
    Value,
};
use std::{
    sync::Arc,
    time::{
        SystemTime,
        UNIX_EPOCH,
    },
};

/// Handles proposal related requests via the doc-api
pub struct Proposal {
    props_adapter: Arc<couchbase_adapters::Proposals>,
    docs_adapter: Arc<couchbase_adapters::Documents>,
    tagsets_adapter: Arc<couchbase_adapters::TagSets>,
}

impl Proposal {
    pub fn new(
        props_adapter: Arc<couchbase_adapters::Proposals>,
        docs_adapter: Arc<couchbase_adapters::Documents>,
        tagsets_adapter: Arc<couchbase_adapters::TagSets>,
    ) -> Self {
        Self {
            props_adapter,
            docs_adapter,
            tagsets_adapter,
        }
    }

    /// Handles a doc-api proposal `GET` request
    pub async fn handle_get_request(&self, path: &str, query: Option<&str>) -> HttpResult {
        // Pull out the 'document type' and 'optional id' from the path.
        lazy_static! {
            static ref PATH_REGEX: Regex =
                Regex::new(r"^any(?:/+(?P<id>(?P<target>[\w\-.]+)/+(?P<ver>\d+))?)?$").unwrap();
        }

        let captures = PATH_REGEX
            .captures(path)
            .ok_or_else(|| util::build_invalid_format_error())?;

        // Route the request.
        match (captures.name("id"), query) {
            (Some(_), None) => {
                self.handle_id_request(
                    &captures["target"],
                    &captures["ver"].parse::<u64>().unwrap(),
                )
                .await
            }
            (None, Some(query_str)) => self.handle_query_request(query_str).await,
            _ => Err(util::build_invalid_format_error()),
        }
    }

    /// Handles a doc-api proposal `POST` request
    pub async fn handle_post_request(
        &self,
        path: &str,
        body: Body,
        session: &Session,
    ) -> HttpResult {
        // Pull out the 'document type' from the path
        lazy_static! {
            static ref PATH_REGEX: Regex = Regex::new(r"^(?P<type>\w+)$").unwrap();
        }

        let captures = PATH_REGEX
            .captures(path)
            .ok_or_else(|| util::build_invalid_format_error())?;

        // Extract the user's information from the session
        let claims = match session {
            Session::Valid(claims) | Session::Expired(claims) => claims,
            _ => return Err(HttpError::Unauthorized(None)),
        };

        // Route the request
        let doc_type = &captures["type"];
        match doc_type {
            "games" => self.handle_new_proposal::<pojos::Game>(claims, body).await,
            "chars" => {
                self.handle_new_proposal::<pojos::Character>(claims, body)
                    .await
            }
            "moves" => self.handle_new_proposal::<pojos::Move>(claims, body).await,
            _ => Err(util::build_invalid_path_error(doc_type)),
        }
        .map(|json| http_util::build_json_response(&json, StatusCode::OK))
    }

    /// Handles a doc-api proposal `PATCH` request
    pub async fn handle_patch_request(&self, path: &str, session: &Session) -> HttpResult {
        // Match the supported url pattern
        lazy_static! {
            static ref PATH_REGEX: Regex =
                Regex::new(r"^any/+(?P<target>[\w\-.]+)/+(?P<ver>\d+)/+status/+(?P<status>\w+)$")
                    .unwrap();
        }

        let captures = PATH_REGEX
            .captures(path)
            .ok_or_else(|| util::build_invalid_format_error())?;

        // Extract the user's information from the session
        let claims = match session {
            Session::Valid(claims) | Session::Expired(claims) => claims,
            _ => return Err(HttpError::Unauthorized(None)),
        };

        let target = &captures["target"];
        let version = captures["ver"].parse::<u64>().unwrap();
        let status = &captures["status"];
        let proposal = self
            .props_adapter
            .get(target, &version)
            .await
            .map_err(|error| {
                error!("Failed to get proposal: {:?}", error);
                HttpError::InternalError(None)
            })?;

        // Make sure the current user can change the status
        Self::authorize_proposal_close(&proposal, status, &claims)?;

        // Publish
        if status == "approved" {
            self.publish_proposal(proposal).await?;
        }

        // Close the proposal
        self.props_adapter
            .close(target, &version, status)
            .await
            .map(|json| http_util::build_json_response(&json, StatusCode::OK))
            .map_err(|error| {
                error!("Failed to close proposal: {:?}", error);
                HttpError::InternalError(None)
            })
    }

    /// Handles an id request given a document type
    async fn handle_id_request(&self, target: &str, version: &u64) -> HttpResult {
        let mut response = self.props_adapter.get(target, version).await;
        if let Ok(proposal) = response {
            response = self.combine_with_prev(proposal).await;
        }

        database_adapters::build_http_result(response)
    }

    /// Handles proposal query requests
    async fn handle_query_request(&self, query: &str) -> HttpResult {
        // Parse out query params
        let query_params = http_util::parse_query_string(query);

        // Extract paging options
        let (offset, limit) = http_util::get_paging_options(&query_params)
            .map_err(|error| HttpError::BadRequest(error.into()))?;

        let status = query_params.get("status").map(|v| *v).unwrap_or("approved");
        let target = query_params.get("target").map(|v| *v);
        let author_id = query_params.get("author").map(|v| *v);
        let sort_asc = query_params
            .get("sortAsc")
            .map(|v| *v == "true")
            .unwrap_or(true);

        let response = match (target, author_id) {
            (Some(target), None) => {
                self.props_adapter
                    .get_list_for_target(offset, limit, sort_asc, status, target)
                    .await
            }
            (None, Some(author_id)) => {
                self.props_adapter
                    .get_list_for_author(offset, limit, sort_asc, status, author_id)
                    .await
            }
            _ => {
                self.props_adapter
                    .get_list(offset, limit, sort_asc, status)
                    .await
            }
        };

        database_adapters::build_http_result(response)
    }

    /// Processes a new proposal request call using the specified request
    /// processor
    async fn handle_new_proposal<T>(&self, claims: &Claims, body: Body) -> Result<Value, HttpError>
    where
        T: pojos::Document + serde::Serialize + DeserializeOwned + Send,
    {
        let bytes = hyper::body::aggregate(body)
            .await
            .map(|mut buf| buf.to_bytes())
            .map_err(|error| {
                error!("Unexpected error while collecting body: {}", error);
                HttpError::InternalError(None)
            })?;

        let request: pojos::ProposalRequest<T> = serde_json::from_slice(&bytes)
            .map_err(|error| HttpError::BadRequest(error.to_string().into()))?;

        let proposal = self.process_proposal_request(claims, request).await?;
        self.commit_new_proposal(proposal).await
    }

    /// Handles the processing of a new proposal request
    async fn process_proposal_request<T>(
        &self,
        claims: &Claims,
        mut request: pojos::ProposalRequest<T>,
    ) -> Result<pojos::Proposal<T>, HttpError>
    where
        T: pojos::Document + serde::Serialize + Send,
    {
        lazy_static! {
            static ref TARGET_REGEX: Regex = Regex::new(r"^[\w\-]+$").unwrap();
        }

        let document = &mut request.document;
        let parent_len = if let Some(parent) = document.get_parent() {
            // Check to see if the parent exists
            let result = match document.get_type() {
                "character" => self.docs_adapter.game_exists(parent).await,
                _ => self.docs_adapter.char_exists(parent).await,
            };

            let exists = result.map_err(|error| {
                error!("Error fetching document {:?}: {:?}", parent, error);
                HttpError::InternalError(None)
            })?;

            if !exists {
                return Err(HttpError::BadRequest(
                    "The specified parent does not exist".into(),
                ));
            }

            // Make sure that the target is prefixed with the parent
            if !request.target.starts_with(parent) {
                return Err(HttpError::BadRequest(
                    "The target name does not start with the parent's id".into(),
                ));
            }

            parent.len() + 1
        } else {
            0
        };

        // Make sure the name is valid
        if !TARGET_REGEX.is_match(&request.target[parent_len..]) {
            return Err(HttpError::BadRequest("Invalid target name".into()));
        }

        // Determine the author information
        let (author_id, author_name) = if let Some(import_as) = request.import_as {
            if !claims.is_admin() {
                return Err(HttpError::Unauthorized(None));
            }

            (format!("i:{}", import_as), import_as)
        } else {
            (claims.sub().to_owned(), claims.screen_name().to_owned())
        };

        // Sanitize the document
        document.sanitize();

        // Create the actual proposal
        let current_time = Self::get_now_timestamp();
        let proposal = pojos::Proposal {
            doc_type: "proposal".to_owned(),
            target: request.target,
            created: current_time,
            last_updated: current_time,
            status: "pending".to_owned(),
            author_id,
            author_name,
            document: request.document,
        };

        Ok(proposal)
    }

    /// Commits a new proposal document
    async fn commit_new_proposal<T>(&self, document: T) -> Result<Value, HttpError>
    where
        T: pojos::Proposed + serde::Serialize,
    {
        // Get the next counter
        let target = document.target();
        let count = self
            .props_adapter
            .increment_counter(target)
            .await
            .map_err(|error| {
                error!("Error incrementing counter: {:?}", error);
                HttpError::InternalError(None)
            })?;

        // Upsert it
        self.props_adapter
            .upsert(target, &count, &document)
            .await
            .map(|_| {
                json!({
                    "proposal": target,
                    "version": count,
                })
            })
            .map_err(|error| {
                error!("Error committing document: {:?}", error);
                HttpError::InternalError(None)
            })
    }

    /// Combine a proposal document with its target
    async fn combine_with_prev(&self, proposal: Value) -> Result<Value, AdapterError> {
        // Parse the proposal json to retrieve the target and closed-time
        let target = proposal["target"].as_str().unwrap_or("");
        let time_stamp = proposal["closed"]
            .as_u64()
            .unwrap_or_else(|| Self::get_now_timestamp());

        // Fetch the proposal 'previously approved'
        self.props_adapter
            .get_last_approved(target, &time_stamp.to_string())
            .await
            .or_else(|error| {
                // If no document was found just return null
                match error {
                    AdapterError::DocumentNotFound => Ok(json!(null)),
                    _ => Err(error),
                }
            })
            .map(move |previous| {
                // Combine the result with the proposal document
                json!({
                    "proposal": proposal,
                    "previous": previous
                })
            })
    }

    /// Authorizes the closing of the specified proposal by the current user
    fn authorize_proposal_close(
        proposal: &Value,
        status: &str,
        claims: &Claims,
    ) -> Result<(), HttpError> {
        match status {
            "approved" | "rejected" => {
                // Only admins can 'approve' or 'reject'
                if !claims.is_admin() {
                    Err(HttpError::Unauthorized(None))
                } else {
                    Ok(())
                }
            }
            "cancelled" => {
                // Only the author can 'cancel'
                let author_id = proposal["authorId"].as_str().unwrap_or("");
                if claims.sub() != author_id {
                    Err(HttpError::Unauthorized(None))
                } else {
                    Ok(())
                }
            }
            _ => {
                let message = format!("Invalid proposal status '{status}'", status = status);
                Err(HttpError::BadRequest(message.into()))
            }
        }
    }

    /// Publishes the specified proposal document
    async fn publish_proposal(&self, mut proposal: Value) -> Result<(), HttpError> {
        // Set the latest authors list
        {
            let target = proposal["target"].as_str().unwrap();
            let mut authors = self
                .props_adapter
                .get_latest_authors(&target, 9)
                .await
                .map_err(|error| {
                    error!("Error getting latest authors: {:?}", error);
                    HttpError::InternalError(None)
                })?;

            // Make sure the proposal author is first on the list
            let author_id = proposal["authorId"].as_str().unwrap();
            let author_name = proposal["authorName"].as_str().unwrap();

            let pos_result = authors
                .iter()
                .position(|author| (*author)["id"].as_str().unwrap() == author_id);

            if let Some(pos) = pos_result {
                authors.remove(pos);
            }

            let latest_author = json!({
                "id": author_id,
                "name": author_name,
            });

            authors.insert(0, latest_author);
            proposal["document"]["latestAuthors"] = Value::Array(authors);
        };

        // Publish the internal document
        let document = &proposal["document"];
        let doc_type = document["type"].as_str().unwrap();
        let target = proposal["target"].as_str().unwrap();

        match doc_type {
            "game" => self.docs_adapter.upsert_game(&target, document).await,
            "character" => self.docs_adapter.upsert_char(&target, document).await,
            _ => self.docs_adapter.upsert_move(&target, document).await,
        }
        .map_err(|error| {
            error!("Failed to upsert document: {:?}", error);
            HttpError::InternalError(None)
        })?;

        // Update tagsets for full text searching
        match doc_type {
            "game" => self.tagsets_adapter.update_game(&target).await,
            "character" => self.tagsets_adapter.update_char(&target).await,
            _ => self.tagsets_adapter.update_move(&target).await,
        }
        .map_err(|error| {
            error!("Failed to update tagset for document: {:?}", error);
            HttpError::InternalError(None)
        })
    }

    fn get_now_timestamp() -> u64 {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Unexpected time result.");

        current_time.as_secs()
    }
}
