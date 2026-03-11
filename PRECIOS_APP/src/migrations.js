/**
 * SISTEMA DE MIGRACIONES
 * Gestiona cambios de esquema de BD entre versiones
 * Cada migración se ejecuta una sola vez y se registra
 */

const MIGRATIONS_TABLE = 'schema_migrations';

/**
 * Define todas las migraciones disponibles
 * El nombre de la migración debe ser único y se usa para registrar que se ejecutó
 */
const migrations = [
    {
        version: '0.1.0',
        name: '001_initial_schema',
        description: 'Esquema inicial de la aplicación',
        up: async (db) => {
            // Esta migración ya se ejecutó en iniciarBaseDeDatos
            // La ponemos aquí por documentación
        },
        down: async (db) => {
            // Para rollback, si es necesario
            throw new Error('No se puede hacer rollback de migración inicial');
        }
    },
    {
        version: '0.2.0',
        name: '002_add_version_tracking',
        description: 'Agregar tabla de seguimiento de migraciones y versiones',
        up: async (db) => {
            // Tabla para registrar qué migraciones se ejecutaron
            await db.execute(`
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    migration_name TEXT UNIQUE NOT NULL,
                    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    version TEXT NOT NULL
                )
            `);
            
            // Tabla de versiones del app para auditoría
            await db.execute(`
                CREATE TABLE IF NOT EXISTS app_versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version TEXT NOT NULL,
                    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    previous_version TEXT
                )
            `);
        },
        down: async (db) => {
            await db.execute('DROP TABLE IF EXISTS app_versions');
            await db.execute('DROP TABLE IF EXISTS schema_migrations');
        }
    },
    {
        version: '0.3.0',
        name: '003_add_product_description',
        description: 'Agregar campo descripción a productos',
        up: async (db) => {
            try {
                await db.execute('ALTER TABLE productos ADD COLUMN descripcion TEXT');
            } catch (e) {
                // Si la columna ya existe, ignoramos
                console.log('Columna descripción ya existe');
            }
        },
        down: async (db) => {
            // SQLite no soporta DROP COLUMN directamente en versiones viejas
            console.log('Rollback de descripción requiere recrear tabla');
        }
    },
    {
        version: '0.4.0',
        name: '004_add_audit_fields',
        description: 'Agregar campos de auditoría a tablas principales',
        up: async (db) => {
            // Agregar campos a productos
            try {
                await db.execute('ALTER TABLE productos ADD COLUMN actualizado_por TEXT');
                await db.execute('ALTER TABLE productos ADD COLUMN fecha_actualizacion DATETIME');
            } catch (e) {
                console.log('Campos de auditoría en productos ya existen');
            }

            // Agregar campos a ventas
            try {
                await db.execute('ALTER TABLE ventas ADD COLUMN actualizado_por TEXT');
                await db.execute('ALTER TABLE ventas ADD COLUMN nota_integracion TEXT');
            } catch (e) {
                console.log('Campos de auditoría en ventas ya existen');
            }
        },
        down: async (db) => {
            console.log('Rollback de campos de auditoría requiere recrear tablas');
        }
    }
    // Agrega más migraciones aquí según evolucione tu app
];

/**
 * Inicializa la tabla de migraciones si no existe
 */
export async function inicializarMigraciones(db) {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                migration_name TEXT UNIQUE NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                version TEXT NOT NULL
            )
        `);
        console.log('✓ Tabla de migraciones lista');
    } catch (error) {
        console.error('Error inicializando tabla de migraciones:', error);
        throw error;
    }
}

/**
 * Obtiene las migraciones ya ejecutadas
 */
export async function obtenerMigracionesEjecutadas(db) {
    try {
        const result = await db.select(`
            SELECT migration_name FROM ${MIGRATIONS_TABLE}
        `);
        return result.map(row => row.migration_name);
    } catch (error) {
        console.error('Error obteniendo migraciones ejecutadas:', error);
        return [];
    }
}

/**
 * Ejecuta todas las migraciones pendientes
 */
export async function ejecutarMigraciones(db) {
    try {
        console.log('🔄 Iniciando sistema de migraciones...');
        
        const ejecutadas = await obtenerMigracionesEjecutadas(db);
        const pendientes = migrations.filter(m => !ejecutadas.includes(m.name));

        if (pendientes.length === 0) {
            console.log('✓ BD actualizada (sin migraciones pendientes)');
            return;
        }

        console.log(`⚙️  Ejecutando ${pendientes.length} migraciones pendientes...`);

        for (const migration of pendientes) {
            try {
                console.log(`  → ${migration.name} (v${migration.version})`);
                await migration.up(db);
                
                await db.execute(`
                    INSERT INTO ${MIGRATIONS_TABLE} (migration_name, version)
                    VALUES (?, ?)
                `, [migration.name, migration.version]);
                
                console.log(`    ✓ Completada`);
            } catch (error) {
                console.error(`  ✗ Error en ${migration.name}:`, error);
                throw new Error(`Migración fallida: ${migration.name} - ${error.message}`);
            }
        }

        console.log(`✓ ${pendientes.length} migraciones ejecutadas correctamente`);
    } catch (error) {
        console.error('Error ejecutando migraciones:', error);
        throw error;
    }
}

/**
 * Obtiene la versión actual del app (última migración)
 */
export async function obtenerVersionActual(db) {
    try {
        const result = await db.select(`
            SELECT version FROM ${MIGRATIONS_TABLE}
            ORDER BY executed_at DESC
            LIMIT 1
        `);
        return result.length > 0 ? result[0].version : '0.0.0';
    } catch (error) {
        return '0.0.0';
    }
}

/**
 * Registra una instalación/actualización de versión
 */
export async function registrarVersionInstalada(db, versionNueva, versionAnterior = null) {
    try {
        await db.execute(`
            INSERT INTO app_versions (version, previous_version)
            VALUES (?, ?)
        `, [versionNueva, versionAnterior]);
        
        console.log(`✓ Versión ${versionNueva} registrada`);
    } catch (error) {
        console.error('Error registrando versión:', error);
    }
}

/**
 * Obtiene el historial de versiones instaladas
 */
export async function obtenerHistorialVersiones(db) {
    try {
        const result = await db.select(`
            SELECT version, installed_at, previous_version
            FROM app_versions
            ORDER BY installed_at DESC
            LIMIT 20
        `);
        return result;
    } catch (error) {
        console.error('Error obteniendo historial de versiones:', error);
        return [];
    }
}

/**
 * Obtiene información de la última migración
 */
export async function obtenerInfoMigraciones(db) {
    try {
        const result = await db.select(`
            SELECT COUNT(*) as total,
                   MAX(executed_at) as ultima_migracion
            FROM ${MIGRATIONS_TABLE}
        `);
        return result[0];
    } catch (error) {
        return { total: 0, ultima_migracion: null };
    }
}

export default migrations;
