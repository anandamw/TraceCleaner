use serde::{Deserialize, Serialize};

#[cfg(target_os = "windows")]
use winreg::enums::*;
#[cfg(target_os = "windows")]
use winreg::RegKey;

#[derive(Debug, Serialize, Deserialize)]
pub struct StartupApp {
    pub name: String,
    pub command: String,
    pub location: String,
}

#[tauri::command]
pub fn get_startup_apps() -> Result<Vec<StartupApp>, String> {
    #[cfg(target_os = "windows")]
    {
        let mut apps = Vec::new();
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);

        let run_paths = [
            ("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", "HKLM"),
            ("SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run", "HKLM"),
        ];

        for (path, loc) in run_paths.iter() {
            if let Ok(key) = hklm.open_subkey(path) {
                for (name, val) in key.enum_values().filter_map(|x| x.ok()) {
                    if let Ok(command) = val.to_string() {
                        apps.push(StartupApp {
                            name,
                            command,
                            location: format!("{}\\{}", loc, path),
                        });
                    }
                }
            }
        }

        let run_paths_cu = [
            ("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", "HKCU"),
        ];

        for (path, loc) in run_paths_cu.iter() {
            if let Ok(key) = hkcu.open_subkey(path) {
                for (name, val) in key.enum_values().filter_map(|x| x.ok()) {
                    if let Ok(command) = val.to_string() {
                        apps.push(StartupApp {
                            name,
                            command,
                            location: format!("{}\\{}", loc, path),
                        });
                    }
                }
            }
        }

        Ok(apps)
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(vec![])
    }
}

#[tauri::command]
pub fn remove_startup_app(name: String, location: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let root = if location.starts_with("HKLM") {
            RegKey::predef(HKEY_LOCAL_MACHINE)
        } else {
            RegKey::predef(HKEY_CURRENT_USER)
        };

        // Extract subkey path
        let parts: Vec<&str> = location.splitn(2, '\\').collect();
        if parts.len() != 2 {
            return Err("Invalid registry location".to_string());
        }

        let key = root.open_subkey_with_flags(parts[1], KEY_ALL_ACCESS)
            .map_err(|e| format!("Failed to open registry key: {}", e))?;

        key.delete_value(&name).map_err(|e| format!("Failed to delete value: {}", e))?;

        Ok(format!("Successfully disabled startup app: {}", name))
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Startup app management is only supported on Windows".to_string())
    }
}
