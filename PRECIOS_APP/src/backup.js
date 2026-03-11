/**
 * SISTEMA DE BACKUPS
 * Crea, restaura y gestiona copias de seguridad de la BD
 */

import { invoke } from '@tauri-apps/api/core';

const BACKUP_DIR = 'backups';

/**
 * Inicializa el directorio de backups
 */
export async function inicializarBackups() {
    try {
        // El directorio se crea automáticamente desde Rust al crear el primer backup
        console.log('✓ Sistema de backups inicializado');
    } catch (error) {
        console.error('Error inicializando backups:', error);
    }
}

/**
 * Genera un nombre de backup con timestamp
 */
function generarNombreBackup() {
    const ahora = new Date();
    const timestamp = ahora.toISOString().replace(/[:.]/g, '-');
    return `backup_${timestamp}.db`;
}

/**
 * Crea un backup de la BD usando un comando Tauri personalizado
 */
export async function crearBackup(db, nombrePersonalizado = null) {
    try {
        console.log('💾 Creando backup...');
        
        const nombreBackup = nombrePersonalizado || generarNombreBackup();
        
        // Ejecutamos el backup usando Tauri invoke
        const resultado = await invoke('crear_backup', {
            nombreBackup: nombreBackup
        });
        
        console.log(`✓ Backup creado: ${nombreBackup}`);
        return {
            success: true,
            nombre: nombreBackup,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error creando backup:', error);
        throw new Error(`Fallo al crear backup: ${error.message}`);
    }
}

/**
 * Obtiene la lista de backups disponibles
 */
export async function listarBackups() {
    try {
        console.log('ℹ️  Obteniendo lista de backups');
        const backups = await invoke('listar_backups', {});
        return backups || [];
    } catch (error) {
        console.error('Error listando backups:', error);
        return [];
    }
}

/**
 * Restaura un backup específico
 * IMPORTANTE: Cierra la BD actual, restaura el archivo y reabre
 */
export async function restaurarBackup(nombreBackup, dbInstance) {
    try {
        console.log(`🔄 Restaurando backup: ${nombreBackup}`);
        
        // Invocar comando Tauri para restaurar
        const resultado = await invoke('restaurar_backup', {
            nombreBackup: nombreBackup
        });
        
        console.log(`✓ Backup restaurado: ${nombreBackup}`);
        
        return {
            success: true,
            nombre: nombreBackup,
            timestamp: new Date().toISOString(),
            mensaje: 'Backup restaurado correctamente. Por favor, reinicia la aplicación.'
        };
    } catch (error) {
        console.error('Error restaurando backup:', error);
        throw new Error(`Fallo al restaurar backup: ${error.message}`);
    }
}

/**
 * Elimina un backup específico
 */
export async function eliminarBackup(nombreBackup) {
    try {
        console.log(`🗑️  Eliminando backup: ${nombreBackup}`);
        const resultado = await invoke('eliminar_backup', {
            nombreBackup: nombreBackup
        });
        console.log(`✓ Backup eliminado: ${nombreBackup}`);
        return true;
    } catch (error) {
        console.error('Error eliminando backup:', error);
        throw new Error(`Fallo al eliminar backup: ${error.message}`);
    }
}

/**
 * Importa un archivo .db desde el disco local como backup
 * El usuario selecciona un archivo y se copia a la carpeta de backups
 */
export async function importarBackup() {
    try {
        console.log('📥 Importando backup desde archivo...');
        
        // Crear un input file temporal
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.db';
        fileInput.style.display = 'none';
        
        return new Promise((resolve, reject) => {
            // Timeout de 30 segundos - si no selecciona nada, rechaza
            const timeout = setTimeout(() => {
                reject(new Error('Selección de archivo cancelada o expirada'));
                document.body.removeChild(fileInput);
            }, 30000);

            fileInput.onchange = async (event) => {
                clearTimeout(timeout);
                try {
                    const file = event.target.files[0];
                    if (!file) {
                        throw new Error('No se seleccionó un archivo');
                    }

                    // Validar que sea un archivo .db
                    if (!file.name.endsWith('.db')) {
                        throw new Error('Solo se permiten archivos .db');
                    }

                    // Generar nombre único para el backup
                    const nombre = `importado_${Date.now()}_${file.name}`;
                    
                    // Leer el archivo como ArrayBuffer
                    const arrayBuffer = await file.arrayBuffer();
                    
                    // Usar Tauri fs plugin para escribir el archivo
                    const { writeFile } = await import('@tauri-apps/plugin-fs');
                    const { appDataDir } = await import('@tauri-apps/api/path');
                    
                    const appData = await appDataDir();
                    const backupDir = `${appData}/backups`;
                    const filePath = `${backupDir}/${nombre}`;
                    
                    // Escribir el archivo
                    await writeFile(filePath, new Uint8Array(arrayBuffer));
                    
                    console.log(`✓ Backup importado como: ${nombre}`);
                    resolve({
                        success: true,
                        nombre: nombre,
                        mensaje: `Backup importado: ${file.name}`
                    });
                } catch (error) {
                    console.error('Error importando archivo:', error);
                    reject(error);
                } finally {
                    // Limpiar el input del DOM
                    if (document.body.contains(fileInput)) {
                        document.body.removeChild(fileInput);
                    }
                }
            };

            // Manejar cuando el usuario cancela el diálogo
            fileInput.oncancel = () => {
                clearTimeout(timeout);
                reject(new Error('Selección de archivo cancelada'));
                if (document.body.contains(fileInput)) {
                    document.body.removeChild(fileInput);
                }
            };
            
            fileInput.click();
            document.body.appendChild(fileInput);
        });
    } catch (error) {
        console.error('Error en importarBackup:', error);
        throw new Error(`Fallo al importar backup: ${error.message}`);
    }
}

/**
 * Abre la carpeta de backups en el explorador de archivos
 */
export async function abrirCarpetaBackups() {
    try {
        console.log('📁 Abriendo carpeta de backups...');
        const resultado = await invoke('abrir_carpeta_backups', {});
        console.log(`✓ Carpeta de backups abierta`);
        return resultado;
    } catch (error) {
        console.error('Error abriendo carpeta:', error);
        throw new Error(`Fallo al abrir carpeta: ${error.message}`);
    }
}

/**
 * Obtiene información detallada de un backup
 */
export async function obtenerInfoBackup(nombreBackup) {
    try {
        const resultado = await invoke('obtener_info_backup', {
            nombreBackup: nombreBackup
        });
        return resultado;
    } catch (error) {
        console.error('Error obteniendo info de backup:', error);
        return null;
    }
}

/**
 * Sincroniza backups con una ubicación remota (Google Drive, OneDrive, etc)
 * PREMIUM FEATURE - Útil para clientes empresariales
 */
export async function sincronizarBackups(ubicacionRemota) {
    try {
        console.log('☁️  Sincronizando backups...');
        // Esta función la implementarías según tu proveedor de almacenamiento
        console.log(`Sincronización a: ${ubicacionRemota}`);
        return true;
    } catch (error) {
        console.error('Error sincronizando backups:', error);
        return false;
    }
}

export default {
    inicializarBackups,
    crearBackup,
    listarBackups,
    restaurarBackup,
    eliminarBackup,
    obtenerInfoBackup,
    sincronizarBackups
};
