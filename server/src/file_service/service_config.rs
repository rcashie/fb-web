use std::collections::HashMap;

pub struct ServiceConfig {
    content_dir: String,
    uploads_dir: String,
    not_found_file: String,
    mime_type_map: HashMap<&'static str, &'static str>,
}

impl ServiceConfig {
    pub fn new(content_dir: String, uploads_dir: String, not_found_file: String) -> Self {
        // TODO: This should be read from a file or set for every file in an index
        let mut mime_type_map = HashMap::<&'static str, &'static str>::new();
        mime_type_map.insert("html", mime::TEXT_HTML_UTF_8.as_ref());
        mime_type_map.insert("js", mime::APPLICATION_JAVASCRIPT_UTF_8.as_ref());
        mime_type_map.insert("png", mime::IMAGE_PNG.as_ref());
        mime_type_map.insert("jpeg", mime::IMAGE_JPEG.as_ref());
        mime_type_map.insert("jpg", mime::IMAGE_JPEG.as_ref());
        mime_type_map.insert("gif", mime::IMAGE_GIF.as_ref());
        mime_type_map.insert("svg", mime::IMAGE_SVG.as_ref());
        mime_type_map.insert("webm", "video/webm");
        mime_type_map.insert("mp4", "video/mp4");

        Self {
            content_dir,
            uploads_dir,
            not_found_file,
            mime_type_map,
        }
    }

    pub fn content_dir(&self) -> &str {
        &self.content_dir
    }

    pub fn uploads_dir(&self) -> &str {
        &self.uploads_dir
    }

    pub fn not_found_file(&self) -> &str {
        &self.not_found_file
    }

    pub fn get_mime_type(&self, file_extension: &str) -> &'static str {
        match self.mime_type_map.get(file_extension) {
            Some(mime_type) => mime_type,
            None => mime::TEXT_PLAIN_UTF_8.as_ref(),
        }
    }
}
