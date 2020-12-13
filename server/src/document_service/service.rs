use super::{
    request_handlers,
    util,
};
use crate::{
    auth_service::Session,
    database_adapters::couchbase as couchbase_adapters,
    http_service::{
        HttpError,
        HttpResult,
    },
};
use hyper::Body;
use lazy_static::lazy_static;
use regex::Regex;
use std::sync::Arc;

pub struct Service {
    document_handler: request_handlers::Document,
    proposal_handler: request_handlers::Proposal,
}

impl Service {
    /// Creates a new instance of the Service
    pub fn new(
        docs_adapter: Arc<couchbase_adapters::Documents>,
        props_adapter: Arc<couchbase_adapters::Proposals>,
        name_sets_adapter: Arc<couchbase_adapters::NameSets>,
    ) -> Self {
        Self {
            document_handler: request_handlers::Document::new(docs_adapter.clone()),
            proposal_handler: request_handlers::Proposal::new(
                props_adapter,
                docs_adapter,
                name_sets_adapter,
            ),
        }
    }

    pub async fn handle_get_request(&self, path: &str, query: Option<&str>) -> HttpResult {
        let (root_path, relative_path) =
            Self::extract_paths(path).map_err(|error| HttpError::BadRequest(error.into()))?;

        match root_path {
            "docs" => {
                self.document_handler
                    .handle_get_request(relative_path, query)
                    .await
            }
            "props" => {
                self.proposal_handler
                    .handle_get_request(relative_path, query)
                    .await
            }
            _ => Err(util::build_invalid_path_error(root_path)),
        }
    }

    pub async fn handle_post_request(
        &self,
        path: &str,
        body: Body,
        session: &Session,
    ) -> HttpResult {
        let (root_path, relative_path) =
            Self::extract_paths(path).map_err(|error| HttpError::BadRequest(error.into()))?;

        match root_path {
            "props" => {
                self.proposal_handler
                    .handle_post_request(relative_path, body, session)
                    .await
            }
            _ => Err(util::build_invalid_path_error(root_path)),
        }
    }

    pub async fn handle_patch_request(&self, path: &str, session: &Session) -> HttpResult {
        let (root_path, relative_path) =
            Self::extract_paths(path).map_err(|error| HttpError::BadRequest(error.into()))?;

        match root_path {
            "props" => {
                self.proposal_handler
                    .handle_patch_request(relative_path, session)
                    .await
            }
            _ => Err(util::build_invalid_path_error(root_path)),
        }
    }

    fn extract_paths<'a>(path: &'a str) -> Result<(&'a str, &'a str), String> {
        // Pull out the 'version', 'root path' and 'relative path' from the path.
        lazy_static! {
            static ref PATH_REGEX: Regex =
                Regex::new(r"^v(?P<ver>\d+)/+(?P<root_path>\w+)(?:/+(?P<relative_path>.+)?)?$")
                    .unwrap();
        }

        let captures = PATH_REGEX
            .captures(path)
            .ok_or("Invalid doc-api path format".to_string())?;

        // Validate the version (currently only version #1)
        if !captures["ver"].eq("1") {
            return Err("Unsupported doc-api version".to_string());
        }

        let root_path = captures.name("root_path").unwrap().as_str();
        let relative_path = captures.name("relative_path").map_or("", |m| m.as_str());
        Ok((root_path, relative_path))
    }
}
