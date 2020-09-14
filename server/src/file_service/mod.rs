mod service;
mod service_config;

#[derive(Debug)]
pub enum BaseDirectory {
    Content,
    Uploads,
}

pub use self::{
    service::Service,
    service_config::ServiceConfig,
};
