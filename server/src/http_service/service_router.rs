use super::{
    HttpError,
    HttpResponse,
    HttpResult,
    ServiceContainer,
};
use crate::{
    auth_service::Session,
    file_service::BaseDirectory,
};
use hyper::{
    header::{
        self,
        HeaderMap,
    },
    Body,
    Error,
    Method,
    Request,
};
use lazy_static::lazy_static;
use percent_encoding::percent_decode;
use regex::Regex;
use std::{
    borrow::Borrow,
    collections::HashMap,
    sync::Arc,
};

/// Main http service router structure
pub struct ServiceRouter {
    service_container: Arc<ServiceContainer>,
}

impl ServiceRouter {
    pub fn new(service_container: Arc<ServiceContainer>) -> Self {
        Self { service_container }
    }

    /// Routes an http request to it's servicing destination
    pub async fn route_request(self, req: Request<Body>) -> Result<HttpResponse, Error> {
        // Decode the jwt token if present.
        let (parts, body) = req.into_parts();
        let headers = &parts.headers;
        let session = self.get_user_session(headers);

        // Percent decode the path and query strings.
        let path = percent_decode(parts.uri.path().as_bytes()).decode_utf8_lossy();

        // Get the query string
        let query = parts
            .uri
            .query()
            .map(|q| percent_decode(q.as_bytes()).decode_utf8_lossy());

        let query: Option<&str> = match query {
            Some(ref q) => Some(q.borrow()),
            None => None,
        };

        // Route the request
        let path: &str = path.borrow();
        let result = match parts.method {
            Method::GET => self.handle_get_request(path, headers, query).await,
            Method::POST => {
                self.handle_post_request(path, headers, body, &session)
                    .await
            }
            Method::PATCH => self.handle_patch_request(path, &session).await,
            _ => Err(HttpError::BadRequest("Bad or unsupported method".into())),
        };

        // Modify auth related headers if necessary
        result
            .map(|mut response| {
                self.service_container
                    .auth_service()
                    .modify_response_headers(response.headers_mut(), &session);

                response
            })
            .or_else(|error| Ok(error.to_response()))
    }

    async fn handle_get_request(
        &self,
        path: &str,
        header_map: &HeaderMap,
        query: Option<&str>,
    ) -> HttpResult {
        let (root_path, relative_path) = Self::extract_paths(path);
        match root_path {
            "auth" => {
                self.service_container
                    .auth_service()
                    .handle_get_request(relative_path, query)
                    .await
            }
            "static" => {
                self.service_container
                    .file_service()
                    .handle_get_request(relative_path, header_map, BaseDirectory::Content)
                    .await
            }
            "doc-api" => {
                self.service_container
                    .document_service()
                    .handle_get_request(relative_path, query)
                    .await
            }
            "search-api" => {
                self.service_container
                    .search_service()
                    .handle_get_request(relative_path, query)
                    .await
            }
            "uploads" => {
                self.service_container
                    .file_service()
                    .handle_get_request(relative_path, header_map, BaseDirectory::Uploads)
                    .await
            }
            _ => {
                // Treat all other gets as gets against the main app.
                self.service_container
                    .file_service()
                    .handle_get_request("app.html", header_map, BaseDirectory::Content)
                    .await
            }
        }
    }

    async fn handle_post_request(
        &self,
        path: &str,
        header_map: &HeaderMap,
        body: Body,
        session: &Session,
    ) -> HttpResult {
        let (root_path, relative_path) = Self::extract_paths(path);
        match root_path {
            "doc-api" => {
                self.service_container
                    .document_service()
                    .handle_post_request(relative_path, body, session)
                    .await
            }
            "upload-api" => {
                self.service_container
                    .upload_service()
                    .handle_post_request(relative_path, header_map, body, session)
                    .await
            }
            _ => Err(Self::build_invalid_path_error(root_path)),
        }
    }

    async fn handle_patch_request(&self, path: &str, session: &Session) -> HttpResult {
        let (root_path, relative_path) = Self::extract_paths(path);
        match root_path {
            "doc-api" => {
                self.service_container
                    .document_service()
                    .handle_patch_request(relative_path, session)
                    .await
            }
            _ => Err(Self::build_invalid_path_error(root_path)),
        }
    }

    fn get_user_session(&self, header_map: &HeaderMap) -> Session {
        lazy_static! {
            static ref PARAM_REGEX: Regex = get_cookie_parsing_regex();
        }

        let mut cookie_params: HashMap<&str, &str> = HashMap::new();
        for header_value in header_map.get_all(header::COOKIE) {
            let header_value = header_value.to_str().unwrap_or("");
            for capture in PARAM_REGEX.captures_iter(header_value) {
                let param = capture.name("param").unwrap().as_str();
                let value = capture.name("value").unwrap().as_str();
                cookie_params.insert(param, value);
            }
        }

        self.service_container
            .auth_service()
            .decode_jwt(&cookie_params)
    }

    fn extract_paths(path: &str) -> (&str, &str) {
        lazy_static! {
            static ref ROOT_PATH_REGEX: Regex =
                Regex::new(r"^/+(?P<root_path>[\w-]+)(?:/+(?P<relative_path>.+)?)?$").unwrap();
        }

        ROOT_PATH_REGEX.captures(path).map_or(("", ""), |captures| {
            let root_path = captures.name("root_path").unwrap().as_str();
            let relative_path = captures.name("relative_path").map_or("", |m| m.as_str());
            (root_path, relative_path)
        })
    }

    fn build_invalid_path_error(path: &str) -> HttpError {
        let message = format!(
            "Invalid path '{path}' for the specified method",
            path = path
        );

        HttpError::BadRequest(message.into())
    }
}

fn get_cookie_parsing_regex() -> Regex {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Directives
    let name: &'static str = r"[\x23-\x27\x41-\x5A\x5E-\x7E!\*\+\.\-\d]";
    let value: &'static str = r"[\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E!]";
    let regex_str = format!("(?P<param>{}+)=(?P<value>{}+)", name, value);
    Regex::new(&regex_str).unwrap()
}
