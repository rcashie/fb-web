use super::{
    super::AdapterError,
    QueryStore,
};

use couchbase::{
    Cluster,
    QueryOptions,
};
use futures::{
    future,
    stream::{
        Stream,
        StreamExt,
    },
};
use log::{
    error,
    warn,
};
use serde_json::Value;
use std::time::Duration;

// We usually don't query for more than 10 items
const DEFAULT_BUFF_SIZE: usize = 10;

pub struct QueryExecutor {
    cluster: Cluster,
    store: QueryStore,
}

impl QueryExecutor {
    pub fn new(cluster: Cluster, store: QueryStore) -> Self {
        Self { cluster, store }
    }

    pub fn get_cluster(&self) -> &Cluster {
        &self.cluster
    }

    /// Executes a NQ1L query expecting and returning just one result
    pub async fn query_expect_one(
        &self,
        query_name: &str,
        options: QueryOptions,
    ) -> Result<Value, AdapterError> {
        self.query_expect_results(query_name, options)
            .await
            .map(|mut vec| vec.remove(0))
    }

    /// Executes a NQ1L query expecting at least one result
    pub async fn query_expect_results(
        &self,
        query_name: &str,
        options: QueryOptions,
    ) -> Result<Vec<Value>, AdapterError> {
        let result = self.query(query_name, options).await?;
        if result.len() == 0 {
            Err(AdapterError::DocumentNotFound)
        } else {
            Ok(result.into())
        }
    }

    /// Executes a NQ1L query
    pub async fn query(
        &self,
        query_name: &str,
        options: QueryOptions,
    ) -> Result<Vec<Value>, AdapterError> {
        let query = self.store.get_query(query_name).ok_or_else(|| {
            error!("Named query not found: {:?}", query_name);
            AdapterError::InternalError
        })?;

        let options = options.adhoc(false).timeout(Duration::from_secs(30));

        let row_stream = self
            .cluster
            .query(query, options)
            .await
            .map(|mut result| result.rows::<Value>())
            .map_err(|error| {
                error!("Unexpected error executing query: '{}'", query_name);
                error!("{:?}", error);
                AdapterError::InternalError
            })?;

        let (_, upper_bound) = row_stream.size_hint();
        let mut results = Vec::with_capacity(upper_bound.unwrap_or(DEFAULT_BUFF_SIZE));
        row_stream
            .for_each(|row| {
                match row {
                    Ok(value) => results.push(value),
                    Err(error) => warn!("Unexpected error fetching couchbase row: {:?}", error),
                }

                future::ready(())
            })
            .await;

        Ok(results)
    }
}
