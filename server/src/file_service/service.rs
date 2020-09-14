use super::{
    BaseDirectory,
    ServiceConfig,
};
use crate::http_service::{
    HttpError,
    HttpResponse,
    HttpResult,
};
use async_std::{
    fs::File,
    prelude::*,
};
use hyper::{
    header::{
        self,
        HeaderMap,
        HeaderValue,
    },
    Body,
    Response,
    StatusCode,
};
use lazy_static::lazy_static;
use log::{
    error,
    info,
    trace,
};
use regex::Regex;
use std::{
    borrow::Borrow,
    io::{
        Error,
        ErrorKind,
        SeekFrom,
    },
    path::PathBuf,
};

#[derive(Debug)]
struct RequestRange {
    pub start: u64,
    pub end: u64,
}

struct FetchResultPayload {
    pub mime_type: &'static str,
    pub encoding: &'static str,
    pub content: Vec<u8>,
    pub range_start: u64,
    pub range_end: u64,
    pub total_length: u64,
}

impl FetchResultPayload {
    pub fn to_http_response(self, status_code: StatusCode) -> HttpResponse {
        let builder = Response::builder()
            .status(status_code)
            .header(
                header::CONTENT_TYPE,
                HeaderValue::from_static(self.mime_type),
            )
            .header(
                header::CONTENT_ENCODING,
                HeaderValue::from_static(self.encoding),
            )
            .header(
                header::CACHE_CONTROL,
                HeaderValue::from_static("public, max-age=86400"),
            );

        let builder = match status_code {
            StatusCode::PARTIAL_CONTENT => {
                let header_value = format!(
                    "bytes {0}-{1}/{2}",
                    self.range_start, self.range_end, self.total_length
                );

                builder.header(
                    header::CONTENT_RANGE,
                    HeaderValue::from_str(header_value.as_str()).unwrap(),
                )
            }
            _ => builder,
        };

        builder.body(Body::from(self.content)).unwrap()
    }
}

pub struct Service {
    config: ServiceConfig,
}

impl Service {
    /// Creates a new instance of the Service struct
    pub fn new(config: ServiceConfig) -> Self {
        Self { config }
    }

    pub async fn handle_get_request(
        &self,
        path: &str,
        header_map: &HeaderMap,
        base_dir: BaseDirectory,
    ) -> HttpResult {
        let request_range = Self::get_request_range(header_map);
        let mut status_code = if request_range.is_some() {
            StatusCode::PARTIAL_CONTENT
        } else {
            StatusCode::OK
        };

        // Fetch the file
        let fetch_result =
            Self::fetch_file_content(&path, &base_dir, &request_range, &self.config).await;

        // If the file was not found fetch the 'not found' file instead
        let fetch_result = match fetch_result {
            Err(error) if ErrorKind::NotFound == error.kind() => {
                info!(
                    "File '{}' not found in base directory '{:?}'",
                    path, base_dir
                );

                status_code = StatusCode::NOT_FOUND;
                Self::fetch_file_content(
                    self.config.not_found_file(),
                    &BaseDirectory::Content,
                    &None,
                    &self.config,
                )
                .await
            }
            _ => fetch_result,
        };

        fetch_result
            .map(|payload| payload.to_http_response(status_code))
            .map_err(|error| {
                error!("Encountered an error while retrieving content: {:?}", error);
                HttpError::InternalError(None)
            })
    }

    fn get_request_range(header_map: &HeaderMap) -> Option<RequestRange> {
        lazy_static! {
            static ref RANGE_REGEX: Regex =
                Regex::new(r"^bytes=(?P<start>\d+)-(?P<end>\d+)$").unwrap();
        }

        header_map
            .get(header::RANGE)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| RANGE_REGEX.captures(value))
            .and_then(|captures| {
                let start = captures["start"].parse::<u64>();
                let end = captures["end"].parse::<u64>();
                match (start, end) {
                    (Ok(start), Ok(end)) => Some(RequestRange { start, end }),
                    _ => None,
                }
            })
    }

    /// Asynchronously retrieves file content from disk
    async fn fetch_file_content(
        path: &str,
        base_dir: &BaseDirectory,
        request_range: &Option<RequestRange>,
        config: &ServiceConfig,
    ) -> Result<FetchResultPayload, Error> {
        let base_dir = match base_dir {
            BaseDirectory::Content => config.content_dir(),
            BaseDirectory::Uploads => config.uploads_dir(),
        };

        let mut absolute_path = PathBuf::new();
        absolute_path.push(base_dir);
        absolute_path.push(path.trim_start_matches('/'));
        trace!("Request: {:?}", absolute_path);

        // Attempt to read the gzipped version first if that fails read the original
        let gzipped_path = {
            let path_str = absolute_path.to_string_lossy();
            let path_str: &str = path_str.borrow();
            PathBuf::from(&format!("{}.gz", path_str))
        };

        let (mut file, encoding) = match File::open(gzipped_path).await {
            Ok(file) => (file, "gzip"),
            _ => (File::open(&absolute_path).await?, "identity"),
        };

        // Get the file length
        let metadata = file.metadata().await?;
        let (range_start, range_end) = request_range
            .as_ref()
            .map_or((0, metadata.len()), |v| (v.start as u64, v.end as u64));

        // Seek to the reading position
        file.seek(SeekFrom::Start(range_start)).await?;

        // Read the content
        let mut content = vec![0; range_end as usize];
        file.read(&mut content).await?;

        let mime_type = if let Some(os_str) = absolute_path.extension() {
            let value = os_str.to_string_lossy();
            config.get_mime_type(value.borrow())
        } else {
            config.get_mime_type("txt")
        };

        Ok(FetchResultPayload {
            content,
            mime_type,
            encoding,
            total_length: metadata.len(),
            range_start,
            range_end,
        })
    }
}
