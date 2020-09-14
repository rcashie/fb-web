use std::{
    sync::mpsc::channel,
    thread,
};

pub fn initialize() {
    let (tx, rx) = channel();
    thread::spawn(move || {
        while let Ok(msg) = rx.recv() {
            print!("{}", msg);
        }
    });

    fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "[{}]{}:{} {}",
                record.level(),
                record.file().unwrap_or(""),
                record.line().unwrap_or(0),
                message,
            ))
        })
        .level(log::LevelFilter::Off)
        .level_for("fb_web_server", log::LevelFilter::Info)
        .chain(tx)
        .apply()
        .unwrap();
}
