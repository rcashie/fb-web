mod http_error;
mod service;
mod service_container;
mod service_router;

pub mod util;

pub use self::{
    service::Service,
    service_container::ServiceContainer,
};
pub use http_error::HttpError;

use self::service_router::ServiceRouter;
use hyper::{
    service::make_service_fn,
    Body,
    Error,
    Response,
    Server,
};
use log::{
    error,
    info,
};
use std::sync::Arc;

/// Represents the response structure returned by the service
pub type HttpResponse = Response<Body>;

/// Represents a full http result
pub type HttpResult = Result<HttpResponse, HttpError>;

pub async fn run(http_port: &str, service_container: Arc<ServiceContainer>) {
    let make_service = make_service_fn(move |_| {
        let service_container = service_container.clone();
        async { Ok::<_, Error>(Service::new(service_container)) }
    });

    let address_string = format!("0.0.0.0:{0}", http_port);

    info!("Binding to address {}...", address_string);
    let address = address_string.parse().unwrap();
    let server = Server::bind(&address).serve(make_service);

    info!("Hosting...");
    if let Err(error) = server.await {
        error!("An unexpected error occurred: {}", error);
    }
}
