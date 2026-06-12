pub mod schema;

use rusqlite::{Connection, Result};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct DbState {
    pub conn: Mutex<Connection>,
}

pub fn init_db(app: &AppHandle) -> Result<()> {
    let app_dir = app.path().app_data_dir().expect("Failed to get app data dir");
    std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
    let db_path = app_dir.join("tracecleaner.db");

    let conn = Connection::open(db_path)?;
    conn.execute_batch(schema::INIT_SQL)?;

    app.manage(DbState {
        conn: Mutex::new(conn),
    });

    Ok(())
}
