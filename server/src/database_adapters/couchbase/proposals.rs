use super::{
    super::AdapterError,
    QueryExecutor,
};
use couchbase::{
    Bucket,
    CouchbaseError,
    GetOptions,
    InsertOptions,
    QueryOptions,
    QueryScanConsistency,
    ReplaceOptions,
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

#[derive(Default)]
struct CounterValue {
    cas: u64,
    value: u64,
}

/// The couchbase proposals adapter
pub struct Proposals {
    query_exec: Arc<QueryExecutor>,
    data_bucket: Bucket,
}

impl Proposals {
    pub fn new(query_exec: Arc<QueryExecutor>) -> Self {
        Self {
            data_bucket: query_exec.get_cluster().bucket("proposed"),
            query_exec,
        }
    }

    /// Returns a proposal document given its id
    pub async fn get(&self, target: &str, version: &u64) -> Result<Value, AdapterError> {
        let id = format!("prop::{}::{}", target, version);
        let options = GetOptions::default().timeout(Duration::from_secs(30));

        self.data_bucket
            .default_collection()
            .get(id, options)
            .await
            .and_then(|result| result.content::<Value>())
            .map_err(|error| {
                match error {
                    CouchbaseError::DocumentNotFound { ctx: _ } => AdapterError::DocumentNotFound,
                    _ => {
                        error!("Unexpected couchbase error: {:?}", error);
                        AdapterError::InternalError
                    }
                }
            })
    }

    pub async fn get_list_for_author(
        &self,
        offset: u16,
        limit: u16,
        sort_asc: bool,
        status: &str,
        author_id: &str,
    ) -> Result<Value, AdapterError> {
        // Build the named params
        let named_params = json!({
            "authorId": author_id,
            "status": status,
            "offset": offset,
            "limit": limit,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        let query_name = &format!(
            "proposals/get_list_for_author_{}",
            if sort_asc { "asc" } else { "desc" }
        );

        self.query_exec.query_expect_one(query_name, options).await
    }

    pub async fn get_list_for_target(
        &self,
        offset: u16,
        limit: u16,
        sort_asc: bool,
        status: &str,
        target: &str,
    ) -> Result<Value, AdapterError> {
        // Build the named params
        let named_params = json!({
            "target": target,
            "status": status,
            "offset": offset,
            "limit": limit,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        let query_name = &format!(
            "proposals/get_list_for_target_{}",
            if sort_asc { "asc" } else { "desc" }
        );

        self.query_exec.query_expect_one(query_name, options).await
    }

    /// Returns a list of proposal objects given paging and filter params
    pub async fn get_list(
        &self,
        offset: u16,
        limit: u16,
        sort_asc: bool,
        status: &str,
    ) -> Result<Value, AdapterError> {
        // Build the named params
        let named_params = json!({
            "status": status,
            "offset": offset,
            "limit": limit,
            "sortOrder": if sort_asc { "ASC" } else { "DESC" },
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        let query_name = &format!(
            "proposals/get_list_{}",
            if sort_asc { "asc" } else { "desc" }
        );

        self.query_exec.query_expect_one(query_name, options).await
    }

    /// Returns the last proposal closed before the specified time stamp
    /// for a given document target.
    pub async fn get_last_approved(
        &self,
        target: &str,
        time_stamp_str: &str,
    ) -> Result<Value, AdapterError> {
        let named_params = json!({
            "target": target,
            "time_stamp": time_stamp_str,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        self.query_exec
            .query_expect_one("proposals/get_last_approved", options)
            .await
    }

    /// Gets the latest authors for a target document
    pub async fn get_latest_authors(
        &self,
        target: &str,
        limit: u16,
    ) -> Result<Vec<Value>, AdapterError> {
        let named_params = json!({
            "target": target,
            "limit": limit,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params)
            .scan_consistency(QueryScanConsistency::RequestPlus);

        self.query_exec
            .query("proposals/get_latest_authors", options)
            .await
    }

    /// Upsert a proposal document
    pub async fn upsert<T>(
        &self,
        target: &str,
        version: &u64,
        content: T,
    ) -> Result<(), AdapterError>
    where
        T: Serialize,
    {
        let db_id = format!("prop::{}::{}", target, version);
        let options = UpsertOptions::default().timeout(Duration::from_secs(30));

        self.data_bucket
            .default_collection()
            .upsert(&db_id, content, options)
            .await
            .map(|_| ())
            .map_err(|error| {
                error!("Unexpected couchbase error: {:?}", error);
                AdapterError::InternalError
            })
    }

    /// Closes a proposal with a given status
    pub async fn close(
        &self,
        target: &str,
        version: &u64,
        new_status: &str,
    ) -> Result<Value, AdapterError> {
        let named_params = json!({
            "target": target,
            "version": format!("{}", version),
            "newStatus": new_status,
        });

        let options = QueryOptions::default()
            .adhoc(false)
            .named_parameters(named_params);

        self.query_exec
            .query_expect_one("proposals/close", options)
            .await
    }

    /// Increments the proposal counter for the specified target id
    pub async fn increment_counter(&self, target_id: &str) -> Result<u64, AdapterError> {
        let counter_id = format!("pcnt::{}", target_id);
        let collection = self.data_bucket.default_collection();

        loop {
            // Get the current counter value
            let options = GetOptions::default().timeout(Duration::from_secs(30));

            let counter_value = collection
                .get(&counter_id, options)
                .await
                .and_then(|result| {
                    let cas = result.cas();
                    result
                        .content::<u64>()
                        .map(|value| CounterValue { cas, value })
                })
                .or_else(|error| {
                    // Ignore document not found errors
                    match error {
                        CouchbaseError::DocumentNotFound { ctx: _ } => Ok(CounterValue::default()),
                        _ => Err(error),
                    }
                })
                .map_err(|error| {
                    error!("Unexpected couchbase error: {:?}", error);
                    AdapterError::InternalError
                })?;

            // Increment the counter value
            let new_value = counter_value.value + 1;
            if counter_value.cas == 0 {
                // Insert
                let options = InsertOptions::default().timeout(Duration::from_secs(30));

                let insert_result = collection.insert(&counter_id, new_value, options).await;

                match insert_result {
                    Ok(_) => break Ok(new_value),
                    Err(CouchbaseError::DocumentExists { ctx: _ }) => {
                        // The document was created since we last queried. Try again
                        continue;
                    }
                    Err(error) => {
                        error!("Unexpected couchbase error: {:?}", error);
                        break Err(AdapterError::InternalError);
                    }
                }
            } else {
                // Replace
                let options = ReplaceOptions::default()
                    .timeout(Duration::from_secs(30))
                    .cas(counter_value.cas);

                let replace_result = collection.replace(&counter_id, new_value, options).await;

                match replace_result {
                    Ok(_) => break Ok(new_value),
                    Err(CouchbaseError::DocumentExists { ctx: _ }) => {
                        // TODO RC: Report a bug it should be CasMismatch
                        // The document was updated since we last queried. Try again
                        continue;
                    }
                    Err(error) => {
                        error!("Unexpected couchbase error: {:?}", error);
                        break Err(AdapterError::InternalError);
                    }
                }
            }
        }
    }
}
