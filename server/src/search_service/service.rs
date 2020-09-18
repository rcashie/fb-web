use crate::{
    database_adapters,
    database_adapters::couchbase as couchbase_adapters,
    http_service::{
        util as http_util,
        HttpError,
        HttpResult,
    },
};
use lazy_static::lazy_static;
use regex::Regex;
use std::str;

pub struct Service {
    adapter: couchbase_adapters::Search,
}

impl Service {
    /// Creates a new instance of the search service
    pub fn new(adapter: couchbase_adapters::Search) -> Self {
        Self { adapter }
    }

    /// Handles any get requests routed to the search service
    pub async fn handle_get_request(&self, path: &str, query: Option<&str>) -> HttpResult {
        // Pull out the 'version' from the path.
        lazy_static! {
            static ref PATH_REGEX: Regex = Regex::new(r"^v(?P<ver>\d+)$").unwrap();
        }

        let captures = PATH_REGEX
            .captures(path)
            .ok_or_else(|| HttpError::BadRequest("Invalid search-api path format".into()))?;

        // Validate the version (currently only version #1)
        if !captures["ver"].eq("1") {
            let message = "Unsupported search-api version".into();
            return Err(HttpError::BadRequest(message));
        }

        // Get the query params
        let query_params = http_util::parse_query_string(query.unwrap_or(""));

        // Extract the query string itself
        let search_term = query_params
            .get("query")
            .ok_or_else(|| HttpError::BadRequest("Invalid or missing query parameter".into()))?;

        // Extract query options
        let game = query_params.get("game").map(|v| *v);
        let character = query_params.get("char").map(|v| *v);
        let (offset, limit) = http_util::get_paging_options(&query_params)
            .map_err(|message| HttpError::BadRequest(message.into()))?;

        let result = match (game, character) {
            (Some(target), None) => {
                self.adapter
                    .search_game(target, search_term, offset, limit)
                    .await
            }
            (None, Some(target)) => {
                self.adapter
                    .search_character(target, search_term, offset, limit)
                    .await
            }
            _ => self.adapter.search_all(search_term, offset, limit).await,
        };

        database_adapters::build_http_result(result)
    }
}
