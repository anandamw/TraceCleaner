use crate::models::{Application, Trace};
use std::env;
use std::path::{Path, PathBuf};
use winreg::enums::*;
use winreg::HKEY;
use winreg::RegKey;

fn is_ignored(path: &str, ignore_list: &[String]) -> bool {
    let lower_path = path.to_lowercase();
    ignore_list.iter().any(|ignore| lower_path.contains(&ignore.to_lowercase()))
}

fn is_common_system_folder(name: &str) -> bool {
    let lower = name.to_lowercase();
    matches!(
        lower.as_str(),
        "microsoft" | "windows" | "intel" | "amd" | "nvidia" | "common files" | "packages" | "temp" |
        "classes" | "policies" | "clients" | "registeredapplications"
    )
}

fn scan_dir_for_orphans(dir: &Path, apps: &[Application], orphans: &mut Vec<Trace>, ignore_list: &[String]) {
    if !dir.exists() {
        return;
    }
    
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.filter_map(Result::ok) {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_dir() {
                    let file_name = entry.file_name().to_string_lossy().to_lowercase();
                    let path_str = entry.path().to_string_lossy().to_string();
                    
                    if is_common_system_folder(&file_name) || is_ignored(&path_str, ignore_list) {
                        continue;
                    }

                    let mut matched = false;
                    for app in apps {
                        let app_name = app.name.to_lowercase();
                        let app_name_no_space = app_name.replace(" ", "");
                        
                        if app_name.contains(&file_name) || file_name.contains(&app_name) ||
                           (!app_name_no_space.is_empty() && (app_name_no_space.contains(&file_name) || file_name.contains(&app_name_no_space))) {
                            matched = true;
                            break;
                        }

                        if let Some(publ) = &app.publisher {
                            let pub_lower = publ.to_lowercase();
                            let pub_no_space = pub_lower.replace(" ", "");
                            if pub_lower.contains(&file_name) || file_name.contains(&pub_lower) ||
                               (!pub_no_space.is_empty() && (pub_no_space.contains(&file_name) || file_name.contains(&pub_no_space))) {
                                matched = true;
                                break;
                            }
                        }
                    }

                    if !matched {
                        orphans.push(Trace {
                            id: None,
                            app_id: 0,
                            trace_type: "folder".to_string(),
                            path: path_str,
                            size_bytes: None,
                            is_residual: true,
                            verified: true,
                        });
                    }
                }
            }
        }
    }
}

fn scan_registry_hive_for_orphans(hkey: HKEY, hive_name: &str, apps: &[Application], orphans: &mut Vec<Trace>, ignore_list: &[String]) {
    let hk = RegKey::predef(hkey);
    let software_key = match hk.open_subkey("Software") {
        Ok(k) => k,
        Err(_) => return,
    };

    for key_name in software_key.enum_keys().filter_map(Result::ok) {
        let path_str = format!("{}\\{}", hive_name, key_name);
        if is_common_system_folder(&key_name) || is_ignored(&path_str, ignore_list) {
            continue;
        }

        let mut matched = false;
        let file_name = key_name.to_lowercase();

        for app in apps {
            let app_name = app.name.to_lowercase();
            let app_name_no_space = app_name.replace(" ", "");
            
            if app_name.contains(&file_name) || file_name.contains(&app_name) ||
               (!app_name_no_space.is_empty() && (app_name_no_space.contains(&file_name) || file_name.contains(&app_name_no_space))) {
                matched = true;
                break;
            }

            if let Some(publ) = &app.publisher {
                let pub_lower = publ.to_lowercase();
                let pub_no_space = pub_lower.replace(" ", "");
                if pub_lower.contains(&file_name) || file_name.contains(&pub_lower) ||
                   (!pub_no_space.is_empty() && (pub_no_space.contains(&file_name) || file_name.contains(&pub_no_space))) {
                    matched = true;
                    break;
                }
            }
        }

        if !matched {
            orphans.push(Trace {
                id: None,
                app_id: 0,
                trace_type: "registry".to_string(),
                path: path_str,
                size_bytes: None,
                is_residual: true,
                verified: true,
            });
        }
    }
}

pub fn scan_residual_traces(ignore_list: Vec<String>) -> Result<Vec<Trace>, String> {
    let apps = crate::scanner::registry::scan_registry().unwrap_or_default();
    let mut orphans = Vec::new();
    
    // 1. Scan filesystem
    let mut dirs_to_check = Vec::new();
    if let Ok(appdata) = env::var("APPDATA") { dirs_to_check.push(PathBuf::from(appdata)); }
    if let Ok(localappdata) = env::var("LOCALAPPDATA") { dirs_to_check.push(PathBuf::from(localappdata)); }
    if let Ok(programdata) = env::var("PROGRAMDATA") { dirs_to_check.push(PathBuf::from(programdata)); }

    for dir in dirs_to_check {
        scan_dir_for_orphans(&dir, &apps, &mut orphans, &ignore_list);
    }
    
    // 2. Scan registry hives
    scan_registry_hive_for_orphans(HKEY_CURRENT_USER, "HKEY_CURRENT_USER\\Software", &apps, &mut orphans, &ignore_list);
    scan_registry_hive_for_orphans(HKEY_LOCAL_MACHINE, "HKEY_LOCAL_MACHINE\\Software", &apps, &mut orphans, &ignore_list);
    
    Ok(orphans)
}
