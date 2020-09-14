use super::HttpResponse;
use hyper::{
    header::{
        self,
        HeaderValue,
    },
    Body,
    Response,
    StatusCode,
};

pub enum HttpError {
    BadRequest(Vec<u8>),
    InternalError(Option<Vec<u8>>),
    Unauthorized(Option<Vec<u8>>),
    NotFound(Option<Vec<u8>>),
}

impl HttpError {
    pub fn to_response(self) -> HttpResponse {
        let (message, status) = match self {
            HttpError::BadRequest(msg) => (msg, StatusCode::BAD_REQUEST),
            HttpError::InternalError(msg) => {
                (
                    msg.unwrap_or("Internal server error".into()),
                    StatusCode::INTERNAL_SERVER_ERROR,
                )
            }
            HttpError::Unauthorized(msg) => {
                (
                    msg.unwrap_or("Unauthorized".into()),
                    StatusCode::UNAUTHORIZED,
                )
            }
            HttpError::NotFound(msg) => {
                (
                    msg.unwrap_or("The requested resource is not available".into()),
                    StatusCode::NOT_FOUND,
                )
            }
        };

        Response::builder()
            .status(status)
            .header(
                header::CONTENT_TYPE,
                HeaderValue::from_static(mime::TEXT_PLAIN_UTF_8.as_ref()),
            )
            .body(Body::from(message))
            .unwrap()
    }
}
