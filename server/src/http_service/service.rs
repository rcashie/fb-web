use super::{
    HttpResponse,
    ServiceContainer,
    ServiceRouter,
};
use hyper::{
    service::Service as HyperService,
    Body,
    Error,
    Request,
};
use std::{
    future::Future,
    pin::Pin,
    sync::Arc,
    task::{
        Context,
        Poll,
    },
};

/// Main http service structure for the host
pub struct Service {
    service_container: Arc<ServiceContainer>,
}

impl Service {
    pub fn new(service_container: Arc<ServiceContainer>) -> Self {
        Self { service_container }
    }
}

impl HyperService<Request<Body>> for Service {
    type Response = HttpResponse;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, _: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, req: Request<Body>) -> Self::Future {
        let router = ServiceRouter::new(self.service_container.clone());
        Box::pin(router.route_request(req))
    }
}
