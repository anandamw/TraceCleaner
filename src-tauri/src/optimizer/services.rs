use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct WinService {
    #[serde(rename = "Name")]
    pub name: String,
    #[serde(rename = "DisplayName")]
    pub display_name: String,
    #[serde(rename = "Status")]
    pub status: String,
}

#[tauri::command]
pub fn get_services() -> Result<Vec<WinService>, String> {
    // Convert status to string to avoid integer enum parsing issues across PowerShell versions.
    let script = "Get-Service | Select-Object Name, DisplayName, @{Name='Status';Expression={$_.Status.ToString()}} | ConvertTo-Json -Compress";
    
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", script])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("PowerShell error: {}", err));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    
    let mut services: Vec<WinService> = serde_json::from_str(&json_str).map_err(|e| format!("JSON parsing failed: {} | Output: {}", e, json_str.chars().take(100).collect::<String>()))?;
    
    // Sort so running services are first, then alphabetically
    services.sort_by(|a, b| {
        if a.status == "Running" && b.status != "Running" {
            std::cmp::Ordering::Less
        } else if a.status != "Running" && b.status == "Running" {
            std::cmp::Ordering::Greater
        } else {
            a.display_name.cmp(&b.display_name)
        }
    });

    Ok(services)
}

#[tauri::command]
pub fn toggle_service(name: String, action: String) -> Result<String, String> {
    if action != "Start" && action != "Stop" {
        return Err("Invalid action".to_string());
    }

    let cmd = format!("{}-Service -Name '{}' -Force", action, name);
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", &cmd])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to {} service: {}", action, err));
    }

    Ok(format!("Successfully {}ed service {}", action, name))
}
