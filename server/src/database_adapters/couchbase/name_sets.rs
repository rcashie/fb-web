use super::{
    super::AdapterError,
    QueryExecutor,
};
use couchbase::QueryOptions;
use serde_json::json;
use std::sync::Arc;

/// The couchbase name_sets adapter
pub struct NameSets {
    query_exec: Arc<QueryExecutor>,
}

impl NameSets {
    pub fn new(query_exec: Arc<QueryExecutor>) -> Self {
        Self { query_exec }
    }

    /// Updates name_sets for the specified game and its children
    pub async fn update_game(&self, id: &str) -> Result<(), AdapterError> {
        let get_options = || {
            let named_params = json!({ "id": id });
            QueryOptions::default().named_parameters(named_params)
        };

        self.query_exec
            .query("name_sets/update_game", get_options())
            .await?;

        self.query_exec
            .query("name_sets/update_game_chars", get_options())
            .await?;

        self.query_exec
            .query("name_sets/update_game_moves", get_options())
            .await?;

        Ok(())
    }

    /// Updates name_sets for the specified character and its children
    pub async fn update_char(&self, id: &str) -> Result<(), AdapterError> {
        let get_options = || {
            let named_params = json!({ "id": id });
            QueryOptions::default().named_parameters(named_params)
        };

        self.query_exec
            .query("name_sets/update_char", get_options())
            .await?;

        self.query_exec
            .query("name_sets/update_char_moves", get_options())
            .await?;

        Ok(())
    }

    /// Updates name_sets for the specified character and its children
    pub async fn update_move(&self, id: &str) -> Result<(), AdapterError> {
        let named_params = json!({ "id": id });
        let options = QueryOptions::default().named_parameters(named_params);
        self.query_exec
            .query("name_sets/update_move", options)
            .await?;

        Ok(())
    }
}
