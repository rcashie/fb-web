mod claims;
mod oauth;
mod service;
mod service_config;

use rand::{
    distributions::Alphanumeric,
    thread_rng,
    Rng,
};

pub use self::{
    claims::Claims,
    service::Service,
    service_config::{
        ServiceConfig,
        TwitterOauthConfig,
    },
};

#[derive(Debug)]
pub enum Session {
    Valid(Claims),
    Expired(Claims),
    Invalid,
    None,
    Error,
}

fn build_nonce() -> String {
    thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .collect::<String>()
}
