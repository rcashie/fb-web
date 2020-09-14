use std::time::{
    SystemTime,
    UNIX_EPOCH,
};

/// Gets a string representation of the current time
pub fn get_timestamp_string() -> String {
    let current_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Unexpected time result.");

    current_time.as_secs().to_string()
}
