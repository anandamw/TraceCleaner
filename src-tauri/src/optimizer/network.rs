use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenPort {
    #[serde(rename = "LocalAddress")]
    pub local_address: String,
    #[serde(rename = "LocalPort")]
    pub local_port: u16,
    #[serde(rename = "PID")]
    pub pid: u32,
    #[serde(rename = "ProcessName")]
    pub process_name: String,
}

#[tauri::command]
pub fn get_open_ports() -> Result<Vec<OpenPort>, String> {
    let script = r#"
        $ports = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, OwningProcess
        $result = @()
        foreach ($p in $ports) {
            if ($p.OwningProcess -eq 0 -or $p.OwningProcess -eq 4) {
                $pName = "System"
            } else {
                $proc = Get-Process -Id $p.OwningProcess -ErrorAction SilentlyContinue
                if ($proc) {
                    $pName = $proc.ProcessName
                } else {
                    $pName = "Unknown"
                }
            }
            $result += [PSCustomObject]@{
                LocalAddress = $p.LocalAddress
                LocalPort = $p.LocalPort
                PID = $p.OwningProcess
                ProcessName = $pName
            }
        }
        @($result) | ConvertTo-Json -Compress
    "#;

    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", script])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("PowerShell error: {}", err));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    if json_str.trim().is_empty() || json_str.trim() == "null" {
        return Ok(Vec::new());
    }

    let mut ports: Vec<OpenPort> = serde_json::from_str(&json_str).map_err(|e| format!("JSON parsing failed: {} | Output: {}", e, json_str.chars().take(100).collect::<String>()))?;
    
    // Sort by Process Name then Port
    ports.sort_by(|a, b| {
        let cmp = a.process_name.cmp(&b.process_name);
        if cmp == std::cmp::Ordering::Equal {
            a.local_port.cmp(&b.local_port)
        } else {
            cmp
        }
    });

    Ok(ports)
}

#[tauri::command]
pub fn kill_port_process(pid: u32) -> Result<String, String> {
    if pid == 0 || pid == 4 {
        return Err("Cannot kill core System process. It is highly unsafe.".to_string());
    }

    let output = Command::new("taskkill")
        .args(["/F", "/PID", &pid.to_string()])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to kill process: {}", err));
    }

    Ok("Process forcefully terminated".to_string())
}
