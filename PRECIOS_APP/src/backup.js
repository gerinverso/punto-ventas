/**
 * SISTEMA DE BACKUPS
 * Crea, restaura y gestiona copias de seguridad de la BD
 */

import { invoke } from '@tauri-apps/api/core';
import { obtenerBaseDatos } from './db.js';

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

        // Obliga a SQLite a guardar todas las transacciones recientes al archivo principal .db para que el backup esté completamente al día.
        try {
            const dbRef = db || obtenerBaseDatos();
            if (dbRef) {
                await dbRef.execute("PRAGMA wal_checkpoint(TRUNCATE)");
            }
        } catch (e) {
            console.warn('Advertencia de checkpoint WAL:', e);
        }
        
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
        console.log('📥 Importando backup desde archivo a través de la interfaz nativa...');
        
        const { open } = await import('@tauri-apps/plugin-dialog');
        
        // Abrimos el selector de archivos nativo de forma segura a través de Tauri
        const selectedPath = await open({
            multiple: false,
            filters: [{
                name: 'Archivo de Base de Datos',
                extensions: ['db']
            }]
        });

        if (!selectedPath) {
            throw new Error('Selección de archivo cancelada');
        }

        // Ya que la interfaz nativa nos devolvió una ruta absoluta segura que el OS aprobó, 
        // instruimos al backend de rust que se traiga el archivo libremente con permisos.
        const nombreGenerado = await invoke('importar_backup_nativo', {
            pathOrigen: selectedPath
        });

        console.log(`✓ Backup importado como: ${nombreGenerado}`);
        return {
            success: true,
            nombre: nombreGenerado,
            mensaje: `Backup importado correctamente`
        };

    } catch (error) {
        console.error('Error importando archivo:', error);
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
