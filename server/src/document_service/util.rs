use crate::http_service::HttpError;

pub fn build_invalid_path_error(path: &str) -> HttpError {
    let message = format!(
        "Invalid doc-api path '{path}' for the specified method",
        path = path
    );

    HttpError::BadRequest(message.into())
}

pub fn build_invalid_format_error() -> HttpError {
    HttpError::BadRequest("Invalid doc-api path format".into())
}
