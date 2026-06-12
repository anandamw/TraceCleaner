pub const INIT_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    version TEXT,
    publisher TEXT,
    install_path TEXT,
    uninstall_command TEXT,
    install_date TEXT,
    install_size_bytes INTEGER,
    is_64bit BOOLEAN,
    source TEXT,
    last_scanned_at TEXT
);

CREATE TABLE IF NOT EXISTS traces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER NOT NULL,
    trace_type TEXT NOT NULL,
    path TEXT NOT NULL,
    size_bytes INTEGER,
    last_modified TEXT,
    is_residual BOOLEAN,
    verified BOOLEAN,
    FOREIGN KEY(app_id) REFERENCES applications(id)
);
"#;
