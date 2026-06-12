use crate::models::Application;

#[cfg(target_os = "windows")]
use winreg::enums::*;
#[cfg(target_os = "windows")]
use winreg::{HKEY, RegKey};

#[cfg(target_os = "windows")]
const UNINSTALL_KEYS: &[(&str, HKEY)] = &[
    ("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall", HKEY_LOCAL_MACHINE),
    ("SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall", HKEY_LOCAL_MACHINE),
    ("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall", HKEY_CURRENT_USER),
];

pub fn scan_registry() -> Result<Vec<Application>, std::io::Error> {
    #[cfg(target_os = "windows")]
    {
        let mut apps = Vec::new();

        for (path, hkey) in UNINSTALL_KEYS {
            let root = RegKey::predef(*hkey);
            if let Ok(uninstall_key) = root.open_subkey(path) {
                for name in uninstall_key.enum_keys().filter_map(Result::ok) {
                    if let Ok(app_key) = uninstall_key.open_subkey(&name) {
                        let display_name: String = app_key.get_value("DisplayName").unwrap_or_default();
                        
                        if display_name.is_empty() {
                            continue;
                        }

                        let version: Option<String> = app_key.get_value("DisplayVersion").ok();
                        let publisher: Option<String> = app_key.get_value("Publisher").ok();
                        let install_path: Option<String> = app_key.get_value("InstallLocation").ok();
                        let uninstall_command: Option<String> = app_key.get_value("UninstallString").ok();
                        let display_icon: Option<String> = app_key.get_value("DisplayIcon").ok().map(|s: String| {
                            s.split(',').next().unwrap_or(&s).trim_matches('"').to_string()
                        });
                        
                        let app = Application {
                            id: None,
                            name: display_name,
                            version,
                            publisher,
                            install_path,
                            uninstall_command,
                            display_icon,
                            icon_base64: None,
                            install_date: None,
                            install_size_bytes: None,
                            is_64bit: None,
                            source: "registry".to_string(),
                        };
                        apps.push(app);
                    }
                }
            }
        }
        populate_app_icons(&mut apps);
        Ok(apps)
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(vec![])
    }
}

fn populate_app_icons(apps: &mut Vec<Application>) {
    use std::process::Command;
    use std::collections::HashMap;

    let mut script = String::from("Add-Type -AssemblyName System.Drawing;\n$res = @{};\n");
    let mut paths_to_fetch = Vec::new();

    for app in apps.iter() {
        if let Some(path) = &app.display_icon {
            let p = path.to_lowercase();
            if p.ends_with(".exe") || p.ends_with(".ico") {
                if !paths_to_fetch.contains(path) {
                    paths_to_fetch.push(path.clone());
                }
            }
        }
    }

    if paths_to_fetch.is_empty() {
        return;
    }

    for path in &paths_to_fetch {
        let safe_path = path.replace("'", "''");
        script.push_str(&format!(
            "try {{ $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('{}'); if ($icon) {{ $ms = New-Object System.IO.MemoryStream; $icon.ToBitmap().Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); $res['{}'] = [Convert]::ToBase64String($ms.ToArray()) }} }} catch {{}}\n",
            safe_path, safe_path
        ));
    }
    script.push_str("$res | ConvertTo-Json -Compress -Depth 10");

    if let Ok(output) = Command::new("powershell").args(&["-NoProfile", "-Command", &script]).output() {
        let json_str = String::from_utf8_lossy(&output.stdout);
        if let Ok(map) = serde_json::from_str::<HashMap<String, String>>(&json_str) {
            for app in apps.iter_mut() {
                if let Some(path) = &app.display_icon {
                    if let Some(b64) = map.get(path) {
                        app.icon_base64 = Some(b64.clone());
                    }
                }
            }
        }
    }
}
