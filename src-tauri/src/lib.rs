pub mod db;
pub mod models;
pub mod scanner;
pub mod remover;
pub mod optimizer;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            db::init_db(app.handle()).expect("Failed to initialize database");
            
            let show_i = MenuItemBuilder::new("Show Optim").id("show").build(app)?;
            let hide_i = MenuItemBuilder::new("Hide").id("hide").build(app)?;
            let quit_i = MenuItemBuilder::new("Quit").id("quit").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&show_i, &hide_i, &quit_i]).build()?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(true)
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Optim")
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "quit" => app.exit(0),
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::DoubleClick { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            scanner::scan_installed_apps,
            scanner::get_app_traces,
            scanner::scan_residual_traces,
            scanner::junk::scan_system_junk,
            scanner::junk::clean_system_junk,
            optimizer::startup::get_startup_apps,
            optimizer::startup::remove_startup_app,
            optimizer::large_files::scan_large_files,
            optimizer::large_files::delete_large_file,
            optimizer::browser::scan_browsers,
            optimizer::services::get_services,
            optimizer::services::toggle_service,
            optimizer::network::get_open_ports,
            optimizer::network::kill_port_process,
            remover::execute_uninstaller,
            remover::delete_traces,
            remover::backup::backup_traces,
            remover::backup::get_backups,
            remover::backup::restore_backup,
            remover::backup::delete_backup,
            remover::shredder::secure_delete
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
