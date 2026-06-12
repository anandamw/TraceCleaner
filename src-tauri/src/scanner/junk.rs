use std::fs;
use std::path::{Path, PathBuf};
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct JunkItem {
    pub path: String,
    pub size_bytes: u64,
    pub category: String,
}

#[derive(Serialize)]
pub struct JunkScanResult {
    pub items: Vec<JunkItem>,
    pub total_size_bytes: u64,
}

fn get_dir_items(dir_path: &Path, category: &str, items: &mut Vec<JunkItem>) -> u64 {
    let mut total_size = 0;
    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.filter_map(Result::ok) {
            let path = entry.path();
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    let size = meta.len();
                    total_size += size;
                    items.push(JunkItem {
                        path: path.to_string_lossy().to_string(),
                        size_bytes: size,
                        category: category.to_string(),
                    });
                } else if meta.is_dir() {
                    // Recursive
                    total_size += get_dir_items(&path, category, items);
                }
            }
        }
    }
    total_size
}

#[tauri::command]
pub fn scan_system_junk() -> Result<JunkScanResult, String> {
    let mut items = Vec::new();
    let mut total_size = 0;

    // 1. User Temp (usually %TEMP% -> C:\Users\User\AppData\Local\Temp)
    if let Ok(temp_dir) = std::env::var("TEMP") {
        let temp_path = PathBuf::from(temp_dir);
        if temp_path.exists() {
            total_size += get_dir_items(&temp_path, "User Temporary Files", &mut items);
        }
    }

    // 2. Windows Temp (usually %WINDIR%\Temp)
    if let Ok(win_dir) = std::env::var("WINDIR") {
        let win_temp = PathBuf::from(win_dir).join("Temp");
        if win_temp.exists() {
            total_size += get_dir_items(&win_temp, "System Temporary Files", &mut items);
        }
    }

    // 3. Recycle Bin
    let recycle_bin = PathBuf::from("C:\\$Recycle.Bin");
    if recycle_bin.exists() {
        total_size += get_dir_items(&recycle_bin, "Recycle Bin", &mut items);
    }
    
    // Sort by size descending
    items.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));

    Ok(JunkScanResult {
        items,
        total_size_bytes: total_size,
    })
}

#[tauri::command]
pub fn clean_system_junk(paths: Vec<String>) -> Result<usize, String> {
    let mut deleted_count = 0;
    for path_str in paths {
        let path = Path::new(&path_str);
        if path.exists() && path.is_file() {
            if fs::remove_file(path).is_ok() {
                deleted_count += 1;
            }
        }
    }
    Ok(deleted_count)
}
