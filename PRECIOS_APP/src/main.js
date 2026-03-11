// Importamos el motor de la base de datos
import { iniciarBaseDeDatos } from './db.js';

// Importamos nuestros módulos súper limpios
import { cargarVistaVentas } from './modulos/ventas.js';
import { cargarVistaProductos } from './modulos/productos.js';
import { cargarVistaHistorial } from './modulos/historial.js';
import { cargarVistaCajasPrevias } from './modulos/cajasPrevias.js';
import { cargarVistaConfiguracion } from './mantenimiento.js';

import { validarLicencia } from './licencia.js';

let db = null;
let appRegistrada = false;

// ¡Nuestro Director de Orquesta!
window.cambiarVista = async function(vista) {
    if (!appRegistrada && vista !== 'configuracion') {
        alert("🔒 Por favor, Registra la Aplicación en la Vista de Configuración primero.");
        await cargarVistaConfiguracion(document.getElementById('app-content'));
        return;
    }

    const contenedor = document.getElementById('app-content');
    
    // Le avisamos al usuario que estamos cargando
    contenedor.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-primary" role="status"></div><h5 class="mt-2 text-secondary">Cargando...</h5></div>';
    
    // Llamamos al archivo correspondiente según lo que haya tocado
    if (vista === 'ventas') {
        await cargarVistaVentas(contenedor, db);
    } 
    else if (vista === 'productos') {
        await cargarVistaProductos(contenedor, db);
    } 
    else if (vista === 'historial') {
        await cargarVistaHistorial(contenedor, db);
    }
    else if (vista === 'cajasPrevias') {
        await cargarVistaCajasPrevias(contenedor, db);
    }
    else if (vista === 'configuracion') {
        await cargarVistaConfiguracion(contenedor);
    }
};

async function iniciarApp() {
    try {
        // Prendemos el motor una sola vez
        db = await iniciarBaseDeDatos();
        
        // Validamos hardware
        const licencia = await validarLicencia();
        if (licencia.valida) {
            appRegistrada = true;
            cambiarVista('ventas');
        } else {
            alert(licencia.mensaje);
            cambiarVista('configuracion');
        }
    } catch (error) {
        alert("Error crítico al iniciar el sistema.");
        console.error(error);
    }
}

// Encendemos la mecha
iniciarApp();