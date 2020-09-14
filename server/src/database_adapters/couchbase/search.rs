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

    /// Executes a search given the specified input
    pub async fn execute_search(
        &self,
        input: &str,
        offset: u16,
        limit: u16,
    ) -> Result<Vec<Value>, AdapterError> {
        // Build the named params
        let named_params = json!({
            "offset": offset,
            "limit": limit,
            "searchTerm": input,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        self.query_exec.query("search/search_term", options).await
    }
}
