use super::{
    super::AdapterError,
    QueryExecutor,
};
use couchbase::{
    Bucket,
    ExistsOptions,
    QueryOptions,
    UpsertOptions,
};
use log::error;
use serde::Serialize;
use serde_json::{
    json,
    Value,
};
use std::{
    sync::Arc,
    time::Duration,
};

/// The couchbase documents adapter
pub struct Documents {
    query_exec: Arc<QueryExecutor>,
    data_bucket: Bucket,
}

impl Documents {
    pub fn new(query_exec: Arc<QueryExecutor>) -> Self {
        Self {
            data_bucket: query_exec.get_cluster().bucket("published"),
            query_exec,
        }
    }

    pub async fn game_exists(&self, id: &str) -> Result<bool, AdapterError> {
        self.document_exists(format!("game::{}", id)).await
    }

    pub async fn char_exists(&self, id: &str) -> Result<bool, AdapterError> {
        self.document_exists(format!("char::{}", id)).await
    }

    pub async fn upsert_game<T>(&self, id: &str, content: T) -> Result<(), AdapterError>
    where
        T: Serialize,
    {
        self.upsert(&format!("game::{}", id), content).await
    }

    pub async fn upsert_char<T>(&self, id: &str, content: T) -> Result<(), AdapterError>
    where
        T: Serialize,
    {
        self.upsert(&format!("char::{}", id), content).await
    }

    pub async fn upsert_move<T>(&self, id: &str, content: T) -> Result<(), AdapterError>
    where
        T: Serialize,
    {
        self.upsert(&format!("move::{}", id), content).await
    }

    /// Gets a move document via the specified id
    pub async fn get_move(&self, id: &str) -> Result<Value, AdapterError> {
        self.do_id_query("documents/get_move", &id).await
    }

    /// Gets a character document via the specified id
    pub async fn get_char(&self, id: &str) -> Result<Value, AdapterError> {
        self.do_id_query("documents/get_char", &id).await
    }

    /// Gets a game document via the specified id
    pub async fn get_game(&self, id: &str) -> Result<Value, AdapterError> {
        self.do_id_query("documents/get_game", &id).await
    }

    /// Gets a list of games
    pub async fn get_game_list(&self, offset: u16, limit: u16) -> Result<Value, AdapterError> {
        let named_params = json!({
            "offset": offset,
            "limit": limit,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        self.query_exec
            .query_expect_one("documents/get_game_list", options)
            .await
    }

    /// Gets a list of characters for a game given its id
    pub async fn get_char_list(
        &self,
        game_id: &str,
        offset: u16,
        limit: u16,
    ) -> Result<Value, AdapterError> {
        let named_params = json!({
            "game_id": game_id,
            "offset": offset,
            "limit": limit,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        self.query_exec
            .query_expect_one("documents/get_char_list", options)
            .await
    }

    /// Gets a list of moves for a character given its id
    pub async fn get_move_list(
        &self,
        char_id: &str,
        offset: u16,
        limit: u16,
    ) -> Result<Value, AdapterError> {
        let named_params = json!({
            "char_id": char_id,
            "offset": offset,
            "limit": limit,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        self.query_exec
            .query_expect_one("documents/get_move_list", options)
            .await
    }

    async fn document_exists(&self, db_id: String) -> Result<bool, AdapterError> {
        let options = ExistsOptions::default().timeout(Duration::from_secs(30));

        self.data_bucket
            .default_collection()
            .exists(db_id, options)
            .await
            .map(|result| result.exists())
            .map_err(|error| {
                error!("Unexpected couchbase error: {:?}", error);
                AdapterError::InternalError
            })
    }

    async fn upsert<T>(&self, db_id: &str, content: T) -> Result<(), AdapterError>
    where
        T: Serialize,
    {
        let options = UpsertOptions::default().timeout(Duration::from_secs(30));

        self.data_bucket
            .default_collection()
            .upsert(db_id, content, options)
            .await
            .map(|_| ())
            .map_err(|error| {
                error!("Unexpected couchbase error: {:?}", error);
                AdapterError::InternalError
            })
    }

    async fn do_id_query(&self, query_name: &str, id: &str) -> Result<Value, AdapterError> {
        let named_params = json!({ "id": id });
        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        self.query_exec.query_expect_one(query_name, options).await
    }
}
