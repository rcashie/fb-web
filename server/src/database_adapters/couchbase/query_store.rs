use std::{
    collections::HashMap,
    fs::{
        read,
        read_dir,
    },
    io::Error,
    path::Path,
};

pub struct QueryStore {
    inner_store: HashMap<String, String>,
}

impl QueryStore {
    pub fn create_from_dir<P>(path: P) -> Result<Self, Error>
    where
        P: AsRef<Path>,
    {
        let mut inner_store = HashMap::new();
        Self::load_queries_from_dir(&mut inner_store, path.as_ref(), path.as_ref())?;
        Ok(Self { inner_store })
    }

    pub fn get_query(&self, path: &str) -> Option<&str> {
        self.inner_store.get(path).map(|v| v.as_str())
    }

    fn load_queries_from_dir<P>(
        store: &mut HashMap<String, String>,
        base_path: P,
        path: P,
    ) -> Result<(), Error>
    where
        P: AsRef<Path>,
    {
        for entry in read_dir(path)? {
            let path = entry?.path();
            if path.is_dir() {
                Self::load_queries_from_dir(store, base_path.as_ref(), path.as_path())?;
            } else {
                let relative_path = path
                    .strip_prefix(base_path.as_ref())
                    .unwrap()
                    .parent()
                    .unwrap()
                    .join(path.file_stem().unwrap());

                let content = &read(path)?;
                store.insert(
                    relative_path.to_string_lossy().into(),
                    String::from_utf8_lossy(content).into(),
                );
            }
        }

        Ok(())
    }
}
