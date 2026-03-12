/**
 * MÓDULO DE MANTENIMIENTO Y BACKUPS
 * Interfaz para gestionar backups, restauraciones y ver migraciones
 */

import { crearBackup, listarBackups, restaurarBackup, eliminarBackup, importarBackup, abrirCarpetaBackups } from './backup.js';
import { obtenerVersionActual, obtenerHistorialVersiones, obtenerInfoMigraciones } from './migrations.js';
import { limpiarBaseDeDatos } from './db.js';
import logoTitan from './assets/Titan ICONO.png';

/**
 * Carga la vista de configuración en el contenedor
 */
export async function cargarVistaConfiguracion(contenedor) {
    contenedor.innerHTML = '';

    const vista = document.createElement('div');
    vista.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 25px;">
                <img src="${logoTitan}" alt="Logo TITAN" style="max-width: 160px; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.2));">
            </div>
            <h2 style="margin-bottom: 30px; text-align: center;">⚙️ Configuración y Mantenimiento</h2>

            <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                <h3>🛡️ Licencia y Activación</h3>

                <!-- Tarjeta de estado de licencia -->
                <div id="licencia-status-card" style="
                    display: flex;
                    gap: 12px;
                    margin-bottom: 15px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 10px;
                    padding: 16px;
                    align-items: center;
                ">
                    <div style="font-size: 2.2rem;" id="licencia-icono">⏳</div>
                    <div style="flex: 1;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px;">LICENCIA</div>
                        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                            <div>
                                <div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.8px;">Estado</div>
                                <div id="licencia-estado" style="font-weight: 700; font-size: 1rem; color: #333;">Verificando...</div>
                            </div>
                            <div>
                                <div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.8px;">Vence</div>
                                <div id="licencia-vence" style="font-weight: 700; font-size: 1rem; color: #333;">—</div>
                            </div>
                            <div>
                                <div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.8px;">Restante</div>
                                <div id="licencia-restante" style="font-weight: 700; font-size: 1rem; color: #333;">—</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                    <button id="importar-licencia-btn" style="flex: 1; min-width: 150px; padding: 12px; background: #E91E63; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">🔑 Importar / Cargar Licencia</button>
                </div>
                <div style="background: #fdfdfd; padding: 15px; border-radius: 4px; border: 1px solid #ddd;">
                    <p style="margin-bottom: 5px; font-weight: bold;">Tu ID de Equipo (HWID):</p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" id="hwid-input" readonly value="Cargando..." style="flex: 1; padding: 8px; font-family: monospace; background: #eee; border: 1px solid #ccc; border-radius: 4px;">
                        <button id="copiar-hwid-btn" style="padding: 9px 15px; background: #607D8B; color: white; border: none; border-radius: 4px; cursor: pointer;">📋 Copiar ID</button>
                    </div>
                    <p style="font-size: 11px; color: #666; margin-top: 8px;">Envía tu Código de Equipo al autor para recibir la <b>licencia.key</b></p>
                </div>
            </div>
            
            <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                <h3>📊 Estado del Sistema</h3>
                <div id="estado-sistema" style="
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 12px;
                ">
                    <p>Cargando información...</p>
                </div>
            </div>

            <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                <h3>💾 Backups</h3>
                <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                    <button id="crear-backup-btn" style="
                        flex: 1;
                        min-width: 150px;
                        padding: 12px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    ">+ Crear Backup</button>
                    <button id="importar-backup-btn" style="
                        flex: 1;
                        min-width: 150px;
                        padding: 12px;
                        background: #2196F3;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    ">📥 Importar Backup</button>
                    <button id="abrir-carpeta-btn" style="
                        flex: 1;
                        min-width: 150px;
                        padding: 12px;
                        background: #9C27B0;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    ">📁 Abrir Carpeta</button>
                </div>
                <p style="font-size: 11px; color: #666; margin-bottom: 15px;">
                    Los backups se guardan en tu carpeta AppData de usuario.
                </p>
                <div id="lista-backups" style="
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 4px;
                ">
                    <p>Cargando backups...</p>
                </div>
            </div>

            <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                <h3>📈 Historial de Versiones</h3>
                <div id="historial-versiones" style="
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 4px;
                    font-size: 12px;
                ">
                    <p>Cargando historial...</p>
                </div>
            </div>

            <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                <h3>🔄 Reiniciar Base de Datos</h3>
                <div style="display: flex; gap: 10px;">
                    <button id="limpiar-bd-btn" style="
                        flex: 1;
                        padding: 12px;
                        background: #ff9800;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    ">⚠️ Limpiar Todos los Datos</button>
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    Elimina todos los productos, ventas e historial. Mantiene la estructura de tablas.
                </p>
            </div>

            <div style="margin-top: 40px; padding: 20px; background: #fafafa; border-radius: 8px; border: 1px dashed #ccc; text-align: center;">
                <h4 style="margin-bottom: 15px; color: #444;">👨‍💻 Desarrollo y Soporte Técnico</h4>
                <div style="font-size: 14px; color: #555; line-height: 1.6;">
                    <p style="margin: 0;"><b>Desarrollador:</b> Saucedo German</p>
                    <p style="margin: 0;"><b>Teléfono / WhatsApp:</b> +54 9 3777 275575</p>
                    <p style="margin: 0;"><b>Email:</b> <a href="mailto:germansau96@gmail.com" style="color: #2196F3; text-decoration: none;">germansau96@gmail.com</a></p>
                </div>
                <div style="margin-top: 15px; font-size: 12px; color: #888;">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} TITAN. Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    `;

    contenedor.appendChild(vista);
    // Event listeners
    document.getElementById('importar-licencia-btn').addEventListener('click', async () => {
        await importarLicenciaDesdeUI();
    });

    document.getElementById('copiar-hwid-btn').addEventListener('click', async () => {
        const input = document.getElementById('hwid-input');
        if (input.value && input.value !== 'Cargando...' && input.value !== 'Error') {
            try {
                await navigator.clipboard.writeText(input.value);
                mostrarNotificacion('📋 ID de Hardware copiado!', 'success');
            } catch (err) {
                mostrarNotificacion('❌ Falló al copiar ID', 'error');
            }
        }
    });

    document.getElementById('crear-backup-btn').addEventListener('click', async () => {
        await crearBackupDesdeUI();
        actualizarListaBackups();
    });

    document.getElementById('importar-backup-btn').addEventListener('click', async () => {
        await importarBackupDesdeUI();
        actualizarListaBackups();
    });

    document.getElementById('abrir-carpeta-btn').addEventListener('click', async () => {
        await abrirCarpetaBackupsDesdeUI();
    });

    document.getElementById('limpiar-bd-btn').addEventListener('click', async () => {
        await limpiarBDDesdeUI();
    });

    // Cargar datos iniciales
    cargarHWID();
    cargarInfoLicencia();
    actualizarEstadoSistema();
    actualizarListaBackups();
    actualizarHistorialVersiones();
}

async function cargarHWID() {
    try {
        const { invoke } = await import('@tauri-apps/api/core');
        const hwid = await invoke('obtener_hwid');
        document.getElementById('hwid-input').value = hwid;
    } catch (e) {
        document.getElementById('hwid-input').value = 'Error';
    }
}

async function cargarInfoLicencia() {
    try {
        const { invoke } = await import('@tauri-apps/api/core');
        const info = await invoke('info_licencia');
        
        const card = document.getElementById('licencia-status-card');
        const iconoEl = document.getElementById('licencia-icono');
        const estadoEl = document.getElementById('licencia-estado');
        const venceEl = document.getElementById('licencia-vence');
        const restanteEl = document.getElementById('licencia-restante');

        if (info.activa) {
            iconoEl.textContent = '✅';
            card.style.background = '#f0fdf4';
            card.style.borderColor = '#86efac';
            estadoEl.textContent = info.estado;
            estadoEl.style.color = '#16a34a';
            venceEl.textContent = info.vence;
            venceEl.style.color = '#333';
            // Mostrar días restantes con color según urgencia
            const dias = info.dias_restantes;
            let diasTexto = dias === 1 ? '1 día' : `${dias} días`;
            let diasColor = dias > 30 ? '#16a34a' : dias > 7 ? '#d97706' : '#dc2626';
            restanteEl.textContent = diasTexto;
            restanteEl.style.color = diasColor;
        } else {
            iconoEl.textContent = info.estado === 'Sin licencia' ? '🔒' : '❌';
            card.style.background = '#fef2f2';
            card.style.borderColor = '#fca5a5';
            estadoEl.textContent = info.estado;
            estadoEl.style.color = '#dc2626';
            venceEl.textContent = info.vence;
            restanteEl.textContent = '—';
        }
    } catch (e) {
        const estadoEl = document.getElementById('licencia-estado');
        if (estadoEl) estadoEl.textContent = 'Error al verificar';
    }
}

async function importarLicenciaDesdeUI() {
    try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const { invoke } = await import('@tauri-apps/api/core');

        const selectedPath = await open({
            multiple: false,
            filters: [{ name: 'Archivo de Licencia', extensions: ['key'] }]
        });

        if (!selectedPath) return;

        // Copiamos la llave a AppLocalData mediante rust directamente
        await invoke('instalar_licencia', { pathOrigen: selectedPath });

        mostrarNotificacion('✅ Licencia instalada correctamente. Reiniciando Sistema...', 'success');
        setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
        console.error('Error importando Licencia:', error);
        mostrarNotificacion(`❌ Falló la importación: ${error.message || error}`, 'error');
    }
}

/**
 * Crea la interfaz de mantenimiento (modalVersion anterior - mantener para compatibilidad)
 * Incluye: Crear backup, Listar backups, Restaurar, Ver historial
 */
export function crearInterfazMantenimiento() {
    const contenedor = document.createElement('div');
    contenedor.id = 'mantenimiento-modal';
    contenedor.setAttribute('style', `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `);

    const modal = document.createElement('div');
    modal.setAttribute('style', `
        background: white;
        border-radius: 8px;
        padding: 30px;
        width: 90%;
        max-width: 700px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `);

    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>🛠️ Mantenimiento de Datos</h2>
            <button id="cerrar-mantenimiento" style="
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            ">×</button>
        </div>

        <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
            <h3>📊 Estado del Sistema</h3>
            <div id="estado-sistema" style="
                background: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
            ">
                <p>Cargando información...</p>
            </div>
        </div>

        <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
            <h3>💾 Backups</h3>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button id="crear-backup-btn" style="
                    flex: 1;
                    padding: 12px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                ">+ Crear Backup Ahora</button>
            </div>
            <div id="lista-backups" style="
                background: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                max-height: 300px;
                overflow-y: auto;
            ">
                <p>Cargando backups...</p>
            </div>
        </div>

        <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
            <h3>🔄 Reiniciar Base de Datos</h3>
            <div style="display: flex; gap: 10px;">
                <button id="limpiar-bd-btn" style="
                    flex: 1;
                    padding: 12px;
                    background: #ff9800;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                ">⚠️ Limpiar Todos los Datos</button>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
                Elimina todos los productos, ventas e historial. Mantiene la estructura de tablas.
            </p>
        </div>

        <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
            <h3>📈 Historial de Versiones</h3>
            <div id="historial-versiones" style="
                background: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                max-height: 300px;
                overflow-y: auto;
                font-size: 12px;
            ">
                <p>Cargando historial...</p>
            </div>
        </div>

        <div style="text-align: right;">
            <button id="cerrar-mantenimiento-btn" style="
                padding: 10px 20px;
                background: #f0f0f0;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
            ">Cerrar</button>
        </div>
    `;

    contenedor.appendChild(modal);

    // Event listeners
    document.getElementById('cerrar-mantenimiento').addEventListener('click', () => {
        contenedor.remove();
    });

    document.getElementById('cerrar-mantenimiento-btn').addEventListener('click', () => {
        contenedor.remove();
    });

    document.getElementById('crear-backup-btn').addEventListener('click', async () => {
        await crearBackupDesdeUI();
        actualizarListaBackups();
    });

    document.getElementById('limpiar-bd-btn').addEventListener('click', async () => {
        await limpiarBDDesdeUI();
    });

    // Cargar datos iniciales
    actualizarEstadoSistema();
    actualizarListaBackups();
    actualizarHistorialVersiones();

    // Auto-actualizar cada 10 segundos
    const intervalo = setInterval(() => {
        if (!document.getElementById('mantenimiento-modal')) {
            clearInterval(intervalo);
        } else {
            actualizarListaBackups();
        }
    }, 10000);

    return contenedor;
}

/**
 * Actualiza el estado del sistema (versión, migraciones, etc)
 */
async function actualizarEstadoSistema() {
    try {
        const estadoDiv = document.getElementById('estado-sistema');
        if (estadoDiv) {
            let rutaInfo = '';
            try {
                const { appDataDir } = await import('@tauri-apps/api/path');
                const appData = await appDataDir();
                rutaInfo = `<p>📁 Backups guardados en:<br><code style="background: #eee; padding: 8px; border-radius: 3px; display: block; margin-top: 5px; word-break: break-all; font-size: 10px;">${appData}/backups</code></p>`;
            } catch (e) {
                rutaInfo = '<p>📁 Backups en la carpeta AppData de tu usuario</p>';
            }

            estadoDiv.innerHTML = `
                <p>✓ Base de datos: operativa</p>
                <p>✓ Última verificación: ${new Date().toLocaleString()}</p>
                <p>✓ Sistema de backups: activo</p>
                ${rutaInfo}
            `;
        }
    } catch (error) {
        console.error('Error actualizar estado:', error);
    }
}

/**
 * Actualiza la lista de backups disponibles
 */
async function actualizarListaBackups() {
    try {
        const backups = await listarBackups();
        const listaDiv = document.getElementById('lista-backups');

        if (!listaDiv) return;

        if (backups.length === 0) {
            listaDiv.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No hay backups disponibles. ¡Crea uno para empezar!</p>';
            return;
        }

        let html = '<div>';
        for (const backup of backups) {
            html += `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: white;
                    margin-bottom: 8px;
                    border-radius: 4px;
                    border-left: 4px solid #2196F3;
                ">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 13px;">${backup.nombre}</div>
                        <div style="color: #666; font-size: 11px;">
                            ${backup.tamaño_mb} MB • ${backup.hace}
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="restaurar-backup-btn" data-backup="${backup.nombre}" style="
                            padding: 6px 12px;
                            background: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 11px;
                        ">↩️ Restaurar</button>
                        <button class="eliminar-backup-btn" data-backup="${backup.nombre}" style="
                            padding: 6px 12px;
                            background: #f44336;
                            color: white;
                            border: none;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 11px;
                        ">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        listaDiv.innerHTML = html;

        // Add event listeners for buttons
        listaDiv.querySelectorAll('.restaurar-backup-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await restaurarBackupDesdeUI(e.target.dataset.backup);
            });
        });

        listaDiv.querySelectorAll('.eliminar-backup-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await eliminarBackupDesdeUI(e.target.dataset.backup);
            });
        });
    } catch (error) {
        console.error('Error actualizando lista de backups:', error);
    }
}

/**
 * Actualiza el historial de versiones
 */
async function actualizarHistorialVersiones() {
    try {
        // Aquí necesitarías pasar la BD desde main.js
        const historialDiv = document.getElementById('historial-versiones');
        if (historialDiv) {
            historialDiv.innerHTML = `
                <p>Versión actual: 0.1.0</p>
                <p style="font-size: 11px; color: #666;">
                    Sistema de historial de versiones disponible cuando se implemente.
                </p>
            `;
        }
    } catch (error) {
        console.error('Error actualizando historial:', error);
    }
}

/**
 * Crea un backup desde la UI y muestra confirmación
 */
async function crearBackupDesdeUI() {
    try {
        const btn = document.getElementById('crear-backup-btn');
        btn.disabled = true;
        btn.textContent = '⏳ Creando backup...';

        const resultado = await crearBackup(null);

        mostrarNotificacion('✅ Backup creado exitosamente', 'success');
        btn.disabled = false;
        btn.textContent = '+ Crear Backup Ahora';
    } catch (error) {
        console.error('Error creando backup:', error);
        mostrarNotificacion('❌ Error al crear backup: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = '+ Crear Backup Ahora';
    }
}

/**
 * Restaura un backup desde la UI con confirmación
 */
async function restaurarBackupDesdeUI(nombreBackup) {
    const { confirm } = await import('@tauri-apps/plugin-dialog');
    const confirmacion = await confirm(
        `⚠️ ¿Restaurar este backup?\n\n` +
        `Archivo: ${nombreBackup}\n\n` +
        `Se reemplazará la base de datos actual con los datos guardados.\n` +
        `La aplicación se reiniciará automáticamente.`,
        { title: 'Confirmar Restauración', kind: 'warning' }
    );

    if (!confirmacion) return;

    try {
        // Deshabilitar botones mientras se restaura
        document.querySelectorAll('button').forEach(btn => btn.disabled = true);

        mostrarNotificacion('⏳ Restaurando base de datos...', 'info');

        const resultado = await restaurarBackup(nombreBackup, null);

        mostrarNotificacion(
            '✅ Backup restaurado. La aplicación se recargará en 3 segundos...',
            'success'
        );

        // Esperar a que Tauri libere los archivos y luego recargar
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Recargando aplicación...');
        window.location.reload();
    } catch (error) {
        console.error('Error restaurando backup:', error);
        mostrarNotificacion(`❌ Error: ${error.message}`, 'error');
        // Re-habilitar botones si hay error
        document.querySelectorAll('button').forEach(btn => btn.disabled = false);
    }
}

/**
 * Elimina un backup desde la UI con confirmación
 */
async function eliminarBackupDesdeUI(nombreBackup) {
    const { confirm } = await import('@tauri-apps/plugin-dialog');
    const confirmacion = await confirm(
        `⚠️ ¿Eliminar permanentemente?\n\n${nombreBackup}`,
        { title: 'Confirmar Eliminación', kind: 'warning' }
    );

    if (!confirmacion) return;

    try {
        await eliminarBackup(nombreBackup);
        mostrarNotificacion('✅ Backup eliminado', 'success');
        actualizarListaBackups();
    } catch (error) {
        console.error('Error eliminando backup:', error);
        mostrarNotificacion('❌ Error: ' + error.message, 'error');
    }
}

/**
 * Importa un backup desde un archivo local
 */
async function importarBackupDesdeUI() {
    const btn = document.getElementById('importar-backup-btn');
    try {
        btn.disabled = true;
        btn.textContent = '⏳ Seleccionando archivo...';

        const resultado = await importarBackup();

        mostrarNotificacion('✅ ' + resultado.mensaje, 'success');
        btn.disabled = false;
        btn.textContent = '📥 Importar Backup';

        // Actualizar lista de backups después de importar
        await actualizarListaBackups();
    } catch (error) {
        console.error('Error importando backup:', error);
        const mensajeError = error.message || 'Error desconocido';
        mostrarNotificacion(`❌ ${mensajeError}`, 'error');
        btn.disabled = false;
        btn.textContent = '📥 Importar Backup';
    }
}

/**
 * Abre la carpeta de backups en el explorador
 */
async function abrirCarpetaBackupsDesdeUI() {
    try {
        await abrirCarpetaBackups();
        mostrarNotificacion('📁 Carpeta abierta en el explorador', 'success');
    } catch (error) {
        console.error('Error abriendo carpeta:', error);
        mostrarNotificacion(`❌ ${error.message}`, 'error');
    }
}

/**
 * Limpia todos los datos de la BD desde la UI con confirmación
 */
async function limpiarBDDesdeUI() {
    const password = window.prompt("🔒 Ingresa la contraseña de administrador para poder limpiar la base de datos:");

    if (password !== "191103") {
        if (password !== null) {
            mostrarNotificacion("❌ Contraseña incorrecta. Operación denegada.", "error");
        }
        return;
    }

    const { confirm } = await import('@tauri-apps/plugin-dialog');
    const confirmacion = await confirm(
        `⚠️ ⚠️ ADVERTENCIA ⚠️ ⚠️\n\n` +
        `¿Estás SEGURO de que quieres limpiar TODOS los datos?\n\n` +
        `Se eliminarán:\n` +
        `• Todos los productos\n` +
        `• Todas las ventas\n` +
        `• Todo el historial\n\n` +
        `Esta acción NO se puede deshacer fácilmente.\n\n` +
        `Si necesitas guardar los datos, hace un backup primero.`,
        { title: 'Confirma Limpieza de Datos', kind: 'warning' }
    );

    if (!confirmacion) return;

    try {
        const btn = document.getElementById('limpiar-bd-btn');
        btn.disabled = true;
        btn.textContent = '⏳ Limpiando...';

        // Limpiar la BD
        await limpiarBaseDeDatos();

        mostrarNotificacion('✅ Base de datos reiniciada exitosamente.', 'success');
        btn.disabled = false;
        btn.textContent = '⚠️ Limpiar Todos los Datos';

        // Recargar la página después de 2 segundos
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } catch (error) {
        console.error('Error limpiando BD:', error);
        mostrarNotificacion('❌ Error: ' + error.message, 'error');
        const btn = document.getElementById('limpiar-bd-btn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '⚠️ Limpiar Todos los Datos';
        }
    }
}

/**
 * Muestra una notificación temporal en la pantalla
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notif = document.createElement('div');
    notif.setAttribute('style', `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'error' ? '#f44336' : tipo === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10001;
        max-width: 400px;
    `);
    notif.textContent = mensaje;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.remove();
    }, 4000);
}

/**
 * Abre el modal de mantenimiento
 * Llama esta función desde tu menú principal
 */
export function abrirMantenimiento() {
    const modal = crearInterfazMantenimiento();
    document.body.appendChild(modal);
}

export default {
    crearInterfazMantenimiento,
    abrirMantenimiento,
    mostrarNotificacion
};
