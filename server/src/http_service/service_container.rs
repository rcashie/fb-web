use crate::{
    auth_service::Service as AuthService,
    document_service::Service as DocumentService,
    file_service::Service as FileService,
    search_service::Service as SearchService,
    upload_service::Service as UploadService,
};

/// Contains services available to fulfill requests
pub struct ServiceContainer {
    auth_service: AuthService,
    file_service: FileService,
    document_service: DocumentService,
    search_service: SearchService,
    upload_service: UploadService,
}

impl ServiceContainer {
    /// Creates a new instance of the ServiceContainer struct
    pub fn new(
        auth_service: AuthService,
        file_service: FileService,
        document_service: DocumentService,
        search_service: SearchService,
        upload_service: UploadService,
    ) -> Self {
        Self {
            auth_service,
            file_service,
            document_service,
            search_service,
            upload_service,
        }
    }

    pub fn auth_service(&self) -> &AuthService {
        &self.auth_service
    }

    pub fn file_service(&self) -> &FileService {
        &self.file_service
    }

    pub fn document_service(&self) -> &DocumentService {
        &self.document_service
    }

    pub fn search_service(&self) -> &SearchService {
        &self.search_service
    }

    pub fn upload_service(&self) -> &UploadService {
        &self.upload_service
    }
}
