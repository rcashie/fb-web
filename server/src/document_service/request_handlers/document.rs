use super::super::util;
use crate::{
    database_adapters::{
        self,
        couchbase as couchbase_adapters,
    },
    http_service::{
        util as http_util,
        HttpError,
        HttpResult,
    },
};
use lazy_static::lazy_static;
use regex::Regex;
use std::sync::Arc;

/// Handles document related requests via the doc-api
pub struct Document {
    docs_adapter: Arc<couchbase_adapters::Documents>,
}

impl Document {
    pub fn new(docs_adapter: Arc<couchbase_adapters::Documents>) -> Self {
        Self { docs_adapter }
    }

    /// Handles a document-api request
    pub async fn handle_get_request(&self, path: &str, query: Option<&str>) -> HttpResult {
        // Pull out the 'document type' and 'optional id' from the path.
        lazy_static! {
            static ref PATH_REGEX: Regex =
                Regex::new(r"^(?P<type>\w+)(?:/+(?P<id>[\w\-.]+)?)?$").unwrap();
        }

        let captures = PATH_REGEX
            .captures(path)
            .ok_or_else(|| util::build_invalid_format_error())?;

        // Route the request based on the params.
        match (captures.name("id"), query) {
            (Some(id), None) => self.handle_id_request(id.as_str(), &captures["type"]).await,
            (None, _) => {
                self.handle_query_request(query.unwrap_or(""), &captures["type"])
                    .await
            }
            _ => Err(util::build_invalid_format_error()),
        }
    }

    /// Handles an id request given a document type
    async fn handle_id_request(&self, doc_id: &str, doc_type: &str) -> HttpResult {
        let response = match doc_type {
            "games" => self.docs_adapter.get_game(doc_id).await,
            "moves" => self.docs_adapter.get_move(doc_id).await,
            "chars" => self.docs_adapter.get_char(doc_id).await,
            _ => return Err(util::build_invalid_path_error(doc_type)),
        };

        database_adapters::build_http_result(response)
    }

    /// Handles a query request given a document type
    async fn handle_query_request(&self, query: &str, doc_type: &str) -> HttpResult {
        // Parse out query params
        let query_params = http_util::parse_query_string(query);

        // Extract paging options
        let (offset, limit) = http_util::get_paging_options(&query_params)
            .map_err(|error| HttpError::BadRequest(error.into()))?;

        let get_id_argument = |param_str: &str| -> Result<&str, HttpError> {
            query_params
                .get(param_str)
                .ok_or_else(|| {
                    let message =
                        format!("Missing expected parameter '{param}'", param = param_str);

                    HttpError::BadRequest(message.into())
                })
                .map(|value| *value)
        };

        // Route the request.
        let response = match doc_type {
            "games" => self.docs_adapter.get_game_list(offset, limit).await,
            "moves" => {
                let char_id = get_id_argument("char")?;
                self.docs_adapter
                    .get_move_list(char_id, offset, limit)
                    .await
            }
            "chars" => {
                let game_id = get_id_argument("game")?;
                self.docs_adapter
                    .get_char_list(game_id, offset, limit)
                    .await
            }
            _ => return Err(util::build_invalid_path_error(doc_type)),
        };

        database_adapters::build_http_result(response)
    }
}
