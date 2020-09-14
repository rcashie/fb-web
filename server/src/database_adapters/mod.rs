pub mod couchbase;
use hyper::StatusCode;
use serde::Serialize;

use crate::http_service::{
    util as http_util,
    HttpError,
    HttpResult,
};

#[derive(PartialEq, Debug)]
pub enum AdapterError {
    DocumentNotFound,
    InternalError,
}

/// Builds an http response given a result of an adapter
pub fn build_http_result<T>(result: Result<T, AdapterError>) -> HttpResult
where
    T: Serialize,
{
    result
        .map(|content| http_util::build_json_response(&content, StatusCode::OK))
        .map_err(|error| {
            if error == AdapterError::DocumentNotFound {
                HttpError::NotFound(None)
            } else {
                HttpError::InternalError(None)
            }
        })
}
