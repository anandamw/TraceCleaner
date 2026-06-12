use winreg::enums::*;
use winreg::RegKey;
use serde::Serialize;

#[derive(Serialize)]
pub struct StartupApp {
    pub name: String,
    pub command: String,
    pub location: String, // e.g. "HKCU" or "HKLM"
}

#[tauri::command]
pub fn get_startup_apps() -> Result<Vec<StartupApp>, String> {
    let mut apps = Vec::new();
    let keys = vec![
        (HKEY_CURRENT_USER, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", "HKCU"),
        (HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", "HKLM"),
        (HKEY_LOCAL_MACHINE, "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run", "HKLM (WOW64)"),
    ];

    for (hkey, path, loc_prefix) in keys {
        let root = RegKey::predef(hkey);
        if let Ok(key) = root.open_subkey(path) {
            for (name, _) in key.enum_values().filter_map(Result::ok) {
                if let Ok(cmd) = key.get_value::<String, _>(&name) {
                    apps.push(StartupApp {
                        name,
                        command: cmd,
                        location: loc_prefix.to_string(),
                    });
                }
            }
        }
    }

    Ok(apps)
}

#[tauri::command]
pub fn remove_startup_app(name: String, location: String) -> Result<(), String> {
    let (hkey, path) = match location.as_str() {
        "HKCU" => (HKEY_CURRENT_USER, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"),
        "HKLM" => (HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"),
        "HKLM (WOW64)" => (HKEY_LOCAL_MACHINE, "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run"),
        _ => return Err("Unknown location".to_string()),
    };
    
    let root = RegKey::predef(hkey);
    let key = root.open_subkey_with_flags(path, KEY_SET_VALUE).map_err(|e| e.to_string())?;
    key.delete_value(&name).map_err(|e| e.to_string())?;
    
    Ok(())
}
