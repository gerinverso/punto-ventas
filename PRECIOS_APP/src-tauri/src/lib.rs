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
    fs::copy(&db_path, &backup_path).map_err(|e| format!("Error copiando BD: {}", e))?;

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

    // Restaurar el backup (copiar archivo de vuelta)
    fs::copy(&backup_path, &db_path).map_err(|e| format!("Error restaurando backup: {}", e))?;

    Ok(format!("Backup restaurado exitosamente: {}", nombre_backup))
}

/// Comando para obtener información de un backup (tamaño, fecha, etc)
#[tauri::command]
fn obtener_info_backup(
    app_handle: AppHandle,
    nombre_backup: String,
) -> Result<serde_json::Value, String> {
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

#[tauri::command]
fn listar_backups(app_handle: AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio de app: {}", e))?;

    let backup_dir = app_data_dir.join("backups");
    let mut backups = Vec::new();

    if backup_dir.exists() {
        if let Ok(entries) = fs::read_dir(backup_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("db") {
                    let nombre = path
                        .file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .into_owned();

                    if let Ok(metadata) = fs::metadata(&path) {
                        let tamaño_mb = format!("{:.2}", metadata.len() as f64 / (1024.0 * 1024.0));

                        let hace = if let Ok(time_to_use) =
                            metadata.created().or_else(|_| metadata.modified())
                        {
                            let duration = std::time::SystemTime::now()
                                .duration_since(time_to_use)
                                .unwrap_or_default();
                            let secs = duration.as_secs();
                            if secs < 60 {
                                "hace un momento".to_string()
                            } else if secs < 3600 {
                                format!("hace {} minutos", secs / 60)
                            } else if secs < 86400 {
                                format!("hace {} horas", secs / 3600)
                            } else {
                                format!("hace {} días", secs / 86400)
                            }
                        } else {
                            "fecha desconocida".to_string()
                        };

                        backups.push(serde_json::json!({
                            "nombre": nombre,
                            "tamaño_mb": tamaño_mb,
                            "hace": hace
                        }));
                    }
                }
            }
        }
    }

    backups.sort_by(|a, b| {
        let name_a = a["nombre"].as_str().unwrap_or("");
        let name_b = b["nombre"].as_str().unwrap_or("");
        name_b.cmp(name_a)
    });

    Ok(backups)
}

#[tauri::command]
fn eliminar_backup(app_handle: AppHandle, nombre_backup: String) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio de app: {}", e))?;

    let backup_path = app_data_dir.join("backups").join(&nombre_backup);
    if backup_path.exists() {
        fs::remove_file(backup_path).map_err(|e| format!("Error eliminando backup: {}", e))?;
        Ok(format!("Backup eliminado: {}", nombre_backup))
    } else {
        Err(format!("El backup no existe: {}", nombre_backup))
    }
}

#[tauri::command]
fn abrir_carpeta_backups(app_handle: AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio de app: {}", e))?;

    let backup_dir = app_data_dir.join("backups");
    let _ = fs::create_dir_all(&backup_dir);

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&backup_dir)
            .spawn()
            .map_err(|e| format!("Error abriendo explorador: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("open")
            .arg(&backup_dir)
            .spawn()
            .map_err(|e| format!("Error abriendo explorador alternativo: {}", e))?;
    }

    Ok("Carpeta abierta".to_string())
}

#[tauri::command]
fn importar_backup_nativo(app_handle: AppHandle, path_origen: String) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio de app: {}", e))?;

    let backup_dir = app_data_dir.join("backups");
    let _ = fs::create_dir_all(&backup_dir);

    let src_path = std::path::Path::new(&path_origen);
    let filename = src_path
        .file_name()
        .ok_or("Ruta de archivo inválida")?
        .to_string_lossy();

    let dest_name = format!(
        "importado_{}_{}",
        chrono::Local::now().format("%Y%m%d_%H%M%S"),
        filename
    );
    let dest_path = backup_dir.join(&dest_name);

    fs::copy(&src_path, &dest_path).map_err(|e| format!("Error importando el archivo: {}", e))?;

    Ok(dest_name)
}

#[tauri::command]
fn obtener_hwid() -> Result<String, String> {
    machine_uid::get().map_err(|e| format!("Error obteniendo HWID: {}", e))
}

#[tauri::command]
fn validar_licencia(app_handle: AppHandle) -> Result<bool, String> {
    let app_data_dir = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Error obteniendo directorio de app: {}", e))?;
        
    let licencia_path = app_data_dir.join("licencia.key");
    if !licencia_path.exists() {
        return Ok(false);
    }

    let hwid = machine_uid::get().map_err(|e| format!("Error obteniendo HWID: {}", e))?;
    let content = fs::read_to_string(&licencia_path)
        .map_err(|e| format!("Error leyendo licencia: {}", e))?;
        
    if content.trim() == hwid.trim() {
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
fn instalar_licencia(app_handle: AppHandle, path_origen: String) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Error obteniendo directorio de app: {}", e))?;
        
    let _ = fs::create_dir_all(&app_data_dir);
    
    let dest_path = app_data_dir.join("licencia.key");
    let src_path = std::path::Path::new(&path_origen);
    
    fs::copy(&src_path, &dest_path)
        .map_err(|e| format!("Error instalando el archivo: {}", e))?;

    Ok("Licencia instalada".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            crear_backup,
            restaurar_backup,
            obtener_info_backup,
            listar_backups,
            eliminar_backup,
            abrir_carpeta_backups,
            importar_backup_nativo,
            obtener_hwid,
            validar_licencia,
            instalar_licencia
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
