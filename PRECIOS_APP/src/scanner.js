/**
 * scanner.js — Soporte para Lector de Código de Barras
 * 
 * Los lectores de código de barras USB/Bluetooth funcionan simulando
 * teclado: envían los caracteres del código muy rápido (< 50ms entre teclas)
 * y terminan con un Enter automático.
 * 
 * Este módulo detecta ese patrón y redirige el código escaneado al
 * buscador de la vista activa.
 */

let bufferScanner = '';
let timerScanner = null;
const VELOCIDAD_SCANNER_MS = 50; // ms entre teclas — los lectores son más rápidos que un humano
const LONGITUD_MINIMA_CODIGO = 3;  // caracteres mínimos para considerar que es un código válido

/**
 * Inicializa el listener global del lector de código de barras.
 * Debe llamarse UNA sola vez al iniciar la app.
 */
export function iniciarScanner() {
    document.addEventListener('keydown', manejarTeclaScanner);
    console.log('📡 Scanner de código de barras activo.');
}

function manejarTeclaScanner(e) {
    // Si el foco está en un input de texto, no interceptamos — el lector
    // está escribiendo directamente ahí (ej: buscador-venta, buscador-productos)
    const tagActivo = document.activeElement?.tagName?.toLowerCase();
    const esInputDeTexto = (tagActivo === 'input' || tagActivo === 'textarea' || tagActivo === 'select');

    if (esInputDeTexto) {
        // Si el input activo es el buscador-venta y llega Enter,
        // nos aseguramos de que buscarParaVenta lo procese correctamente
        // (ya lo hace de por sí), no hacemos nada extra.
        return;
    }

    // Si no hay ningún input enfocado, el lector está escribiendo "en el aire"
    // → capturamos los caracteres en nuestro buffer
    if (e.key === 'Enter') {
        if (bufferScanner.length >= LONGITUD_MINIMA_CODIGO) {
            procesarCodigoEscaneado(bufferScanner.trim());
        }
        bufferScanner = '';
        clearTimeout(timerScanner);
        return;
    }

    // Solo acumulamos caracteres imprimibles (letras, números, guiones, etc.)
    if (e.key.length === 1) {
        bufferScanner += e.key;

        // Si el usuario escribe manualmente (lento), limpiamos el buffer
        // para no acumular basura. El lector siempre es más rápido.
        clearTimeout(timerScanner);
        timerScanner = setTimeout(() => {
            bufferScanner = '';
        }, VELOCIDAD_SCANNER_MS * 3);
    }
}

/**
 * Cuando se escanea un código y el foco NO está en ningún input,
 * redirigimos el código al buscador de la vista activa.
 */
function procesarCodigoEscaneado(codigo) {
    if (!codigo) return;

    // ¿Estamos en la vista de ventas?
    const buscadorVenta = document.getElementById('buscador-venta');
    if (buscadorVenta) {
        buscadorVenta.value = codigo;
        buscadorVenta.focus();
        // Disparar búsqueda con Enter simulado para agregar directo al carrito
        const eventoEnter = new KeyboardEvent('keyup', { key: 'Enter', bubbles: true });
        buscadorVenta.dispatchEvent(eventoEnter);
        return;
    }

    // ¿Estamos en la vista de productos?
    const buscadorProductos = document.getElementById('buscador-productos');
    if (buscadorProductos) {
        buscadorProductos.value = codigo;
        buscadorProductos.focus();
        // Disparar el filtro
        if (typeof window.filtrarProductos === 'function') {
            window.filtrarProductos();
        }
        return;
    }
}

/**
 * Utilidad: asegura que el foco siempre vuelva al buscador de ventas
 * cuando el usuario hace click en cualquier parte vacía de la pantalla.
 * Esto es clave para que el lector de barras siempre funcione en ventas.
 */
export function activarFocoAutomaticoVentas() {
    document.addEventListener('click', (e) => {
        const buscadorVenta = document.getElementById('buscador-venta');
        if (!buscadorVenta) return;

        // Si el click fue en un botón, input, select, modal, etc. → no robamos el foco
        const tagClick = e.target?.tagName?.toLowerCase();
        const esInteractivo = ['button', 'input', 'select', 'textarea', 'a', 'label'].includes(tagClick);
        const estaEnModal = e.target?.closest('.modal');

        if (!esInteractivo && !estaEnModal) {
            buscadorVenta.focus();
        }
    });
}
