use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Application {
    pub id: Option<i64>,
    pub name: String,
    pub version: Option<String>,
    pub publisher: Option<String>,
    pub install_path: Option<String>,
    pub uninstall_command: Option<String>,
    pub install_date: Option<String>,
    pub install_size_bytes: Option<u64>,
    pub is_64bit: Option<bool>,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Trace {
    pub id: Option<i64>,
    pub app_id: i64,
    pub trace_type: String,
    pub path: String,
    pub size_bytes: Option<u64>,
    pub is_residual: bool,
    pub verified: bool,
}
