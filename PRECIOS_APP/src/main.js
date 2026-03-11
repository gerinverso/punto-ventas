// Importamos el motor de la base de datos
import { iniciarBaseDeDatos } from './db.js';

// Importamos nuestros módulos súper limpios
import { cargarVistaVentas } from './modulos/ventas.js';
import { cargarVistaProductos } from './modulos/productos.js';
import { cargarVistaHistorial } from './modulos/historial.js';
import { cargarVistaCajasPrevias } from './modulos/cajasPrevias.js';
import { cargarVistaConfiguracion } from './mantenimiento.js';

let db = null;

// ¡Nuestro Director de Orquesta!
window.cambiarVista = async function(vista) {
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
        
        // Arrancamos directo en la caja registradora
        cambiarVista('ventas');
    } catch (error) {
        alert("Error crítico al iniciar el sistema.");
        console.error(error);
    }
}

// Encendemos la mecha
iniciarApp();