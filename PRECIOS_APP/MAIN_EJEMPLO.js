/**
 * EJEMPLO DE INTEGRACIÓN EN main.js
 * 
 * Copia y adapta el código que necesites a tu main.js actual
 * Este archivo es una referencia completa
 */

import { iniciarBaseDatos, obtenerBaseDatos } from './db.js';
import { abrirMantenimiento } from './mantenimiento.js';

let dbInstance = null;

/**
 * Función principal de inicialización
 * Llamar esta función al cargar la página
 */
export async function inicializarApp() {
    try {
        console.log('=== Iniciando PRECIOS APP ===\n');

        // 1. INICIALIZAR BASE DE DATOS (incluye migraciones y backups automáticos)
        dbInstance = await iniciarBaseDatos();
        console.log('✓ BD inicializada correctamente\n');

        // 2. CONFIGURAR BOTONES DE LA UI
        configurarEventListeners();
        console.log('✓ Interfaz configurada\n');

        // 3. CARGAR DATOS INICIALES
        // await cargarProductos();

        // 4. INICIAR LOGICA DEL APP
        // ... tu código aquí

        console.log('✅ App completamente cargada\n');

    } catch (error) {
        console.error('❌ Error crítico al inicializar:', error);
        mostrarErrorFatal(error);
    }
}

/**
 * Configura todos los event listeners
 */
function configurarEventListeners() {
    // Botón de configuración/mantenimiento
    const btnMantenimiento = document.getElementById('btn-mantenimiento');
    if (btnMantenimiento) {
        btnMantenimiento.addEventListener('click', () => {
            console.log('Abriendo panel de mantenimiento...');
            abrirMantenimiento();
        });
    }

    // Otros botones de tu app
    // const btnVentas = document.getElementById('btn-ventas');
    // if (btnVentas) {
    //     btnVentas.addEventListener('click', abrirVentas);
    // }
}

/**
 * Ejemplo: Como obtener la BD en otros módulos
 */
export function miOtroModulo() {
    const db = obtenerBaseDatos();
    
    // Ahora puedes usar db para tus operaciones
    // db.select("SELECT * FROM productos");
    // etc
}

/**
 * Muestra un error fatal en pantalla
 */
function mostrarErrorFatal(error) {
    const page = document.querySelector('body');
    page.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #f44336;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
        ">
            <div>
                <h1>❌ Error al inicializar la aplicación</h1>
                <p style="font-size: 16px; margin: 20px 0;">
                    ${error.message}
                </p>
                <p style="font-size: 12px; color: rgba(255,255,255,0.7);">
                    Abre la consola (F12) para más detalles
                </p>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: white;
                    color: #f44336;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                ">Reintentar</button>
            </div>
        </div>
    `;
}

// Llamar al iniciar la página
document.addEventListener('DOMContentLoaded', inicializarApp);

/**
 * EJEMPLO: Agregar botón de mantenimiento en tu HTML
 * 
 * Agrégalo en tu index.html en la barra de navegación:
 * 
 * <button id="btn-mantenimiento" class="btn" title="Configuración">
 *     🛠️ Mantenimiento
 * </button>
 */

/**
 * EJEMPLO: Crear un backup antes de operación critica
 */
async function backupAntesCambioImportante(descripcion) {
    try {
        const resultado = await crearBackup(null, `backup_${descripcion}.db`);
        console.log(`✓ Backup de seguridad creado: ${resultado.nombre}`);
        return true;
    } catch (error) {
        console.error('No se pudo crear backup:', error);
        return false;
    }
}

/**
 * EJEMPLO: Registrar una acción importante para auditoría
 */
async function registrarAccionImportante(tipoAccion, detalles, usuario) {
    try {
        const db = obtenerBaseDatos();
        
        // Si lo necesitas, puedes crear una tabla de auditoría:
        // await db.execute(`
        //     CREATE TABLE IF NOT EXISTS auditoria (
        //         id INTEGER PRIMARY KEY,
        //         tipo_accion TEXT,
        //         detalles TEXT,
        //         usuario TEXT,
        //         fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        //     )
        // `);
        
        // await db.execute(
        //     'INSERT INTO auditoria (tipo_accion, detalles, usuario) VALUES (?, ?, ?)',
        //     [tipoAccion, detalles, usuario]
        // );
        
        console.log(`📝 Acción registrada: ${tipoAccion}`);
    } catch (error) {
        console.error('Error registrando acción:', error);
    }
}

/**
 * EJEMPLO: Verificar integridad de la BD
 */
async function verificarIntegridadBD() {
    try {
        const db = obtenerBaseDatos();
        
        // SQLite tiene comandos para verificar integridad
        const resultado = await db.select("PRAGMA integrity_check");
        
        if (resultado[0] === 'ok') {
            console.log('✓ BD integra y consistente');
            return true;
        } else {
            console.error('⚠️ Problemas de integridad detectados:', resultado);
            return false;
        }
    } catch (error) {
        console.error('Error verificando BD:', error);
        return false;
    }
}

/**
 * EJEMPLO: Optimizar BD (limpiar espacio)
 */
async function optimizarBD() {
    try {
        const db = obtenerBaseDatos();
        
        console.log('Optimizando BD...');
        await db.execute("VACUUM");
        await db.execute("ANALYZE");
        console.log('✓ BD optimizada');
        
    } catch (error) {
        console.error('Error optimizando BD:', error);
    }
}

export {
    inicializarApp,
    backupAntesCambioImportante,
    registrarAccionImportante,
    verificarIntegridadBD,
    optimizarBD
};
