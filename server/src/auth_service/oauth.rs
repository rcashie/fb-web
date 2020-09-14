use super::build_nonce;
use crate::util::get_timestamp_string;
use crypto::{
    hmac::Hmac,
    mac::Mac,
    sha1::Sha1,
};
use hyper::{
    body::Body,
    header,
    Method,
    Request,
};
use percent_encoding::{
    utf8_percent_encode,
    AsciiSet,
    NON_ALPHANUMERIC,
};
use std::str;

/// https://developer.twitter.com/en/docs/basics/authentication/oauth-1-0a/percent-encoding-parameters
const TWITTER_SET: AsciiSet = NON_ALPHANUMERIC
    .remove(b'-')
    .remove(b'.')
    .remove(b'_')
    .remove(b'~');

pub fn build_request_token_request(
    consumer_secret: &str,
    consumer_key: &str,
    callback_url: &str,
) -> Request<Body> {
    let uri: &'static str = "https://api.twitter.com/oauth/request_token";

    let addtl_params = &vec![("oauth_callback", callback_url)];
    let oauth_header = build_header(
        &format!("{}&", consumer_secret),
        consumer_key,
        "POST",
        uri,
        Some(addtl_params),
    );

    Request::builder()
        .method(Method::POST)
        .uri(uri)
        .header(header::AUTHORIZATION, oauth_header)
        .body(Body::empty())
        .unwrap()
}

pub fn build_access_token_request(
    consumer_secret: &str,
    consumer_key: &str,
    oauth_verifier: &str,
    oauth_token: &str,
) -> Request<Body> {
    let uri: &'static str = "https://api.twitter.com/oauth/access_token";

    let addtl_params = &vec![
        ("oauth_token", oauth_token),
        ("oauth_verifier", oauth_verifier),
    ];

    let oauth_header = build_header(
        &format!("{}&", consumer_secret),
        consumer_key,
        "POST",
        uri,
        Some(addtl_params),
    );

    Request::builder()
        .method(Method::POST)
        .uri(uri)
        .header(header::AUTHORIZATION, oauth_header)
        .body(Body::empty())
        .unwrap()
}

fn build_header(
    sign_key: &str,
    consumer_key: &str,
    method: &str,
    uri: &str,
    addtl_params: Option<&Vec<(&str, &str)>>,
) -> String {
    let concat_params = |params: &Vec<(String, String)>, delimiter: &str| -> String {
        let mut iterator = params.iter();
        let (name, value) = iterator.next().unwrap();
        let mut result = format!("{}={}", name, value);

        for (name, value) in iterator {
            result.push_str(&format!("{}{}={}", delimiter, name, value));
        }

        result
    };

    let mut params: Vec<(String, String)> = vec![
        (encode("oauth_consumer_key"), encode(consumer_key)),
        (encode("oauth_nonce"), encode(&build_nonce())),
        (encode("oauth_signature_method"), encode("HMAC-SHA1")),
        (encode("oauth_timestamp"), encode(&get_timestamp_string())),
        (encode("oauth_version"), encode("1.0")),
    ];

    if let Some(headers) = addtl_params {
        for (param, value) in headers {
            params.push((encode(param), encode(value)));
        }
    }

    params.sort_by(|left, right| {
        let (left_key, _) = left;
        let (right_key, _) = right;
        left_key.cmp(&right_key)
    });

    let parameter = concat_params(&params, "&");
    let base = format!("{}&{}&{}", method, encode(uri), encode(&parameter));

    params.push((encode("oauth_signature"), encode(&sign(&base, sign_key))));
    format!("OAuth {}", concat_params(&params, ", "))
}

fn encode(src: &str) -> String {
    utf8_percent_encode(src, &TWITTER_SET).collect::<String>()
}

fn sign(base: &str, key: &str) -> String {
    let mut hmac = Hmac::new(Sha1::new(), key.as_bytes());
    hmac.input(base.as_bytes());
    base64::encode(hmac.result().code())
}
