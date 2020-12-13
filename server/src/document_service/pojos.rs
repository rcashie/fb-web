use serde_derive::{
    Deserialize,
    Serialize,
};
use std::collections::HashSet;

/// Proposed item trait
pub trait Proposed {
    fn target(&self) -> &str;
}

/// Document trait
pub trait Document {
    fn get_parent(&self) -> Option<&str>;
    fn get_type(&self) -> &str;
    fn sanitize(&mut self);
}

/// Defines the implementation of the Document trait
macro_rules! impl_doc_trait {
    ($type_name:ident, $self_:ident, $parent:expr) => {
        impl Document for $type_name {
            fn get_parent(&$self_) -> Option<&str> {
                $parent
            }

            fn get_type(&$self_) -> &str{
                $self_.doc_type.as_str()
            }

            fn sanitize(&mut $self_) {
                // Trim the white space on title and attributes
                $self_.title = $self_.title.trim().to_owned();
                for attr in &mut $self_.attributes {
                    attr.title = attr.title.trim().to_owned();
                    attr.value = attr.value.trim().to_owned();
                }

                // Trim and remove duplicate or empty names
                let mut names = HashSet::with_capacity($self_.names.len());
                for name in &$self_.names {
                    let name = name.trim();
                    if !name.is_empty() {
                        names.insert(name.to_owned());
                    }
                }

                $self_.names = names.into_iter().collect();
            }
        }
    }
}

/// Document attribute information
#[derive(Serialize, Deserialize, Debug)]
pub struct Attribute {
    pub title: String,
    pub value: String,
    pub sentiment: String,
}

/// Document media information
#[derive(Serialize, Deserialize, Debug)]
pub struct Media {
    #[serde(rename = "fileName")]
    pub file_name: Option<String>,
    #[serde(rename = "previewData")]
    pub preview_data: Option<String>,
}

/// A game document
#[derive(Serialize, Deserialize, Debug)]
pub struct Game {
    pub title: String,
    #[serde(rename = "type", default = "get_type_game")]
    pub doc_type: String,
    pub attributes: Vec<Attribute>,
    pub names: Vec<String>,
    pub media: Media,
}

impl_doc_trait!(Game, self, None);

/// A character document
#[derive(Serialize, Deserialize, Debug)]
pub struct Character {
    pub title: String,
    #[serde(rename = "type", default = "get_type_char")]
    pub doc_type: String,
    pub game: String,
    pub attributes: Vec<Attribute>,
    pub names: Vec<String>,
    pub media: Media,
}

impl_doc_trait!(Character, self, Some(&self.game));

/// A move document
#[derive(Serialize, Deserialize, Debug)]
pub struct Move {
    pub title: String,
    #[serde(rename = "type", default = "get_type_move")]
    pub doc_type: String,
    pub character: String,
    pub attributes: Vec<Attribute>,
    pub names: Vec<String>,
    pub media: Media,
}

impl_doc_trait!(Move, self, Some(&self.character));

#[derive(Serialize, Debug)]
pub struct Proposal<D>
where
    D: Document + serde::Serialize,
{
    #[serde(rename = "type")]
    pub doc_type: String,
    pub target: String,
    pub created: u64,
    #[serde(rename = "lastUpdated")]
    pub last_updated: u64,
    pub status: String,
    #[serde(rename = "authorId")]
    pub author_id: String,
    #[serde(rename = "authorName")]
    pub author_name: String,
    pub document: D,
}

impl<D> Proposed for Proposal<D>
where
    D: Document + serde::Serialize,
{
    fn target(&self) -> &str {
        self.target.as_str()
    }
}

#[derive(Deserialize, Debug)]
pub struct ProposalRequest<D>
where
    D: Document,
{
    pub target: String,
    #[serde(rename = "importAs")]
    pub import_as: Option<String>,
    pub document: D,
}

fn get_type_game() -> String {
    "game".to_owned()
}

fn get_type_char() -> String {
    "character".to_owned()
}

fn get_type_move() -> String {
    "move".to_owned()
}
