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
                <div class="card shadow-sm border-0 mb-3 bg-primary text-white">
                    <div class="card-body rounded">
                        <h5 class="mb-3">🔍 Buscar o Escanear Producto</h5>
                        <div class="position-relative">
                        <input type="text" id="buscador-venta" class="form-control form-control-lg fw-bold" placeholder="Pasá el código de barras o escribí el nombre..." onkeyup="buscarParaVenta(event)" autocomplete="off" autofocus>
                        <span id="scanner-indicator" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:1.2rem;opacity:0;transition:opacity 0.3s;pointer-events:none;">📡</span>
                        </div>
                        <div id="resultados-venta" class="list-group mt-2 shadow"></div>
                    </div>
                </div>
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-body bg-light rounded border border-secondary border-opacity-25">
                        <h6 class="text-secondary mb-2 fw-bold">➕ Venta Libre (Personalizada)</h6>
                        <div class="row g-2 align-items-center">
                            <div class="col-md-6">
                                <input type="text" id="temp-desc" class="form-control border-secondary" placeholder="Descripción (Ej. Varios, Caramelos)" onkeypress="if(event.key === 'Enter') document.getElementById('temp-precio').focus()">
                            </div>
                            <div class="col-md-4">
                                <div class="input-group">
                                    <span class="input-group-text bg-secondary text-white border-secondary">$</span>
                                    <input type="number" id="temp-precio" class="form-control border-secondary fw-bold" placeholder="Precio" step="0.01" onkeypress="if(event.key === 'Enter') agregarProductoTemporal()">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-secondary w-100 fw-bold shadow-sm" onclick="agregarProductoTemporal()">Sumar</button>
                            </div>
                        </div>
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
                                    <option value="Debito_Credito">💳 Débito / Crédito</option>
                                    <option value="Mixto">💳 Pago en Parte (Efectivo + Transf.)</option>
                                </select>
                            </div>
                            <div id="seccion-recargo" class="mb-3 bg-light p-3 rounded border border-warning" style="display: none;">
                                <label class="form-label fw-bold text-dark">📈 Recargo por Tarjeta (%)</label>
                                <div class="input-group">
                                    <input type="number" id="porcentaje-recargo" class="form-control form-control-lg fw-bold text-center border-warning" placeholder="Ej: 10" step="1" value="0" oninput="dibujarCarrito()">
                                    <span class="input-group-text bg-warning text-dark fw-bold border-warning">%</span>
                                </div>
                                <div class="mt-2 text-end">
                                    <span class="fw-bold text-danger">+ $<span id="monto-recargo">0.00</span> extra</span>
                                </div>
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
        
        <!-- Modal de Ticket Finalizado -->
        <div class="modal fade" id="modalTicketFinalizado" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content border-0 bg-transparent">
                    <div class="modal-body p-0">
                        <div class="card border-0 shadow-lg" style="background: #fffdf5; font-family: 'Courier New', Courier, monospace; color: #333; border-radius: 2px;">
                            <div class="card-header bg-transparent border-0 text-center pt-4 pb-0">
                                <h4 class="mb-0 fw-bold" style="letter-spacing: 1px;">PUNTO DE VENTA</h4>
                                <div class="text-muted small mt-1 fw-bold" id="ticket-finalizado-titulo">Ticket</div>
                                <div class="text-muted small mt-2">--------------------------------</div>
                            </div>
                            <div class="card-body p-3 pt-0 pb-0">
                                <div id="tabla-detalle-finalizado" style="font-size: 13px;"></div>
                                <div class="text-muted small text-center my-2">--------------------------------</div>
                                <div class="d-flex justify-content-between align-items-end mb-2">
                                    <span class="fs-6 fw-bold">TOTAL</span>
                                    <span class="fs-4 fw-bold" id="ticket-finalizado-total">$0.00</span>
                                </div>
                                <div id="desglose-finalizado" style="display: none; font-size: 13px;">
                                    <div class="d-flex justify-content-between text-muted">
                                        <span>Efectivo:</span>
                                        <span>$<span id="ticket-finalizado-efectivo">0.00</span></span>
                                    </div>
                                    <div class="d-flex justify-content-between text-muted">
                                        <span>Transferencia:</span>
                                        <span>$<span id="ticket-finalizado-transferencia">0.00</span></span>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent border-0 text-center pb-4 pt-3">
                                <div class="text-muted small mb-3">--------------------------------</div>
                                <div class="small text-muted mb-3" style="font-size: 11px;">¡Gracias por su compra!</div>
                                <button type="button" class="btn btn-outline-dark btn-sm rounded px-4 fw-bold" data-bs-dismiss="modal" onclick="document.getElementById('buscador-venta').focus()">NUEVA VENTA</button>
                            </div>
                        </div>
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
        // Buscar primero por código exacto (lector de barras) y luego por nombre
        const productoExacto = 
            todosLosProductos.find(p => p.codigo.toLowerCase() === textoBuscado) ||
            todosLosProductos.find(p => p.nombre.toLowerCase() === textoBuscado);
        
        if (productoExacto) {
            window.agregarAlCarrito(productoExacto);
            input.value = '';
            cajaResultados.innerHTML = '';
            // Indicador visual de escaneo exitoso
            const indicator = document.getElementById('scanner-indicator');
            if (indicator) {
                indicator.style.opacity = '1';
                setTimeout(() => { indicator.style.opacity = '0'; }, 600);
            }
            return;
        }
        // Si no hay coincidencia exacta, dejamos la lista de sugerencias visible
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

window.agregarProductoTemporal = function() {
    let desc = document.getElementById('temp-desc').value.trim();
    const precio = parseFloat(document.getElementById('temp-precio').value);

    if (isNaN(precio) || precio <= 0) {
        alert('Por favor inserta un precio válido mayor a cero.');
        document.getElementById('temp-precio').focus();
        return;
    }

    if (!desc) { desc = 'Varios'; }

    // Generamos un ID virtual único para estos productos temporales
    // Si metés otro "Varios" de exactamente el mismo precio, se apila
    const idVirtual = 'temporal_' + desc.toLowerCase().replace(/\\s+/g, '') + '_' + precio;

    window.agregarAlCarrito({
        id: idVirtual,
        nombre: '🔸 ' + desc,
        precio_venta: precio
    });

    document.getElementById('temp-desc').value = '';
    document.getElementById('temp-precio').value = '';
    document.getElementById('buscador-venta').focus();
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
    const seccionRecargo = document.getElementById('seccion-recargo');
    
    // Resetear recargo al cambiar de método
    const inputRecargo = document.getElementById('porcentaje-recargo');
    if (inputRecargo) inputRecargo.value = '0';
    
    if (metodo === 'Efectivo') {
        seccionVuelto.style.display = 'block';
        seccionRecargo.style.display = 'none';
        document.getElementById('paga-con').value = '';
        document.getElementById('vuelto-monto').innerText = '0.00';
        document.getElementById('paga-con').focus();
    } else if (metodo === 'Mixto') {
        seccionVuelto.style.display = 'none';
        seccionRecargo.style.display = 'none';
        const totalVenta = carrito.reduce((suma, item) => suma + item.subtotal, 0);
        document.getElementById('total-pago-mixto').innerText = totalVenta.toFixed(2);
        document.getElementById('monto-efectivo').value = '';
        document.getElementById('monto-transferencia').value = '';
        document.getElementById('faltante-pago').innerText = totalVenta.toFixed(2);
        document.getElementById('resumen-efectivo').innerText = '0.00';
        document.getElementById('resumen-transferencia').innerText = '0.00';
        
        const modalElement = document.getElementById('modalPagoMixto');
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) existingModal.dispose();
        new bootstrap.Modal(modalElement).show();
    } else if (metodo === 'Debito_Credito') {
        seccionVuelto.style.display = 'none';
        seccionRecargo.style.display = 'block';
        inputRecargo.focus();
    } else {
        seccionVuelto.style.display = 'none';
        seccionRecargo.style.display = 'none';
    }
    window.dibujarCarrito(); // Re-actualiza total por si se borro un recargo
};

window.calcularPagoMixto = function() {
    // Calculamos siempre ajustando decimales, convirtiendo a enteros (centavos) para evitar basuras flotantes
    const totalVentaCents = Math.round(carrito.reduce((suma, item) => suma + item.subtotal, 0) * 100);
    const montoEfectivoCents = Math.round((parseFloat(document.getElementById('monto-efectivo').value) || 0) * 100);
    const montoTransferenciaCents = Math.round((parseFloat(document.getElementById('monto-transferencia').value) || 0) * 100);
    
    const faltanteCents = totalVentaCents - (montoEfectivoCents + montoTransferenciaCents);
    const faltanteDecimal = faltanteCents / 100;
    
    document.getElementById('resumen-efectivo').innerText = (montoEfectivoCents / 100).toFixed(2);
    document.getElementById('resumen-transferencia').innerText = (montoTransferenciaCents / 100).toFixed(2);
    
    // Si la matemática arrojaba negativo (-0.00), al forzar Math.max cortamos el faltante inferior a cero.
    document.getElementById('faltante-pago').innerText = faltanteDecimal <= 0 ? "0.00" : faltanteDecimal.toFixed(2);
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
    const totalVentaCents = Math.round(carrito.reduce((suma, item) => suma + item.subtotal, 0) * 100);
    
    if (campoQueCambio === 'efectivo') {
        const strVal = document.getElementById('monto-efectivo').value;
        if (strVal === '') {
            document.getElementById('monto-transferencia').value = '';
        } else {
            const valCents = Math.round((parseFloat(strVal) || 0) * 100);
            const restanteCents = totalVentaCents - valCents;
            document.getElementById('monto-transferencia').value = restanteCents > 0 ? (restanteCents / 100).toFixed(2) : "0.00";
        }
    } else if (campoQueCambio === 'transferencia') {
        const strVal = document.getElementById('monto-transferencia').value;
        if (strVal === '') {
            document.getElementById('monto-efectivo').value = '';
        } else {
            const valCents = Math.round((parseFloat(strVal) || 0) * 100);
            const restanteCents = totalVentaCents - valCents;
            document.getElementById('monto-efectivo').value = restanteCents > 0 ? (restanteCents / 100).toFixed(2) : "0.00";
        }
    }
    
    window.calcularPagoMixto();
};

window.confirmartPagoMixto = function() {
    // Convertir de nuevo todo a enteros de centavos para proteger el if de falsos positivos
    const totalVentaCents = Math.round(carrito.reduce((suma, item) => suma + item.subtotal, 0) * 100);
    const montoEfectivoCents = Math.round((parseFloat(document.getElementById('monto-efectivo').value) || 0) * 100);
    const montoTransferenciaCents = Math.round((parseFloat(document.getElementById('monto-transferencia').value) || 0) * 100);
    
    const totalAbonadoCents = montoEfectivoCents + montoTransferenciaCents;
    
    if (totalAbonadoCents < totalVentaCents) {
        const faltanteReal = (totalVentaCents - totalAbonadoCents) / 100;
        alert('El total ingresado no cubre la venta. Faltante: $' + faltanteReal.toFixed(2));
        return;
    }
    
    if (totalAbonadoCents > totalVentaCents) {
        const excesoReal = (totalAbonadoCents - totalVentaCents) / 100;
        alert('El total ingresado supera la venta. Exceso: $' + excesoReal.toFixed(2));
        return;
    }
    
    pagoMixto = {
        efectivo: montoEfectivoCents / 100,
        transferencia: montoTransferenciaCents / 100
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
    
    // Cálculo condicional del recargo
    const metodoObj = document.getElementById('metodo-pago');
    let recargo = 0;
    if (metodoObj && metodoObj.value === 'Debito_Credito') {
        const objRecargo = document.getElementById('porcentaje-recargo');
        const pct = objRecargo ? parseFloat(objRecargo.value) || 0 : 0;
        if (pct > 0) {
            recargo = totalGeneral * (pct / 100);
        }
        const elMontoRecargo = document.getElementById('monto-recargo');
        if (elMontoRecargo) elMontoRecargo.innerText = recargo.toFixed(2);
    }
    
    document.getElementById('total-venta').innerText = (totalGeneral + recargo).toFixed(2);
};

window.confirmarVenta = async function() {
    if (carrito.length === 0) { alert("Agregá algún producto antes de vender."); return; }
    try {
        let baseTotal = carrito.reduce((suma, item) => suma + item.subtotal, 0);
        let totalVenta = baseTotal;
        let metodoPagoOriginal = document.getElementById('metodo-pago').value;
        let metodoPago = metodoPagoOriginal;
        
        let carritoFinal = [...carrito];
        
        if (metodoPagoOriginal === 'Debito_Credito') {
            const porcentaje = parseFloat(document.getElementById('porcentaje-recargo').value) || 0;
            if (porcentaje > 0) {
                const recargoValue = baseTotal * (porcentaje / 100);
                totalVenta += recargoValue;
                carritoFinal.push({
                    id: 0,
                    nombre: '🔸 Recargo Tarjeta (' + porcentaje + '%)',
                    cantidad: 1,
                    precio_venta: recargoValue,
                    subtotal: recargoValue
                });
            }
            metodoPago = 'Débito / Crédito';
        }
        
        let montoEfectivo = null;
        let montoTransferencia = null;
        
        // Si es pago mixto, armamos el string con detalles y guardamos montos separados
        if (pagoMixto) {
            metodoPago = `Efectivo: $${pagoMixto.efectivo.toFixed(2)} | Transferencia: $${pagoMixto.transferencia.toFixed(2)}`;
            montoEfectivo = pagoMixto.efectivo;
            montoTransferencia = pagoMixto.transferencia;
        } else if (metodoPagoOriginal === 'Efectivo') {
            montoEfectivo = totalVenta;
            montoTransferencia = 0;
        } else if (metodoPagoOriginal === 'Transferencia' || metodoPagoOriginal === 'Debito_Credito') {
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
        for (const item of carritoFinal) {
            await db.execute(
                'INSERT INTO detalle_ventas (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)', 
                [idVenta, item.id || 0, item.nombre, item.cantidad, item.precio_venta, item.subtotal]
            );
        }
        
        carrito = [];
        pagoMixto = null;
        document.getElementById('porcentaje-recargo').value = '0';
        document.getElementById('monto-recargo').innerText = '0.00';
        document.getElementById('metodo-pago').value = 'Efectivo';
        window.manejarCambioPago();
        window.dibujarCarrito();
        document.getElementById('buscador-venta').focus();
        
        const boton = document.querySelector('button[onclick="confirmarVenta()"]');
        const textoOriginal = boton.innerHTML;
        boton.innerHTML = '¡VENTA EXITOSA! 🎉';
        boton.classList.replace('btn-success', 'btn-primary');
        setTimeout(() => { boton.innerHTML = textoOriginal; boton.classList.replace('btn-primary', 'btn-success'); }, 1500);
        
        // 4. Mostrar el ticket finalizado en pantalla
        window.mostrarTicketRealizado(idVenta, totalVenta);
        
    } catch (error) {
        console.error(error);
        alert("Error al guardar venta.");
    }
};

window.mostrarTicketRealizado = async function(idVenta, totalVenta) {
    if (!db) return;
    try {
        const ventaInfo = await db.select('SELECT * FROM ventas WHERE id = ?', [idVenta]);
        const venta = ventaInfo[0];
        
        const detalles = await db.select('SELECT * FROM detalle_ventas WHERE venta_id = ?', [idVenta]);
        
        const tbody = document.getElementById('tabla-detalle-finalizado');
        tbody.innerHTML = '';
        detalles.forEach(item => { 
            tbody.innerHTML += `
            <div class="d-flex justify-content-between mb-1">
                <div class="pe-2 text-wrap"><span class="fw-bold">${item.cantidad}x</span> ${item.producto_nombre}</div>
                <div>$${item.subtotal.toFixed(2)}</div>
            </div>`; 
        });
        
        document.getElementById('ticket-finalizado-titulo').innerText = '🧾 Ticket #' + idVenta.toString().padStart(4, '0');
        document.getElementById('ticket-finalizado-total').innerText = '$' + totalVenta.toFixed(2);
        
        const desgloseElement = document.getElementById('desglose-finalizado');
        if (venta.monto_efectivo !== null && venta.monto_transferencia !== null && (venta.monto_efectivo > 0 || venta.monto_transferencia > 0)) {
            desgloseElement.style.display = 'block';
            document.getElementById('ticket-finalizado-efectivo').innerText = venta.monto_efectivo.toFixed(2);
            document.getElementById('ticket-finalizado-transferencia').innerText = venta.monto_transferencia.toFixed(2);
        } else {
            desgloseElement.style.display = 'none';
        }
        
        new bootstrap.Modal(document.getElementById('modalTicketFinalizado')).show();
    } catch (error) { 
        console.error("Error mostrando ticket post-venta:", error); 
    }
};