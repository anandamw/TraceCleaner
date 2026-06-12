use crate::models::Application;
use winreg::enums::*;
use winreg::{HKEY, RegKey};

const UNINSTALL_KEYS: &[(&str, HKEY)] = &[
    ("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall", HKEY_LOCAL_MACHINE),
    ("SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall", HKEY_LOCAL_MACHINE),
    ("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall", HKEY_CURRENT_USER),
];

pub fn scan_registry() -> Result<Vec<Application>, std::io::Error> {
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

                    let version: String = app_key.get_value("DisplayVersion").unwrap_or_default();
                    let publisher: String = app_key.get_value("Publisher").unwrap_or_default();
                    let install_location: String = app_key.get_value("InstallLocation").unwrap_or_default();
                    let uninstall_string: String = app_key.get_value("UninstallString").unwrap_or_default();
                    
                    let app = Application {
                        id: None,
                        name: display_name,
                        version: if version.is_empty() { None } else { Some(version) },
                        publisher: if publisher.is_empty() { None } else { Some(publisher) },
                        install_path: if install_location.is_empty() { None } else { Some(install_location) },
                        uninstall_command: if uninstall_string.is_empty() { None } else { Some(uninstall_string) },
                        install_date: None, // Can be parsed if needed
                        install_size_bytes: None,
                        is_64bit: None,
                        source: "registry".to_string(),
                    };
                    apps.push(app);
                }
            }
        }
    }

    Ok(apps)
}
