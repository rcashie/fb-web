use super::{
    build_nonce,
    oauth,
    Claims,
    ServiceConfig,
    Session,
};
use crate::http_service::{
    util as http_util,
    HttpError,
    HttpResponse,
    HttpResult,
};
use crypto::{
    digest::Digest,
    sha2::Sha256,
};
use hyper::{
    body::{
        self,
        Body,
        Buf,
        Bytes,
    },
    client::HttpConnector,
    header::{
        self,
        HeaderMap,
        HeaderValue,
    },
    Client,
    Response,
    StatusCode,
};
use hyper_rustls::HttpsConnector;
use jsonwebtoken::{
    decode,
    encode,
    Algorithm,
    DecodingKey,
    EncodingKey,
    Header,
    Validation,
};
use log::{
    debug,
    error,
    info,
    warn,
};
use std::{
    collections::HashMap,
    str,
    time::{
        SystemTime,
        UNIX_EPOCH,
    },
};

/// 15 minutes token expiration time. A token must be refreshed after this time
const TOKEN_EXP_SECONDS: u64 = 900;

/// 1 day max token life time. A user must log in after this point
const TOKEN_MAX_LIFE_SECONDS: u64 = 86400;

pub struct Service {
    config: ServiceConfig,
}

impl Service {
    /// Creates a new instance of the auth service
    pub fn new(config: ServiceConfig) -> Self {
        Self { config }
    }

    /// Modifies response headers based on the state of the session
    pub fn modify_response_headers(&self, header_map: &mut HeaderMap, session: &Session) {
        match session {
            Session::Expired(claims) => self.refresh_jwt(header_map, &claims),
            Session::Invalid => Self::clear_jwt(header_map),
            _ => {}
        };
    }

    /// Attempts to decode jwt from the specified cookie values
    pub fn decode_jwt(&self, cookie_params: &HashMap<&str, &str>) -> Session {
        let token = cookie_params.get("token").unwrap_or(&"");

        let hashed_nonce = {
            let nonce = cookie_params.get("nonce").unwrap_or(&"");
            let mut sha256 = Sha256::new();
            sha256.input_str(*nonce);
            sha256.result_str()
        };

        if (*token).is_empty() && hashed_nonce.is_empty() {
            return Session::None;
        }

        let validation = Validation {
            leeway: 0,
            validate_exp: false,
            validate_nbf: false,
            iss: None,
            sub: None,
            aud: None,
            algorithms: vec![Algorithm::HS256],
        };

        let key = DecodingKey::from_secret(self.config.jwt_signing_secret());
        let decode_result = decode::<Claims>(*token, &key, &validation);

        if decode_result.is_err() {
            debug!("Failed to decode jwt: {:?}", decode_result);
            return Session::Error;
        }

        let claims = decode_result.unwrap().claims;
        if claims.nonce() != hashed_nonce {
            warn!("Nonce in jwt has been modified!");
            return Session::Invalid;
        }

        let now = Self::get_current_time_secs();

        // Too old for renewal
        if now > (*claims.exp() + TOKEN_MAX_LIFE_SECONDS) {
            debug!("Expired token.");
            return Session::Invalid;
        }

        if now > *claims.exp() {
            Session::Expired(claims)
        } else {
            Session::Valid(claims)
        }
    }

    /// Handles any get requests routed to the auth service
    pub async fn handle_get_request(&self, path: &str, query: Option<&str>) -> HttpResult {
        // Route the request
        match path {
            "login" => self.handle_login_request().await,
            "callback" => self.handle_callback_request(query).await,
            "logout" => Ok(self.handle_logout_request()),
            _ => {
                let message = format!(
                    "Invalid authorization path '{path}' for the specified method",
                    path = path
                );

                Err(HttpError::BadRequest(message.into()))
            }
        }
    }

    /// Attempts to retrieve a request token from Twitter
    async fn handle_login_request(&self) -> HttpResult {
        let oauth_config = &self.config.twitter_oauth();
        let request = oauth::build_request_token_request(
            oauth_config.consumer_secret(),
            oauth_config.consumer_key(),
            oauth_config.callback_url(),
        );

        let response = Self::get_https_client()
            .request(request)
            .await
            .map_err(|error| {
                error!(
                    "Unexpected HTTP Hyper error while making request: {}",
                    error,
                );

                HttpError::InternalError(None)
            })?;

        let body = Self::get_body_from_response(response).await?;
        Self::handle_request_token_response(body).await
    }

    /// Clears any jwt tokens
    fn handle_logout_request(&self) -> HttpResponse {
        Response::builder()
            .status(StatusCode::SEE_OTHER)
            .header(header::LOCATION, "/")
            .header(header::SET_COOKIE, "nonce=; Path=/; HttpOnly")
            .header(header::SET_COOKIE, "token=; Path=/")
            .body(Body::empty())
            .unwrap()
    }

    /// Handles a callback redirect from Twitter
    async fn handle_callback_request(&self, query: Option<&str>) -> HttpResult {
        // Parse the query string and create the request
        let oauth_config = &self.config.twitter_oauth();
        let query_params = http_util::parse_query_string(query.unwrap_or(""));

        let request = match (
            query_params.get("oauth_verifier"),
            query_params.get("oauth_token"),
        ) {
            (Some(verifier), Some(token)) => {
                oauth::build_access_token_request(
                    oauth_config.consumer_key(),
                    oauth_config.consumer_secret(),
                    verifier,
                    token,
                )
            }
            _ => {
                // TODO: Redirect to a sign in failed page
                error!("Missing callback parameter(s). Sign in failed.");
                return Err(HttpError::InternalError(Some("Sign in failed".into())));
            }
        };

        let response = Self::get_https_client()
            .request(request)
            .await
            .map_err(|error| {
                error!(
                    "Unexpected HTTP Hyper error while making request: {}",
                    error
                );

                HttpError::InternalError(None)
            })?;

        let body = Self::get_body_from_response(response).await?;
        self.handle_access_token_response(body)
    }

    /// Handles an access token request response from Twitter
    fn handle_access_token_response(&self, body: Bytes) -> HttpResult {
        // Get the params from the response
        let query_params = str::from_utf8(body.as_ref())
            .map(|params| http_util::parse_query_string(params))
            .map_err(|error| {
                error!(
                    "Unable to read 'access token' response as a utf-8 string: {}",
                    error
                );

                HttpError::InternalError(None)
            })?;

        match (query_params.get("user_id"), query_params.get("screen_name")) {
            (Some(user_id), Some(screen_name)) => {
                let (nonce, token) = self.create_jwt(&format!("u:{}", user_id), *screen_name);

                info!("User {} = {} logged in ", screen_name, user_id);
                let response = Response::builder()
                    .status(StatusCode::SEE_OTHER)
                    .header(header::LOCATION, "/")
                    .header(
                        header::SET_COOKIE,
                        format!("nonce={}; Path=/; HttpOnly", nonce),
                    )
                    .header(header::SET_COOKIE, format!("token={}; Path=/", token))
                    .body(Body::empty())
                    .unwrap();

                Ok(response)
            }
            _ => {
                let message =
                    "The user_id and / or screen_name is missing from the 'access token' response"
                        .into();

                Err(HttpError::InternalError(Some(message)))
            }
        }
    }

    /// Handles a request token response from Twitter
    async fn handle_request_token_response(body: Bytes) -> Result<HttpResponse, HttpError> {
        let uri: &'static str = "https://api.twitter.com/oauth/authenticate";

        // Get the params from the response
        let query_params = str::from_utf8(body.as_ref())
            .map(|params| http_util::parse_query_string(params))
            .map_err(|error| {
                error!(
                    "Unable to read 'request token' response as a utf-8 string: {}",
                    error
                );
                HttpError::InternalError(None)
            })?;

        // Get the oauth_token
        match query_params.get("oauth_token") {
            Some(oauth_token) => {
                // Redirect the user to the twitter login
                let redirect_url = format!("{}?oauth_token={}", uri, oauth_token);
                let response = Response::builder()
                    .status(StatusCode::SEE_OTHER)
                    .header(header::LOCATION, redirect_url)
                    .body(Body::empty())
                    .unwrap();

                Ok(response)
            }
            None => {
                error!("The oauth token is missing from the 'request token' response");
                Err(HttpError::InternalError(None))
            }
        }
    }

    /// Retrieves the body from an http response
    async fn get_body_from_response(response: HttpResponse) -> Result<Bytes, HttpError> {
        // Check the status code first
        let status_code = response.status();
        if status_code != StatusCode::OK {
            error!("Error code in oauth response: {}", status_code);
            return Err(HttpError::InternalError(None));
        }

        body::aggregate(response)
            .await
            .map(|mut buf| buf.to_bytes())
            .map_err(|error| {
                error!("Unexpected error while collecting body: {}", error);
                HttpError::InternalError(None)
            })
    }

    fn clear_jwt(header_map: &mut HeaderMap) {
        header_map.append(
            header::SET_COOKIE,
            HeaderValue::from_str("nonce=; Path=/; HttpOnly").unwrap(),
        );

        header_map.append(
            header::SET_COOKIE,
            HeaderValue::from_str("token=; Path=/").unwrap(),
        );
    }

    fn refresh_jwt(&self, header_map: &mut HeaderMap, claims: &Claims) {
        let (nonce, token) = self.create_jwt(&claims.sub(), &claims.screen_name());

        let nonce_string = format!("nonce={}; Path=/; HttpOnly", nonce);
        let token_string = format!("token={}; Path=/", token);

        header_map.append(
            header::SET_COOKIE,
            HeaderValue::from_str(nonce_string.as_ref()).unwrap(),
        );

        header_map.append(
            header::SET_COOKIE,
            HeaderValue::from_str(token_string.as_ref()).unwrap(),
        );
    }

    // TODO: The user id alone should be used. The screen_name should be dynamically
    // displayed
    fn create_jwt(&self, user_id: &str, screen_name: &str) -> (String, String) {
        let exp = Self::get_current_time_secs() + TOKEN_EXP_SECONDS;

        let nonce = build_nonce();
        let hashed_nonce = {
            let mut sha256 = Sha256::new();
            sha256.input_str(&nonce);
            sha256.result_str()
        };

        // TODO HACK: List of admin has to be read in from somewhere
        let is_admin = user_id == "u:1062434421398269953";
        let header = Header::new(Algorithm::HS256);
        let claims = Claims::new(
            hashed_nonce,
            "framebastard.com".to_owned(),
            user_id.to_owned(),
            screen_name.to_owned(),
            is_admin,
            exp,
        );

        let secret = EncodingKey::from_secret(self.config.jwt_signing_secret());
        (nonce, encode(&header, &claims, &secret).unwrap())
    }

    fn get_https_client() -> Client<HttpsConnector<HttpConnector>> {
        // TODO: Should this https connector be saved and shared?
        let connector = HttpsConnector::new();
        Client::builder().pool_max_idle_per_host(0).build(connector)
    }

    fn get_current_time_secs() -> u64 {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Unexpected time result.");

        current_time.as_secs()
    }
}
