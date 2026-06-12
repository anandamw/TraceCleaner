use std::fs::{self, OpenOptions};
use std::io::{Seek, SeekFrom, Write};
use std::path::Path;

#[tauri::command]
pub fn secure_delete(path: String, passes: u32) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() || !p.is_file() {
        return Err("File not found or is not a file".to_string());
    }

    let meta = fs::metadata(p).map_err(|e| e.to_string())?;
    let size = meta.len();

    if size > 0 {
        let mut file = OpenOptions::new()
            .write(true)
            .open(p)
            .map_err(|e| format!("Failed to open file for shredding: {}", e))?;

        let buffer_size = 1024 * 1024; // 1MB buffer
        let mut buffer = vec![0u8; buffer_size];

        for pass in 0..passes {
            file.seek(SeekFrom::Start(0)).map_err(|e| e.to_string())?;
            
            let byte_fill = match pass % 3 {
                0 => 0x00,
                1 => 0xFF,
                _ => 0xAA, // Alternating bits
            };
            
            buffer.fill(byte_fill);

            let mut remaining = size;
            while remaining > 0 {
                let to_write = std::cmp::min(remaining, buffer_size as u64) as usize;
                file.write_all(&buffer[..to_write]).map_err(|e| e.to_string())?;
                remaining -= to_write as u64;
            }
            
            file.sync_all().map_err(|e| e.to_string())?;
        }
    }

    fs::remove_file(p).map_err(|e| format!("Failed to delete after shredding: {}", e))?;

    Ok(())
}
