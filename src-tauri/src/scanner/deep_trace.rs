use crate::models::Trace;
use std::env;
use std::path::{Path, PathBuf};

fn is_ignored(path: &str, ignore_list: &[String]) -> bool {
    let lower_path = path.to_lowercase();
    ignore_list.iter().any(|ignore| lower_path.contains(&ignore.to_lowercase()))
}

fn search_dir_for_app(dir: &Path, app_name: &str, publisher: Option<&str>, traces: &mut Vec<Trace>, app_id: i64, ignore_list: &[String]) {
    if !dir.exists() {
        return;
    }
    
    // We look for folders matching the app_name or publisher.
    let patterns = vec![
        app_name.to_lowercase(),
        app_name.replace(" ", "").to_lowercase(),
    ];
    
    let pub_patterns = if let Some(p) = publisher {
        if p.is_empty() { vec![] } else { vec![p.to_lowercase(), p.replace(" ", "").to_lowercase()] }
    } else {
        vec![]
    };

    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.filter_map(Result::ok) {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_dir() {
                    let file_name = entry.file_name().to_string_lossy().to_lowercase();
                    let path_str = entry.path().to_string_lossy().to_string();
                    
                    if is_ignored(&path_str, ignore_list) {
                        continue;
                    }
                    
                    let mut matched = false;
                    for pat in &patterns {
                        if file_name.contains(pat) {
                            matched = true;
                            break;
                        }
                    }
                    if !matched {
                        for pat in &pub_patterns {
                            if file_name.contains(pat) {
                                matched = true;
                                break;
                            }
                        }
                    }

                    if matched {
                        traces.push(Trace {
                            id: None,
                            app_id,
                            trace_type: "folder".to_string(),
                            path: path_str,
                            size_bytes: None,
                            is_residual: false,
                            verified: true,
                        });
                    }
                }
            }
        }
    }
}

pub fn scan_app_traces(app_id: i64, app_name: &str, publisher: Option<String>, ignore_list: Vec<String>) -> Result<Vec<Trace>, String> {
    let mut traces = Vec::new();
    let mut dirs_to_check = Vec::new();
    
    if let Ok(appdata) = env::var("APPDATA") { dirs_to_check.push(PathBuf::from(appdata)); }
    if let Ok(localappdata) = env::var("LOCALAPPDATA") { dirs_to_check.push(PathBuf::from(localappdata)); }
    if let Ok(programdata) = env::var("PROGRAMDATA") { dirs_to_check.push(PathBuf::from(programdata)); }
    if let Ok(programfiles) = env::var("ProgramFiles") { dirs_to_check.push(PathBuf::from(programfiles)); }
    if let Ok(programfiles86) = env::var("ProgramFiles(x86)") { dirs_to_check.push(PathBuf::from(programfiles86)); }

    for dir in dirs_to_check {
        search_dir_for_app(&dir, app_name, publisher.as_deref(), &mut traces, app_id, &ignore_list);
    }
    
    Ok(traces)
}
