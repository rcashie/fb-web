use super::ServiceConfig;
use crate::{
    auth_service::Session,
    http_service::{
        util as http_util,
        HttpError,
        HttpResult,
    },
    util::get_timestamp_string,
};
use hyper::{
    body::{
        self,
        Body,
        Buf,
    },
    header::{
        self,
        HeaderMap,
    },
    StatusCode,
};
use lazy_static::lazy_static;
use log::{
    error,
    info,
    warn,
};
use regex::Regex;
use serde_json::json;
use std::fmt::Display;
use tokio::{
    fs::{
        create_dir_all,
        remove_dir_all,
        File,
    },
    io::{
        AsyncReadExt,
        AsyncWriteExt,
    },
    process::Command,
};

pub struct Service {
    config: ServiceConfig,
}

impl Service {
    /// Creates a new instance of the Service struct
    pub fn new(config: ServiceConfig) -> Self {
        Self { config }
    }

    /// Handles a upload-api `POST` request
    pub async fn handle_post_request(
        &self,
        path: &str,
        header_map: &HeaderMap,
        body: Body,
        session: &Session,
    ) -> HttpResult {
        // Get the user information.
        let (user_id, user_name) = match session {
            Session::Valid(claims) | Session::Expired(claims) => {
                (claims.sub(), claims.screen_name())
            }
            _ => {
                return Err(HttpError::Unauthorized(None));
            }
        };

        // Make sure the uploaded file is within the size limit.
        let length = Self::get_content_length(&header_map)?;
        if length > self.config.video_size_limit() {
            warn!(
                "User {}:{} tried to upload a large file of size {}",
                user_name, user_id, length
            );

            return Err(HttpError::BadRequest("File is too big".into()));
        }

        info!(
            "User {}:{} is uploading a file of size {}",
            user_name, user_id, length
        );

        // Route the request
        let (root_path, _) =
            Self::extract_paths(path).map_err(|message| HttpError::BadRequest(message.into()))?;

        match root_path {
            "video" => Self::handle_video_upload(body, &self.config).await,
            _ => {
                let message = format!(
                    "Invalid upload-api path '{path}' for the specified method",
                    path = path
                );

                Err(HttpError::BadRequest(message.into()))
            }
        }
    }

    /// Handles video upload requests
    async fn handle_video_upload(body: Body, config: &ServiceConfig) -> HttpResult {
        let target_file_name = get_timestamp_string();
        let target_file_path = format!("{}/{}", config.publish_dir(), target_file_name);

        // Create the temporary directory
        let tmp_dir = format!("{}/{}", config.video_tmp_dir(), get_timestamp_string());

        create_dir_all(&tmp_dir).await.map_err(|error| {
            error!("Could not create temporary directory: {}", error);
            HttpError::InternalError(None)
        })?;

        async fn remove_temp_dir(dir: &str) {
            if let Err(error) = remove_dir_all(dir).await {
                error!(
                    "Failed to clean up temporary directory '{}': {}",
                    &dir, error
                );
            }
        }

        // Save the uploaded file there
        let content = body::aggregate(body)
            .await
            .map(|mut buf| buf.copy_to_bytes(buf.remaining()))
            .map_err(|error| {
                error!("Unexpected error while collecting body: {}", error);
                HttpError::InternalError(None)
            })?;

        let saved_file = {
            let result = Self::save_content(content.as_ref(), &tmp_dir).await;
            if result.is_err() {
                remove_temp_dir(&tmp_dir).await;
            }

            result?
        };

        // Get the video duration
        let duration = {
            let result = Self::get_video_duration(&saved_file).await;
            if result.is_err() {
                remove_temp_dir(&tmp_dir).await;
            }

            result?
        };

        // Generate the web media
        let preview_data = {
            let result =
                Self::generate_web_media(&saved_file, duration / 2, target_file_path, &tmp_dir)
                    .await;

            remove_temp_dir(&tmp_dir).await;
            result?
        };

        let resp_body = json!({
            "fileName": target_file_name,
            "previewData": preview_data
        });

        Ok(http_util::build_json_response(&resp_body, StatusCode::OK))
    }

    /// Saves the specified content to disk for processing
    async fn save_content(content: &[u8], out_dir: &str) -> Result<String, HttpError> {
        let out_file = format!("{}/file", out_dir);
        let mut file = File::create(&out_file).await.map_err(|error| {
            error!("Could not create file: {}", error);
            HttpError::InternalError(None)
        })?;

        file.write_all(content)
            .await
            .map(|_| out_file)
            .map_err(|error| {
                error!("Could not save content to file: {}", error);
                HttpError::InternalError(None)
            })
    }

    /// Gets the duration of the video
    async fn get_video_duration(in_file: &str) -> Result<u64, HttpError> {
        lazy_static! {
            static ref DUR_REGEX: Regex = Regex::new(r"^(?P<duration>\d+)(?s).*$").unwrap();
        }

        let result = Command::new("ffprobe")
            .args(&["-v", "error"])
            .args(&["-show_entries", "format=duration"])
            .args(&["-print_format", "default=noprint_wrappers=1:nokey=1"])
            .arg(in_file)
            .output()
            .await
            .map_err(|error| {
                error!("Failed to run ffprobe process: {}", error);
                HttpError::InternalError(None)
            })?;

        if !result.status.success() {
            error!("ffprobe execution failed: {}", result.status);
            return Err(HttpError::InternalError(None));
        }

        let duration_str = String::from_utf8_lossy(&result.stdout);
        let captures = DUR_REGEX.captures(&duration_str).ok_or_else(|| {
            error!("Unable to parse duration: {}", duration_str);
            HttpError::InternalError(None)
        })?;

        Ok(captures["duration"].parse::<u64>().unwrap())
    }

    /// Processes a video file for web embedding into the same dir as the input
    /// file. See https://developers.google.com/media/vp9/settings/vod/ and https://trac.ffmpeg.org/wiki/Encode/H.264 for reference.
    async fn generate_web_media(
        in_file: &str,
        preview_point_secs: u64,
        target_file: String,
        tmp_dir: &str,
    ) -> Result<String, HttpError> {
        let target_webm = format!("{}.webm", target_file);
        let target_mp4 = format!("{}.mp4", target_file);
        let tmp_image = format!("{}/file.jpg", tmp_dir);

        // Configure arguments for scaling and removing audio
        let mut command = Command::new("ffmpeg");
        let command = command
            .arg("-an")
            .args(&["-r", "25"])
            .args(&["-i", &in_file])
            .args(&[
                "-filter_complex",
                "[0:v]scale=320:-1,pad=320:240:(ow-iw)/2:(oh-ih)/2,split=2[webm][mp4]",
            ]);

        // Configure arguments for webm output
        let command = command
            .args(&["-map", "[webm]"])
            .args(&["-c:v", "libvpx-vp9"])
            .args(&["-crf", "37"])
            .args(&["-tile-columns", "0"])
            .args(&["-threads", "2"])
            .arg("-an")
            .arg(&target_webm);

        // Configure arguments for mp4 output
        let command = command
            .args(&["-map", "[mp4]"])
            .args(&["-c:v", "h264"])
            .args(&["-threads", "2"])
            .arg("-an")
            .arg(&target_mp4);

        // Configure arguments for creating a preview image
        let seek_arg = format!("00:00:{:02}", preview_point_secs);
        let command = command
            .args(&["-ss", &seek_arg])
            .args(&["-frames:v", "1"])
            .args(&["-filter:v", "scale=8:-1,pad=8:6:(ow-iw)/2:(oh-ih)/2"])
            .arg(&tmp_image);

        // Execute the command and read the resulting preview file
        let result = command.output().await.map_err(|error| {
            error!("Failed to run ffmpeg process: {}", error);
            HttpError::InternalError(None)
        })?;

        if !result.status.success() {
            error!("ffmpeg processing failed: {}", result.status);
            error!("{}", String::from_utf8_lossy(&result.stderr));
            return Err(HttpError::InternalError(None));
        }

        let mut file = File::open(tmp_image).await.map_err(|error| {
            error!("Failed to open preview image: {}", error);
            HttpError::InternalError(None)
        })?;

        let mut content = Vec::<u8>::new();
        file.read_to_end(&mut content)
            .await
            .map(move |_| base64::encode(&content))
            .map_err(|error| {
                error!("Failed to read preview image: {}", error);
                HttpError::InternalError(None)
            })
    }

    /// Gets the content length header value
    fn get_content_length(header_map: &HeaderMap) -> Result<u32, HttpError> {
        let entry = header_map
            .get(header::CONTENT_LENGTH)
            .ok_or_else(|| HttpError::BadRequest("Missing Content-Length header".into()))?;

        fn convert_error<T: Display>(error: T) -> HttpError {
            let message = format!("Invalid Content-Length value: {}", error);
            HttpError::BadRequest(message.into())
        }

        let length = entry.to_str().map_err(convert_error)?;
        length.parse::<u32>().map_err(convert_error)
    }

    fn extract_paths<'a>(path: &'a str) -> Result<(&'a str, &'a str), String> {
        // Pull out the 'version', 'root path' and 'relative path' from the path.
        lazy_static! {
            static ref PATH_REGEX: Regex =
                Regex::new(r"^v(?P<ver>\d+)/+(?P<root_path>\w+)(?:/+(?P<relative_path>.+)?)?$")
                    .unwrap();
        }

        let captures = PATH_REGEX
            .captures(path)
            .ok_or("Invalid upload-api path format".to_string())?;

        // Validate the version (currently only version #1)
        if !captures["ver"].eq("1") {
            return Err("Unsupported upload-api version".to_string());
        }

        let root_path = captures.name("root_path").unwrap().as_str();
        let relative_path = captures.name("relative_path").map_or("", |m| m.as_str());
        Ok((root_path, relative_path))
    }
}
