use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[derive(Serialize)]
pub struct LargeFile {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub extension: String,
    pub last_modified: u64,
}

fn scan_dir_for_large_files(dir: &Path, min_size_bytes: u64, files: &mut Vec<LargeFile>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.filter_map(Result::ok) {
            let path = entry.path();
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    let size = meta.len();
                    if size >= min_size_bytes {
                        let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                        let extension = path.extension().unwrap_or_default().to_string_lossy().to_string();
                        let modified = meta.modified().unwrap_or(SystemTime::UNIX_EPOCH)
                            .duration_since(SystemTime::UNIX_EPOCH).unwrap_or_default().as_secs();
                        
                        files.push(LargeFile {
                            path: path.to_string_lossy().to_string(),
                            name,
                            size_bytes: size,
                            extension: if extension.is_empty() { "FILE".to_string() } else { extension.to_uppercase() },
                            last_modified: modified,
                        });
                    }
                } else if meta.is_dir() {
                    // Ignore hidden folders, AppData, and node_modules to speed up scanning
                    let name = path.file_name().unwrap_or_default().to_string_lossy();
                    if !name.starts_with('.') && name != "AppData" && name != "node_modules" {
                        scan_dir_for_large_files(&path, min_size_bytes, files);
                    }
                }
            }
        }
    }
}

#[tauri::command]
pub fn scan_large_files(min_size_mb: u64) -> Result<Vec<LargeFile>, String> {
    let mut files = Vec::new();
    let min_bytes = min_size_mb * 1024 * 1024;
    
    if let Ok(home) = std::env::var("USERPROFILE") {
        let home_path = PathBuf::from(home);
        scan_dir_for_large_files(&home_path, min_bytes, &mut files);
    }

    // Sort by size descending
    files.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    
    // Cap at 100 files to prevent UI lag
    files.truncate(100);
    
    Ok(files)
}

#[tauri::command]
pub fn delete_large_file(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.exists() && p.is_file() {
        fs::remove_file(p).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("File not found or already deleted".to_string())
    }
}
