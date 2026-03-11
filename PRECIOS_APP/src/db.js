import Database from '@tauri-apps/plugin-sql';
import { ejecutarMigraciones, inicializarMigraciones, obtenerVersionActual, registrarVersionInstalada } from './migrations.js';
import { inicializarBackups } from './backup.js';

// MODIFICACIÓN: En Tauri v2, fs y path están en paquetes separados
import { readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';

let dbInstance = null;

/**
 * Verifica si hay una restauración pendiente y la completa
 */
async function verificarRestauracionPendiente() {
    try {
        const appData = await appDataDir();
        const restoreFile = `${appData}/sistema.db.restore`;
        
        // Intentar leer el archivo de instrucción de restauración
        const contenido = await readFile(restoreFile);
        const backupPath = new TextDecoder().decode(contenido).trim();
        
        // Leer el contenido del backup
        const backupContent = await readFile(backupPath);
        
        // Escribir el contenido en la BD actual
        const dbPath = `${appData}/sistema.db`;
        await writeFile(dbPath, backupContent);
        
        console.log('✓ Restauración completada');
        
        // Eliminar el archivo de instrucción
        await removeFile(restoreFile);
    } catch (error) {
        // Manejo modular de errores: No detenemos la app si no hay restauración pendiente
        if (error && error.message && !error.message.includes('No such file')) {
            console.warn('Advertencia en restauración pendiente:', error.message);
        }
    }
}

export async function iniciarBaseDeDatos() {
    if (dbInstance) return dbInstance;

    try {
        // Verificar si hay una restauración pendiente antes de cargar el archivo SQL
        await verificarRestauracionPendiente();
        dbInstance = await Database.load('sqlite:sistema.db');
        
        // 1. Tabla de Productos
        await dbInstance.execute(`
            CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                categoria TEXT NOT NULL,
                stock TEXT NOT NULL,
                precio_costo REAL NOT NULL,
                precio_venta REAL NOT NULL,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        try {
            await dbInstance.execute("ALTER TABLE productos ADD COLUMN iva REAL DEFAULT 21");
        } catch (e) { /* Columna ya existe */ }

        // 2. Sesiones de Caja (Estructura escalable para auditoría)
        await dbInstance.execute(`
            CREATE TABLE IF NOT EXISTS cajas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_cierre DATETIME,
                estado TEXT DEFAULT 'ABIERTA',
                nombre_empleado TEXT
            )
        `);
        
        try {
            await dbInstance.execute("ALTER TABLE cajas ADD COLUMN nombre_empleado TEXT");
        } catch (e) { /* Columna ya existe */ }

        // 3. Tabla de Ventas (Vinculada a caja)
        await dbInstance.execute(`
            CREATE TABLE IF NOT EXISTS ventas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                caja_id INTEGER NOT NULL,
                total REAL NOT NULL,
                metodo_pago TEXT NOT NULL DEFAULT 'Efectivo',
                monto_efectivo REAL,
                monto_transferencia REAL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (caja_id) REFERENCES cajas(id)
            )
        `);
        
        try { await dbInstance.execute("ALTER TABLE ventas ADD COLUMN monto_efectivo REAL"); } catch (e) {}
        try { await dbInstance.execute("ALTER TABLE ventas ADD COLUMN monto_transferencia REAL"); } catch (e) {}

        // 4. Tabla de Detalles
        await dbInstance.execute(`
            CREATE TABLE IF NOT EXISTS detalle_ventas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                venta_id INTEGER,
                producto_id INTEGER,
                producto_nombre TEXT NOT NULL,
                cantidad INTEGER NOT NULL,
                precio_unitario REAL NOT NULL,
                subtotal REAL NOT NULL,
                FOREIGN KEY (venta_id) REFERENCES ventas(id)
            )
        `);

        // Lógica de negocio: Garantizar siempre una caja abierta
        const cajasAbiertas = await dbInstance.select("SELECT * FROM cajas WHERE estado = 'ABIERTA'");
        if (cajasAbiertas.length === 0) {
            await dbInstance.execute("INSERT INTO cajas (estado) VALUES ('ABIERTA')");
        }

        // ========== SISTEMA DE MIGRACIONES ==========
        await inicializarMigraciones(dbInstance);
        const versionAntes = await obtenerVersionActual(dbInstance);
        await ejecutarMigraciones(dbInstance);
        const versionDespues = await obtenerVersionActual(dbInstance);
        
        if (versionAntes !== versionDespues) {
            await registrarVersionInstalada(dbInstance, versionDespues, versionAntes);
        }

        // ========== SISTEMA DE BACKUPS ==========
        await inicializarBackups();

        console.log("✅ Motor de Base de Datos inicializado correctamente.");
        return dbInstance;
        
    } catch (error) {
        console.error("Error crítico en la inicialización de la BD:", error);
        throw error;
    }
}

export function obtenerBaseDatos() {
    if (!dbInstance) {
        throw new Error('Base de datos no inicializada. Llama primero a iniciarBaseDeDatos()');
    }
    return dbInstance;
}

export async function limpiarBaseDeDatos() {
    if (!dbInstance) throw new Error('Base de datos no inicializada');
    
    try {
        await dbInstance.execute('DELETE FROM detalle_ventas');
        await dbInstance.execute('DELETE FROM ventas');
        await dbInstance.execute('DELETE FROM productos');
        await dbInstance.execute('DELETE FROM cajas');
        await dbInstance.execute("INSERT INTO cajas (estado) VALUES ('ABIERTA')");
        
        console.log('✓ Datos eliminados. Estructura preservada.');
        return true;
    } catch (error) {
        console.error('Error al limpiar la base de datos:', error);
        throw error;
    }
}