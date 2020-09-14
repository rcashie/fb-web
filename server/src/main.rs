mod auth_service;
mod database_adapters;
mod document_service;
mod file_service;
mod http_service;
mod logging;
mod search_service;
mod upload_service;
mod util;

use database_adapters::couchbase::QueryStore;
use http_service::ServiceContainer;
use serde_json::Value;
use std::{
    env::args,
    fs::File,
    io::Read,
    sync::Arc,
};

fn value_as_str<'a>(map: &'a Value, key: &str) -> &'a str {
    map[key]
        .as_str()
        .expect(&format!("Could not read '{0}' as string", key))
}

fn value_as_int(map: &Value, key: &str) -> u64 {
    map[key]
        .as_u64()
        .expect(&format!("Could not read '{0}' as an integer", key))
}

#[tokio::main]
async fn main() {
    logging::initialize();

    // Read in command line arguments
    let mut config_file: Option<String> = None;
    let mut couchbase_cluster: Option<String> = None;
    let mut arg_iter = args().skip(1);
    let mut item = arg_iter.next();
    while let Some(arg) = item {
        match arg.as_str() {
            "--config" | "-c" => {
                let value = arg_iter.next().expect("Expected a value for --config");
                config_file = Some(value);
            }
            "--couchbase-cluster" | "-l" => {
                let value = arg_iter
                    .next()
                    .expect("Expected a value for --couchbase_cluster");

                couchbase_cluster = Some(value);
            }
            _ => {
                panic!("Invalid argument: {}", arg);
            }
        }

        item = arg_iter.next();
    }

    // Read in the config
    let json_config: Value = {
        let config_file = config_file
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("config.json");

        let mut config_file = File::open(config_file).expect("Unable to open config file");

        let mut content = Vec::<u8>::new();
        config_file
            .read_to_end(&mut content)
            .expect("Unable to read config file");

        serde_json::from_slice(&content).unwrap()
    };

    // The auth sub-service
    let auth_service = {
        let oauth_config = &json_config["auth-service"]["twitter-oauth"];
        let oauth_config = auth_service::TwitterOauthConfig::new(
            value_as_str(&oauth_config, "consumer-key").to_owned(),
            value_as_str(&oauth_config, "consumer-secret").to_owned(),
            value_as_str(&oauth_config, "callback-url").to_owned(),
        );

        let jwt_config = &json_config["auth-service"]["jwt"];
        let options = auth_service::ServiceConfig::new(
            oauth_config,
            value_as_str(&jwt_config, "signing-key").to_owned(),
        );

        auth_service::Service::new(options)
    };

    // Create the file sub-service
    let file_service = {
        let config = &json_config["file-service"];
        let config = file_service::ServiceConfig::new(
            value_as_str(&config, "content-dir").to_string(),
            value_as_str(&config, "uploads-dir").to_string(),
            value_as_str(&config, "not-found-file").to_string(),
        );

        file_service::Service::new(config)
    };

    // The document sub-service
    let query_store = QueryStore::create_from_dir(std::path::Path::new("./n1ql"))
        .expect("Unable to load queries into query store");

    let config = &json_config["couchbase"];
    let (docs_adapter, props_adapter, tagsets_adapter, search_adapter) = {
        let cluster = couchbase_cluster
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or_else(|| value_as_str(&config, "cluster"));

        database_adapters::couchbase::create_adapters(
            cluster,
            value_as_str(&config, "user"),
            value_as_str(&config, "password"),
            query_store,
        )
    };

    let document_service = document_service::Service::new(
        Arc::new(docs_adapter),
        Arc::new(props_adapter),
        Arc::new(tagsets_adapter),
    );

    // The search sub-service
    let search_service = search_service::Service::new(search_adapter);

    // The upload sub-server
    let upload_service = {
        let config = &json_config["upload-service"];
        let config = upload_service::ServiceConfig::new(
            value_as_str(&config, "publish-dir").to_owned(),
            value_as_str(&config, "video-tmp-dir").to_owned(),
            value_as_int(&config, "video-size-limit") as u32,
        );

        upload_service::Service::new(config)
    };

    // Create the service container
    let service_container = Arc::new(ServiceContainer::new(
        auth_service,
        file_service,
        document_service,
        search_service,
        upload_service,
    ));

    // Start hosting
    let http_config = &json_config["http-service"];
    http_service::run(value_as_str(&http_config, "port"), service_container).await;
}
