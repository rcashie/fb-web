use super::{
    super::AdapterError,
    QueryExecutor,
};
use couchbase::QueryOptions;
use serde_json::{
    json,
    Value,
};
use std::sync::Arc;

/// Search adapter
pub struct Search {
    query_exec: Arc<QueryExecutor>,
}

impl Search {
    pub fn new(query_exec: Arc<QueryExecutor>) -> Self {
        Self { query_exec }
    }

    /// Searches all documents
    pub async fn search_all(
        &self,
        search_term: &str,
        offset: u16,
        limit: u16,
    ) -> Result<Vec<Value>, AdapterError> {
        // Build the named params
        let named_params = json!({
            "offset": offset,
            "limit": limit,
            "searchTerm": search_term,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        self.query_exec.query("search/search_all", options).await
    }

    /// Searches documents within a specified game
    pub async fn search_game(
        &self,
        target: &str,
        search_term: &str,
        offset: u16,
        limit: u16,
    ) -> Result<Vec<Value>, AdapterError> {
        self.search_target(target, "game", search_term, offset, limit)
            .await
    }

    /// Searches documents within a specified character
    pub async fn search_character(
        &self,
        target: &str,
        search_term: &str,
        offset: u16,
        limit: u16,
    ) -> Result<Vec<Value>, AdapterError> {
        self.search_target(target, "character", search_term, offset, limit)
            .await
    }

    /// Searches documents within a specified target
    async fn search_target(
        &self,
        target: &str,
        target_type: &str,
        search_term: &str,
        offset: u16,
        limit: u16,
    ) -> Result<Vec<Value>, AdapterError> {
        // Build the named params
        let named_params = json!({
            "offset": offset,
            "limit": limit,
            "searchTerm": search_term,
            "target": target,
            "targetType": target_type,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        self.query_exec.query("search/search_target", options).await
    }
}
