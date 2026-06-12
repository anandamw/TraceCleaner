pub mod backup;
pub mod shredder;

use std::fs;
use std::path::Path;
use std::process::Command;

#[tauri::command]
pub fn execute_uninstaller(command: String) -> Result<String, String> {
    if command.is_empty() {
        return Err("Uninstall command is empty".to_string());
    }

    // Basic command parsing for MVP
    let parts: Vec<&str> = command.split_whitespace().collect();
    let program = parts[0];
    let args = &parts[1..];

    match Command::new(program).args(args).spawn() {
        Ok(_) => {
            Ok(format!("Started uninstaller: {}", program))
        }
        Err(e) => Err(format!("Failed to start uninstaller: {}", e))
    }
}

#[tauri::command]
pub fn delete_traces(paths: Vec<String>) -> Result<usize, String> {
    let mut deleted_count = 0;
    
    for path_str in paths {
        if path_str.starts_with("HKEY_") {
            let (hkey_str, subkey) = path_str.split_once('\\').unwrap_or((&path_str, ""));
            if subkey.is_empty() { continue; }

            let short_hkey = match hkey_str {
                "HKEY_CURRENT_USER" => "HKCU",
                "HKEY_LOCAL_MACHINE" => "HKLM",
                _ => continue,
            };

            let reg_path = format!("{}\\{}", short_hkey, subkey);
            if Command::new("reg").args(["delete", &reg_path, "/f"]).output().is_ok() {
                deleted_count += 1;
            }
        } else {
            let path = Path::new(&path_str);
            if path.exists() {
                if path.is_dir() {
                    if fs::remove_dir_all(path).is_ok() {
                        deleted_count += 1;
                    }
                } else if path.is_file() {
                    if fs::remove_file(path).is_ok() {
                        deleted_count += 1;
                    }
                }
            }
        }
    }
    
    Ok(deleted_count)
}
