mod documents;
mod proposals;
mod query_executor;
mod query_store;
mod search;
mod tag_sets;

use couchbase;
use query_executor::QueryExecutor;
use std::sync::Arc;

pub use self::{
    documents::Documents,
    proposals::Proposals,
    query_store::QueryStore,
    search::Search,
    tag_sets::TagSets,
};

/// Creates instances of all adapters for a couchbase database
pub fn create_adapters(
    host: &str,
    user: &str,
    password: &str,
    query_store: QueryStore,
) -> (Documents, Proposals, TagSets, Search) {
    let cluster = couchbase::Cluster::connect(
        format!("couchbase://{host}", host = host),
        user.to_owned(),
        password.to_owned(),
    );

    let query_exec = QueryExecutor::new(cluster, query_store);
    let query_exec = Arc::new(query_exec);
    (
        Documents::new(query_exec.clone()),
        Proposals::new(query_exec.clone()),
        TagSets::new(query_exec.clone()),
        Search::new(query_exec),
    )
}
