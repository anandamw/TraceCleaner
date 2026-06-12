use crate::scanner::junk::{JunkItem, JunkScanResult};
use std::fs;
use std::path::{Path, PathBuf};

fn get_file_or_dir_items(path: &Path, category: &str, items: &mut Vec<JunkItem>) -> u64 {
    let mut total_size = 0;
    if !path.exists() {
        return 0;
    }

    if let Ok(meta) = path.metadata() {
        if meta.is_file() {
            let size = meta.len();
            total_size += size;
            items.push(JunkItem {
                path: path.to_string_lossy().to_string(),
                size_bytes: size,
                category: category.to_string(),
            });
        } else if meta.is_dir() {
            if let Ok(entries) = fs::read_dir(path) {
                for entry in entries.filter_map(Result::ok) {
                    total_size += get_file_or_dir_items(&entry.path(), category, items);
                }
            }
        }
    }
    total_size
}

#[tauri::command]
pub fn scan_browsers() -> Result<JunkScanResult, String> {
    let mut items = Vec::new();
    let mut total_size = 0;

    if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
        let base = PathBuf::from(&local_appdata);
        
        // Chrome
        let chrome_cache = base.join("Google\\Chrome\\User Data\\Default\\Cache\\Cache_Data");
        total_size += get_file_or_dir_items(&chrome_cache, "Chrome Cache", &mut items);
        
        let chrome_history = base.join("Google\\Chrome\\User Data\\Default\\History");
        total_size += get_file_or_dir_items(&chrome_history, "Chrome History", &mut items);

        let chrome_cookies = base.join("Google\\Chrome\\User Data\\Default\\Network\\Cookies");
        total_size += get_file_or_dir_items(&chrome_cookies, "Chrome Cookies", &mut items);

        // Edge
        let edge_cache = base.join("Microsoft\\Edge\\User Data\\Default\\Cache\\Cache_Data");
        total_size += get_file_or_dir_items(&edge_cache, "Edge Cache", &mut items);
        
        let edge_history = base.join("Microsoft\\Edge\\User Data\\Default\\History");
        total_size += get_file_or_dir_items(&edge_history, "Edge History", &mut items);

        let edge_cookies = base.join("Microsoft\\Edge\\User Data\\Default\\Network\\Cookies");
        total_size += get_file_or_dir_items(&edge_cookies, "Edge Cookies", &mut items);
    }
    
    // Firefox uses roaming app data for cookies/history
    if let Ok(appdata) = std::env::var("APPDATA") {
        let firefox_profiles = PathBuf::from(&appdata).join("Mozilla\\Firefox\\Profiles");
        if firefox_profiles.exists() {
            if let Ok(entries) = fs::read_dir(&firefox_profiles) {
                for entry in entries.filter_map(Result::ok) {
                    let profile_path = entry.path();
                    
                    let cookies = profile_path.join("cookies.sqlite");
                    total_size += get_file_or_dir_items(&cookies, "Firefox Cookies", &mut items);
                    
                    let history = profile_path.join("places.sqlite");
                    total_size += get_file_or_dir_items(&history, "Firefox History", &mut items);
                }
            }
        }
    }
    
    // Firefox Cache is in LOCALAPPDATA
    if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
        let firefox_local_profiles = PathBuf::from(&local_appdata).join("Mozilla\\Firefox\\Profiles");
        if firefox_local_profiles.exists() {
            if let Ok(entries) = fs::read_dir(&firefox_local_profiles) {
                for entry in entries.filter_map(Result::ok) {
                    let cache2 = entry.path().join("cache2");
                    total_size += get_file_or_dir_items(&cache2, "Firefox Cache", &mut items);
                }
            }
        }
    }

    items.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));

    Ok(JunkScanResult {
        items,
        total_size_bytes: total_size,
    })
}
