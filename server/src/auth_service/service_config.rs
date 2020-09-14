pub struct ServiceConfig {
    oauth: TwitterOauthConfig,
    jwt_signing_secret: String,
}

pub struct TwitterOauthConfig {
    consumer_key: String,
    consumer_secret: String,
    callback_url: String,
}

impl TwitterOauthConfig {
    pub fn new(consumer_key: String, consumer_secret: String, callback_url: String) -> Self {
        Self {
            consumer_key,
            consumer_secret,
            callback_url,
        }
    }

    pub fn consumer_key(&self) -> &str {
        &self.consumer_key
    }

    pub fn consumer_secret(&self) -> &str {
        &self.consumer_secret
    }

    pub fn callback_url(&self) -> &str {
        &self.callback_url
    }
}

impl ServiceConfig {
    pub fn new(oauth: TwitterOauthConfig, jwt_signing_secret: String) -> Self {
        Self {
            oauth,
            jwt_signing_secret,
        }
    }

    pub fn jwt_signing_secret(&self) -> &[u8] {
        &self.jwt_signing_secret.as_bytes()
    }

    pub fn twitter_oauth(&self) -> &TwitterOauthConfig {
        &self.oauth
    }
}
