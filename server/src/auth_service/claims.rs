use serde_derive::{
    Deserialize,
    Serialize,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    nonce: String,
    iss: String,
    sub: String,
    #[serde(rename = "screenName")]
    screen_name: String,
    #[serde(rename = "isAdmin")]
    is_admin: bool,
    exp: u64,
}

impl Claims {
    pub fn new(
        nonce: String,
        iss: String,
        sub: String,
        screen_name: String,
        is_admin: bool,
        exp: u64,
    ) -> Self {
        Self {
            nonce,
            iss,
            sub,
            screen_name,
            is_admin,
            exp,
        }
    }

    pub fn nonce(&self) -> &str {
        &self.nonce
    }

    pub fn sub(&self) -> &str {
        &self.sub
    }

    pub fn screen_name(&self) -> &str {
        &self.screen_name
    }

    pub fn exp(&self) -> &u64 {
        &self.exp
    }

    pub fn is_admin(&self) -> bool {
        self.is_admin
    }
}
