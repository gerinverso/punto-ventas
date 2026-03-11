use std::fs;
use tauri::{AppHandle, Manager};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Comando para crear un backup de la BD SQLite
/// Copia el archivo de BD al directorio de backups con timestamp
#[tauri::command]
fn crear_backup(app_handle: AppHandle, nombre_backup: String) -> Result<String, String> {
    // Obtener rutas
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio de app: {}", e))?;

    let db_path = app_data_dir.join("sistema.db");
    let backup_dir = app_data_dir.join("backups");

    // Crear directorio de backups si no existe
    fs::create_dir_all(&backup_dir)
        .map_err(|e| format!("Error creando directorio de backups: {}", e))?;

    // Ruta del nuevo backup
    let backup_path = backup_dir.join(&nombre_backup);

    // Copiar archivo de BD al backup
    fs::copy(&db_path, &backup_path)
        .map_err(|e| format!("Error copiando BD: {}", e))?;

    Ok(format!("Backup creado exitosamente: {}", nombre_backup))
}

/// Comando para restaurar un backup de la BD
/// Copia el archivo de backup de nuevo a la ubicación de BD actual
#[tauri::command]
fn restaurar_backup(app_handle: AppHandle, nombre_backup: String) -> Result<String, String> {
    // Obtener rutas
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio de app: {}", e))?;

    let db_path = app_data_dir.join("sistema.db");
    let backup_path = app_data_dir.join("backups").join(&nombre_backup);

    // Verificar que el backup existe
    if !backup_path.exists() {
        return Err(format!("El backup no existe: {}", nombre_backup));
    }

    // Crear un backup de seguridad del estado actual antes de restaurar
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let safe_backup = app_data_dir.join("backups").join(format!("pre_restore_backup_{}.db", timestamp));
    fs::copy(&db_path, &safe_backup)
        .map_err(|e| format!("Error creando backup de seguridad: {}", e))?;

    // Restaurar el backup (copiar archivo de vuelta)
    fs::copy(&backup_path, &db_path)
        .map_err(|e| format!("Error restaurando backup: {}", e))?;

    Ok(format!("Backup restaurado exitosamente: {}. Backup anterior guardado en pre_restore_backup_{}.db", nombre_backup, timestamp))
}

/// Comando para obtener información de un backup (tamaño, fecha, etc)
#[tauri::command]
fn obtener_info_backup(app_handle: AppHandle, nombre_backup: String) -> Result<serde_json::Value, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio de app: {}", e))?;

    let backup_path = app_data_dir.join("backups").join(&nombre_backup);

    if !backup_path.exists() {
        return Err(format!("El backup no existe: {}", nombre_backup));
    }

    let metadata = fs::metadata(&backup_path)
        .map_err(|e| format!("Error leyendo información del backup: {}", e))?;

    let tamaño_mb = metadata.len() as f64 / (1024.0 * 1024.0);

    Ok(serde_json::json!({
        "nombre": nombre_backup,
        "tamaño_bytes": metadata.len(),
        "tamaño_mb": format!("{:.2}", tamaño_mb),
        "es_archivo": metadata.is_file()
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            crear_backup,
            restaurar_backup,
            obtener_info_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
