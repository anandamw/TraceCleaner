use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::AppHandle;
use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::io::Write;

#[derive(Serialize, Deserialize)]
struct BackupMetadata {
    timestamp: u64,
    original_paths: Vec<String>,
}

#[derive(Serialize, Clone)]
pub struct BackupItem {
    pub id: String,
    pub timestamp: u64,
    pub original_paths: Vec<String>,
    pub size_bytes: u64,
}

fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> std::io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}

fn get_dir_size(path: &Path) -> u64 {
    let mut size = 0;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.filter_map(Result::ok) {
            if let Ok(meta) = entry.metadata() {
                if meta.is_dir() {
                    size += get_dir_size(&entry.path());
                } else {
                    size += meta.len();
                }
            }
        }
    }
    size
}

#[tauri::command]
pub fn backup_traces(app: AppHandle, paths: Vec<String>) -> Result<String, String> {
    if paths.is_empty() {
        return Ok("No paths to backup".into());
    }

    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let backup_dir = app_dir.join("Backups").join(timestamp.to_string());
    
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
    
    let mut metadata_paths = Vec::new();

    for (i, path_str) in paths.iter().enumerate() {
        let path = Path::new(&path_str);
        if !path.exists() { continue; }
        
        let dest = backup_dir.join(format!("item_{}", i));
        
        if path.is_dir() {
            copy_dir_all(path, &dest).map_err(|e| e.to_string())?;
        } else if path.is_file() {
            fs::create_dir_all(&dest).unwrap_or_default();
            if let Some(file_name) = path.file_name() {
                fs::copy(path, dest.join(file_name)).map_err(|e| e.to_string())?;
            }
        }
        
        metadata_paths.push(path_str.clone());
    }

    let meta = BackupMetadata {
        timestamp,
        original_paths: metadata_paths,
    };

    let meta_json = serde_json::to_string_pretty(&meta).unwrap_or_default();
    let mut meta_file = fs::File::create(backup_dir.join("metadata.json")).map_err(|e| e.to_string())?;
    meta_file.write_all(meta_json.as_bytes()).map_err(|e| e.to_string())?;

    Ok(backup_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_backups(app: AppHandle) -> Result<Vec<BackupItem>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = app_dir.join("Backups");
    
    let mut backups = Vec::new();
    if !backup_dir.exists() { return Ok(backups); }
    
    if let Ok(entries) = fs::read_dir(backup_dir) {
        for entry in entries.filter_map(Result::ok) {
            let path = entry.path();
            if path.is_dir() {
                let meta_path = path.join("metadata.json");
                if meta_path.exists() {
                    if let Ok(meta_json) = fs::read_to_string(&meta_path) {
                        if let Ok(meta) = serde_json::from_str::<BackupMetadata>(&meta_json) {
                            let id = entry.file_name().to_string_lossy().to_string();
                            backups.push(BackupItem {
                                id,
                                timestamp: meta.timestamp,
                                original_paths: meta.original_paths,
                                size_bytes: get_dir_size(&path),
                            });
                        }
                    }
                }
            }
        }
    }
    
    backups.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(backups)
}

#[tauri::command]
pub fn restore_backup(app: AppHandle, id: String) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = app_dir.join("Backups").join(&id);
    let meta_path = backup_dir.join("metadata.json");
    
    let meta_json = fs::read_to_string(&meta_path).map_err(|e| e.to_string())?;
    let meta: BackupMetadata = serde_json::from_str(&meta_json).map_err(|e| e.to_string())?;
    
    for (i, original_path_str) in meta.original_paths.iter().enumerate() {
        let original_path = Path::new(original_path_str);
        let src_path = backup_dir.join(format!("item_{}", i));
        
        if src_path.exists() {
            if src_path.is_dir() {
                copy_dir_all(&src_path, &original_path).map_err(|e| e.to_string())?;
            } else {
                if let Some(file_name) = original_path.file_name() {
                    let src_file = src_path.join(file_name);
                    if src_file.exists() {
                        if let Some(parent) = original_path.parent() {
                            fs::create_dir_all(parent).unwrap_or_default();
                        }
                        fs::copy(src_file, original_path).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
    }
    
    Ok("Backup restored successfully".to_string())
}

#[tauri::command]
pub fn delete_backup(app: AppHandle, id: String) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = app_dir.join("Backups").join(&id);
    fs::remove_dir_all(&backup_dir).map_err(|e| e.to_string())?;
    Ok("Backup deleted".to_string())
}
