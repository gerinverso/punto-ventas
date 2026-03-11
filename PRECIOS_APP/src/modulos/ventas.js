let db = null;
let todosLosProductos = [];
let carrito = [];
let pagoMixto = null;

export async function cargarVistaVentas(contenedor, baseDeDatos) {
    db = baseDeDatos;
    todosLosProductos = await db.select('SELECT * FROM productos');
    
    contenedor.innerHTML = `
        <h2 class="mb-4">🛒 Punto de Venta</h2>
        <div class="row">
            <div class="col-md-7">
                <div class="card shadow-sm border-0 mb-4 bg-primary text-white">
                    <div class="card-body rounded">
                        <h5 class="mb-3">🔍 Buscar o Escanear Producto</h5>
                        <input type="text" id="buscador-venta" class="form-control form-control-lg fw-bold" placeholder="Pasá el código de barras o escribí el nombre..." onkeyup="buscarParaVenta(event)" autofocus>
                        <div id="resultados-venta" class="list-group mt-2 shadow"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="card shadow-sm border-0 d-flex flex-column" style="height: 100%;">
                    <div class="card-body bg-light rounded d-flex flex-column">
                        <h4 class="text-secondary mb-3">🛒 Ticket Actual</h4>
                        <div class="table-responsive bg-white border rounded shadow-sm mb-3" style="height: 280px; overflow-y: auto;">
                            <table class="table table-sm table-hover mb-0 text-center align-middle">
                                <thead class="table-dark" style="position: sticky; top: 0; z-index: 1;">
                                    <tr><th class="text-start ps-2">Producto</th><th>Cant.</th><th>Subtotal</th><th></th></tr>
                                </thead>
                                <tbody id="tabla-carrito"></tbody>
                            </table>
                        </div>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-2 px-2">
                                <h3 class="mb-0 text-secondary">Total:</h3><h1 class="mb-0 text-success fw-bold">$<span id="total-venta">0.00</span></h1>
                            </div>
                            <div class="mb-3">
                                <select id="metodo-pago" class="form-select form-select-lg border-primary fw-bold text-center" onchange="manejarCambioPago()">
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Transferencia">📱 Transferencia / App</option>
                                    <option value="Mixto">💳 Pago en Parte (Efectivo + Transf.)</option>
                                </select>
                            </div>
                            <div id="seccion-vuelto" class="mb-3" style="display: none;">
                                <label class="form-label fw-bold">💵 Paga Con</label>
                                <input type="number" id="paga-con" class="form-control form-control-lg" placeholder="0.00" step="0.01" oninput="calcularVuelto()">
                                <div class="mt-2 bg-light p-3 rounded border border-secondary">
                                    <div class="d-flex justify-content-between mb-2">
                                        <span>Total:</span>
                                        <span class="fw-bold">$<span id="vuelto-total">0.00</span></span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2">
                                        <span>Recibido:</span>
                                        <span class="fw-bold">$<span id="vuelto-recibido">0.00</span></span>
                                    </div>
                                    <div class="border-top pt-2 d-flex justify-content-between">
                                        <span class="fw-bold">Vuelto:</span>
                                        <span class="fw-bold text-success fs-5">$<span id="vuelto-monto">0.00</span></span>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-success btn-lg w-100 fw-bold shadow-sm py-3" onclick="confirmarVenta()">✅ CONFIRMAR VENTA</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal fade" id="modalPagoMixto" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-dark text-white">
                        <h5 class="modal-title">💳 Pago en Parte</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <h4 class="text-secondary mb-4">Total a Pagar: <span class="text-success fw-bold">$<span id="total-pago-mixto">0.00</span></span></h4>
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label fw-bold">💵 Monto en Efectivo</label>
                                <input type="number" id="monto-efectivo" class="form-control form-control-lg" placeholder="0.00" step="0.01" oninput="actualizarMontosAutomaticos('efectivo')" autofocus>
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-bold">📱 Monto en Transferencia</label>
                                <input type="number" id="monto-transferencia" class="form-control form-control-lg" placeholder="0.00" step="0.01" oninput="actualizarMontosAutomaticos('transferencia')">
                            </div>
                            <div class="col-12 bg-light p-3 rounded border border-secondary">
                                <h5 class="mb-3">Desglose:</h5>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Efectivo:</span>
                                    <span class="fw-bold">$<span id="resumen-efectivo">0.00</span></span>
                                </div>
                                <div class="d-flex justify-content-between mb-3">
                                    <span>Transferencia:</span>
                                    <span class="fw-bold">$<span id="resumen-transferencia">0.00</span></span>
                                </div>
                                <div class="border-top pt-2">
                                    <div class="d-flex justify-content-between">
                                        <span class="fw-bold">Faltante:</span>
                                        <span class="fw-bold text-danger">$<span id="faltante-pago">0.00</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer bg-light border-top-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success fw-bold px-4" onclick="confirmartPagoMixto()">✅ Confirmar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.dibujarCarrito();
    window.manejarCambioPago();
    setTimeout(() => document.getElementById('buscador-venta')?.focus(), 100);
    
    // Configurar accesibilidad para modales: aria-hidden debe ser dinámico
    const modalPagoMixto = document.getElementById('modalPagoMixto');
    if (modalPagoMixto) {
        modalPagoMixto.addEventListener('show.bs.modal', () => {
            modalPagoMixto.setAttribute('aria-hidden', 'false');
        });
        modalPagoMixto.addEventListener('hide.bs.modal', () => {
            modalPagoMixto.setAttribute('aria-hidden', 'true');
        });
    }
}

window.buscarParaVenta = function(event) {
    const input = document.getElementById('buscador-venta');
    const textoBuscado = input.value.trim().toLowerCase();
    const cajaResultados = document.getElementById('resultados-venta');
    cajaResultados.innerHTML = '';
    
    if (textoBuscado === '') return;
    
    if (event.key === 'Enter') {
        const productoExacto = todosLosProductos.find(p => p.codigo.toLowerCase() === textoBuscado);
        if (productoExacto) { window.agregarAlCarrito(productoExacto); input.value = ''; return; }
    }
    
    const sugerencias = todosLosProductos.filter(prod => prod.nombre.toLowerCase().includes(textoBuscado) || prod.codigo.toLowerCase().includes(textoBuscado)).slice(0, 5);
    sugerencias.forEach(prod => {
        const item = document.createElement('button');
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        item.innerHTML = `<div><strong>${prod.nombre}</strong> <br><small class="text-muted">${prod.codigo}</small></div><span class="badge bg-success rounded-pill fs-6">$${prod.precio_venta.toFixed(2)}</span>`;
        item.onclick = () => { window.agregarAlCarrito(prod); input.value = ''; cajaResultados.innerHTML = ''; input.focus(); };
        cajaResultados.appendChild(item);
    });
};

window.agregarAlCarrito = function(producto) {
    const itemExistente = carrito.find(item => item.id === producto.id);
    if (itemExistente) {
        itemExistente.cantidad++;
        itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio_venta;
    } else {
        carrito.push({ id: producto.id, nombre: producto.nombre, precio_venta: producto.precio_venta, cantidad: 1, subtotal: producto.precio_venta });
    }
    window.dibujarCarrito();
};

window.eliminarDelCarrito = function(index) {
    carrito.splice(index, 1);
    window.dibujarCarrito();
};

window.aumentarCantidad = function(index) {
    carrito[index].cantidad++;
    carrito[index].subtotal = carrito[index].cantidad * carrito[index].precio_venta;
    window.dibujarCarrito();
};

window.disminuirCantidad = function(index) {
    if (carrito[index].cantidad > 1) {
        carrito[index].cantidad--;
        carrito[index].subtotal = carrito[index].cantidad * carrito[index].precio_venta;
    } else {
        carrito.splice(index, 1);
    }
    window.dibujarCarrito();
};

window.manejarCambioPago = function() {
    const metodo = document.getElementById('metodo-pago').value;
    const seccionVuelto = document.getElementById('seccion-vuelto');
    
    if (metodo === 'Efectivo') {
        seccionVuelto.style.display = 'block';
        document.getElementById('paga-con').value = '';
        document.getElementById('vuelto-monto').innerText = '0.00';
        document.getElementById('paga-con').focus();
    } else if (metodo === 'Mixto') {
        seccionVuelto.style.display = 'none';
        const totalVenta = carrito.reduce((suma, item) => suma + item.subtotal, 0);
        document.getElementById('total-pago-mixto').innerText = totalVenta.toFixed(2);
        document.getElementById('monto-efectivo').value = '';
        document.getElementById('monto-transferencia').value = '';
        document.getElementById('faltante-pago').innerText = totalVenta.toFixed(2);
        document.getElementById('resumen-efectivo').innerText = '0.00';
        document.getElementById('resumen-transferencia').innerText = '0.00';
        
        // Destruye cualquier instancia anterior completamente
        const modalElement = document.getElementById('modalPagoMixto');
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            existingModal.dispose();
        }
        
        // Crea e inmediatamente abre una instancia nueva
        const newModal = new bootstrap.Modal(modalElement);
        newModal.show();
    } else {
        seccionVuelto.style.display = 'none';
    }
};

window.calcularPagoMixto = function() {
    const totalVenta = carrito.reduce((suma, item) => suma + item.subtotal, 0);
    const montoEfectivoActual = parseFloat(document.getElementById('monto-efectivo').value) || 0;
    const montoTransferenciaActual = parseFloat(document.getElementById('monto-transferencia').value) || 0;
    const faltante = totalVenta - (montoEfectivoActual + montoTransferenciaActual);
    
    document.getElementById('resumen-efectivo').innerText = montoEfectivoActual.toFixed(2);
    document.getElementById('resumen-transferencia').innerText = montoTransferenciaActual.toFixed(2);
    document.getElementById('faltante-pago').innerText = faltante.toFixed(2);
};

window.calcularVuelto = function() {
    const totalVenta = carrito.reduce((suma, item) => suma + item.subtotal, 0);
    const pagaCon = parseFloat(document.getElementById('paga-con').value) || 0;
    const vuelto = pagaCon - totalVenta;
    
    document.getElementById('vuelto-total').innerText = totalVenta.toFixed(2);
    document.getElementById('vuelto-recibido').innerText = pagaCon.toFixed(2);
    document.getElementById('vuelto-monto').innerText = vuelto.toFixed(2);
    
    // Cambiar color del vuelto si es negativo (no cubre)
    const vueltoElement = document.getElementById('vuelto-monto');
    if (vuelto < 0) {
        vueltoElement.parentElement.classList.remove('text-success');
        vueltoElement.parentElement.classList.add('text-danger');
    } else {
        vueltoElement.parentElement.classList.remove('text-danger');
        vueltoElement.parentElement.classList.add('text-success');
    }
};

window.actualizarMontosAutomaticos = function(campoQueCambio) {
    // Solo calculamos el faltante actualizando la pantalla sin auto-completar 
    // para que el usuario pueda ver lo que le falta pagar
    window.calcularPagoMixto();
};

window.confirmartPagoMixto = function() {
    const totalVenta = carrito.reduce((suma, item) => suma + item.subtotal, 0);
    const montoEfectivo = parseFloat(document.getElementById('monto-efectivo').value) || 0;
    const montoTransferencia = parseFloat(document.getElementById('monto-transferencia').value) || 0;
    const total = montoEfectivo + montoTransferencia;
    
    if (total < totalVenta) {
        alert('El total ingresado no cubre la venta. Faltante: $' + (totalVenta - total).toFixed(2));
        return;
    }
    
    if (total > totalVenta) {
        alert('El total ingresado supera la venta. Exceso: $' + (total - totalVenta).toFixed(2));
        return;
    }
    
    pagoMixto = {
        efectivo: montoEfectivo,
        transferencia: montoTransferencia
    };
    
    bootstrap.Modal.getInstance(document.getElementById('modalPagoMixto')).hide();
    window.confirmarVenta();
};

window.dibujarCarrito = function() {
    const tbody = document.getElementById('tabla-carrito');
    tbody.innerHTML = '';
    let totalGeneral = 0;
    
    if (carrito.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted py-4">No hay productos en el carrito</td></tr>`;
        document.getElementById('total-venta').innerText = '0.00';
        return;
    }
    
    carrito.forEach((item, index) => {
        totalGeneral += item.subtotal;
        tbody.innerHTML += `<tr><td class="text-start ps-2 fw-bold text-truncate" style="max-width: 150px;">${item.nombre}</td><td><div class="btn-group btn-group-sm" role="group"><button class="btn btn-outline-secondary" onclick="disminuirCantidad(${index})">−</button><span class="badge bg-primary fs-6 px-2 py-1">${item.cantidad}</span><button class="btn btn-outline-secondary" onclick="aumentarCantidad(${index})">+</button></div></td><td class="fw-bold">$${item.subtotal.toFixed(2)}</td><td><button class="btn btn-sm btn-outline-danger" onclick="eliminarDelCarrito(${index})">❌</button></td></tr>`;
    });
    document.getElementById('total-venta').innerText = totalGeneral.toFixed(2);
};

window.confirmarVenta = async function() {
    if (carrito.length === 0) { alert("Agregá algún producto antes de vender."); return; }
    try {
        const totalVenta = carrito.reduce((suma, item) => suma + item.subtotal, 0);
        let metodoPago = document.getElementById('metodo-pago').value;
        let montoEfectivo = null;
        let montoTransferencia = null;
        
        // Si es pago mixto, armamos el string con detalles y guardamos montos separados
        if (pagoMixto) {
            metodoPago = `Efectivo: $${pagoMixto.efectivo.toFixed(2)} | Transferencia: $${pagoMixto.transferencia.toFixed(2)}`;
            montoEfectivo = pagoMixto.efectivo;
            montoTransferencia = pagoMixto.transferencia;
        } else if (metodoPago === 'Efectivo') {
            montoEfectivo = totalVenta;
            montoTransferencia = 0;
        } else if (metodoPago === 'Transferencia') {
            montoEfectivo = 0;
            montoTransferencia = totalVenta;
        }
        
        // --- NUEVA LÓGICA ESCALABLE ---
        // 1. Buscamos cuál es la caja que está abierta actualmente
        const cajas = await db.select("SELECT id FROM cajas WHERE estado = 'ABIERTA' LIMIT 1");
        const cajaActivaId = cajas[0].id;

        // 2. Guardamos la venta vinculada a esa caja con los montos separados
        const resultadoVenta = await db.execute(
            'INSERT INTO ventas (caja_id, total, metodo_pago, monto_efectivo, monto_transferencia) VALUES (?, ?, ?, ?, ?)', 
            [cajaActivaId, totalVenta, metodoPago, montoEfectivo, montoTransferencia]
        );
        const idVenta = resultadoVenta.lastInsertId;
        
        // 3. Guardamos el detalle
        for (const item of carrito) {
            await db.execute(
                'INSERT INTO detalle_ventas (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)', 
                [idVenta, item.id, item.nombre, item.cantidad, item.precio_venta, item.subtotal]
            );
        }
        
        carrito = [];
        pagoMixto = null;
        window.dibujarCarrito();
        document.getElementById('metodo-pago').value = 'Efectivo';
        document.getElementById('buscador-venta').focus();
        
        const boton = document.querySelector('button[onclick="confirmarVenta()"]');
        const textoOriginal = boton.innerHTML;
        boton.innerHTML = '¡VENTA EXITOSA! 🎉';
        boton.classList.replace('btn-success', 'btn-primary');
        setTimeout(() => { boton.innerHTML = textoOriginal; boton.classList.replace('btn-primary', 'btn-success'); }, 1500);
    } catch (error) {
        console.error(error);
        alert("Error al guardar venta.");
    }
};