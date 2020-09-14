pub struct ServiceConfig {
    publish_dir: String,
    video_tmp_dir: String,
    video_size_limit: u32,
}

impl ServiceConfig {
    pub fn new(publish_dir: String, video_tmp_dir: String, video_size_limit: u32) -> Self {
        Self {
            publish_dir,
            video_tmp_dir,
            video_size_limit,
        }
    }

    pub fn publish_dir(&self) -> &str {
        &self.publish_dir
    }

    pub fn video_tmp_dir(&self) -> &str {
        &self.video_tmp_dir
    }

    pub fn video_size_limit(&self) -> u32 {
        self.video_size_limit
    }
}
