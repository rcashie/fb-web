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
use lazy_static::lazy_static;
use regex::Regex;
use serde::Serialize;
use std::{
    cmp,
    collections::HashMap,
    str::FromStr,
};

/// Builds a response given the specified params
pub fn build_response<T>(content: T, content_type: &'static str, status: StatusCode) -> HttpResponse
where
    T: Into<Vec<u8>>,
{
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, HeaderValue::from_static(content_type))
        .body(Body::from(content.into()))
        .unwrap()
}

/// Builds a json response
pub fn build_json_response<T>(json: &T, status: StatusCode) -> HttpResponse
where
    T: Serialize,
{
    self::build_response(
        serde_json::to_vec(json).unwrap(),
        mime::APPLICATION_JSON.as_ref(),
        status,
    )
}

/// Parses a query string into its parameters and values
pub fn parse_query_string<'a>(query: &'a str) -> HashMap<&'a str, &'a str> {
    lazy_static! {
        // TODO RC: Is this parsing safe? Just including chars that are not '&'
        static ref PARAM_REGEX: Regex =
            Regex::new(r"(?P<param>[^&]+)=(?P<value>[^&]+)").unwrap();
    }

    let mut query_params: HashMap<&'a str, &'a str> = HashMap::new();
    for capture in PARAM_REGEX.captures_iter(query) {
        query_params.insert(
            capture.name("param").unwrap().as_str(),
            capture.name("value").unwrap().as_str(),
        );
    }

    query_params
}

/// Gets paging options from params in a hashmap
pub fn get_paging_options(query_params: &HashMap<&str, &str>) -> Result<(u16, u16), String> {
    const MAX_LIMIT: u16 = 50;
    const DEFAULT_LIMIT: u16 = 10;
    const DEFAULT_OFFSET: u16 = 0;

    let get_paging_option = |param: &str, default: u16| -> Result<u16, String> {
        let convert_to_u16 = |value_str: &&str| {
            u16::from_str(*value_str)
                .map_err(|_| format!("Invalid integer for parameter '{param}'", param = param))
        };

        query_params.get(param).map_or(Ok(default), convert_to_u16)
    };

    let offset = get_paging_option("offset", DEFAULT_OFFSET)?;
    let limit =
        get_paging_option("limit", DEFAULT_LIMIT).map(|value| cmp::min(value, MAX_LIMIT))?;

    Ok((offset, limit))
}
