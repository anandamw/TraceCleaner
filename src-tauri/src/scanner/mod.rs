pub mod registry;
pub mod deep_trace;
pub mod residual;
pub mod junk;

use crate::models::{Application, Trace};
use tauri::command;

#[command]
pub fn scan_installed_apps() -> Result<Vec<Application>, String> {
    registry::scan_registry()
        .map_err(|e| format!("Failed to scan registry: {}", e))
}

#[command]
pub fn get_app_traces(app_id: i64, app_name: String, publisher: Option<String>, ignore_list: Vec<String>) -> Result<Vec<Trace>, String> {
    deep_trace::scan_app_traces(app_id, &app_name, publisher, ignore_list)
}

#[command]
pub fn scan_residual_traces(ignore_list: Vec<String>) -> Result<Vec<Trace>, String> {
    residual::scan_residual_traces(ignore_list)
}
