let db = null;

export async function cargarVistaHistorial(contenedor, baseDeDatos) {
    db = baseDeDatos;
    contenedor.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>📋 Turno Actual (Caja Abierta)</h2>
            <button class="btn btn-danger fw-bold px-4 shadow-sm" onclick="cerrarCaja()">🔒 Finalizar Día / Cerrar Caja</button>
        </div>
        
        <div class="row mb-4 g-3">
            <div class="col-md-3">
                <div class="card bg-primary text-white shadow-sm border-0 h-100">
                    <div class="card-body text-center py-3">
                        <h6 class="text-uppercase fw-bold mb-1">🛒 Ventas Totales</h6>
                        <h2 class="fw-bold mb-0" id="cantidad-ventas">0</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white shadow-sm border-0 h-100">
                    <div class="card-body text-center py-3">
                        <h6 class="text-uppercase fw-bold mb-1">💰 Recaudación</h6>
                        <h2 class="fw-bold mb-0" id="total-recaudacion">$0.00</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-secondary text-white shadow-sm border-0 h-100">
                    <div class="card-body text-center py-3">
                        <h6 class="text-uppercase fw-bold mb-1">💵 En Efectivo</h6>
                        <h2 class="fw-bold mb-0" id="total-efectivo">$0.00</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white shadow-sm border-0 h-100">
                    <div class="card-body text-center py-3">
                        <h6 class="text-uppercase fw-bold mb-1">📱 Transferencia</h6>
                        <h2 class="fw-bold mb-0" id="total-transferencia">$0.00</h2>
                    </div>
                </div>
            </div>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-body p-0" style="max-height: 500px; overflow-y: auto;">
                <table class="table table-hover table-striped mb-0 text-center align-middle">
                    <thead class="table-dark" style="position: sticky; top: 0; z-index: 10;"><tr><th>N° Ticket</th><th>Hora</th><th>Método de Pago</th><th>Total</th><th>Acciones</th></tr></thead>
                    <tbody id="tabla-historial"></tbody>
                </table>
            </div>
        </div>
        
        <div class="modal fade" id="modalTicket" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content border-0 bg-transparent">
                    <div class="modal-body p-0">
                        <div class="card border-0 shadow-lg" style="background: #fffdf5; font-family: 'Courier New', Courier, monospace; color: #333; border-radius: 2px;">
                            <div class="card-header bg-transparent border-0 text-center pt-4 pb-0">
                                <h4 class="mb-0 fw-bold" style="letter-spacing: 1px;">PUNTO DE VENTA</h4>
                                <div class="text-muted small mt-1 fw-bold" id="ticket-titulo">Ticket</div>
                                <div class="text-muted small mt-2">--------------------------------</div>
                            </div>
                            <div class="card-body p-3 pt-0 pb-0">
                                <div id="tabla-detalle-ticket" style="font-size: 13px;"></div>
                                <div class="text-muted small text-center my-2">--------------------------------</div>
                                <div class="d-flex justify-content-between align-items-end mb-2">
                                    <span class="fs-6 fw-bold">TOTAL</span>
                                    <span class="fs-4 fw-bold" id="ticket-total">$0.00</span>
                                </div>
                                <div id="desglose-pago" style="display: none; font-size: 13px;">
                                    <div class="d-flex justify-content-between text-muted">
                                        <span>Efectivo:</span>
                                        <span>$<span id="ticket-efectivo">0.00</span></span>
                                    </div>
                                    <div class="d-flex justify-content-between text-muted">
                                        <span>Transferencia:</span>
                                        <span>$<span id="ticket-transferencia">0.00</span></span>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent border-0 text-center pb-4 pt-3">
                                <div class="text-muted small mb-3">--------------------------------</div>
                                <div class="small text-muted mb-3" style="font-size: 11px;">¡Gracias por su compra!</div>
                                <button type="button" class="btn btn-outline-dark btn-sm rounded px-4 fw-bold" data-bs-dismiss="modal">CERRAR RECIBO</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal fade" id="modalConfirmarCierre" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title fw-bold">🔒 Finalizar Día</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <h4 class="mb-3">¿Estás seguro que querés finalizar el día?</h4>
                        <p class="text-secondary mb-0">La caja se cerrará y se iniciará un nuevo turno.</p>
                    </div>
                    <div class="modal-footer bg-light border-top-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger fw-bold" onclick="continuarCierreCaja()">Sí, Finalizar</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal fade" id="modalDatosEmpleado" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-dark text-white">
                        <h5 class="modal-title fw-bold">👤 Datos del Empleado</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <label class="form-label fw-bold">Ingresá tu nombre:</label>
                        <input type="text" id="nombre-empleado-cierre" class="form-control form-control-lg" placeholder="Tu nombre completo" autofocus>
                    </div>
                    <div class="modal-footer bg-light border-top-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success fw-bold" onclick="finalizarCierreCaja()">Continuar</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal fade" id="modalSinVentas" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title fw-bold">⚠️ Sin Ventas Registradas</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <h4 class="mb-2 text-secondary">No hay ventas registradas</h4>
                        <p class="text-secondary mb-0">Debes registrar al menos una venta para poder cerrar la caja.</p>
                    </div>
                    <div class="modal-footer bg-light border-top-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Entendido</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    await window.cargarHistorial();
}

window.cargarHistorial = async function() {
    if (!db) return;
    try {
        // 1. Buscamos la caja que está abierta actualmente
        const cajas = await db.select("SELECT id FROM cajas WHERE estado = 'ABIERTA' LIMIT 1");
        if (cajas.length === 0) return;
        const cajaActivaId = cajas[0].id;

        // 2. Traemos SOLO las ventas de esta caja
        const ventas = await db.select('SELECT * FROM ventas WHERE caja_id = ? ORDER BY id DESC', [cajaActivaId]);
        const tbody = document.getElementById('tabla-historial');
        tbody.innerHTML = '';
        
        let sumaEfectivo = 0;
        let sumaTransferencia = 0;
        let cantidadVentas = ventas.length;
        
        ventas.forEach(venta => {
            // Determinamos efectivo y transferencia considerando pagos mixtos
            if (venta.monto_efectivo != null && venta.monto_transferencia != null) {
                // Pago mixto: usar los montos guardados
                sumaEfectivo += Number(venta.monto_efectivo);
                sumaTransferencia += Number(venta.monto_transferencia);
            } else if (venta.metodo_pago === 'Efectivo') {
                sumaEfectivo += venta.total;
            } else if (venta.metodo_pago === 'Transferencia') {
                sumaTransferencia += venta.total;
            }
            
            // Solo mostramos la hora en la tabla, porque sabemos que es del turno actual
            const horaAr = new Date(venta.fecha + 'Z').toLocaleTimeString('es-AR', { hour: '2-digit', minute:'2-digit' });
            const colorBadge = venta.metodo_pago === 'Efectivo' ? 'secondary' : 'info';
            const iconoPago = venta.metodo_pago === 'Efectivo' ? '💵 Efectivo' : (venta.metodo_pago === 'Transferencia' ? '📱 Transf.' : '💳 Mixto');
            
            tbody.innerHTML += `<tr style="cursor: pointer;" onclick="verDetalleTicket(${venta.id}, ${venta.total})"><td class="fw-bold fs-5 text-secondary">#${venta.id.toString().padStart(4, '0')}</td><td class="text-muted">${horaAr}</td><td><span class="badge bg-${colorBadge} text-white px-3 py-2">${iconoPago}</span></td><td class="fw-bold text-success fs-5">$${venta.total.toFixed(2)}</td><td><button class="btn btn-sm btn-outline-primary fw-bold" onclick="event.stopPropagation(); verDetalleTicket(${venta.id}, ${venta.total})">📄 Ver</button></td></tr>`;
        });
        
        const totalRecaudacion = sumaEfectivo + sumaTransferencia;

        // Actualizamos las 4 tarjetas
        document.getElementById('cantidad-ventas').innerText = cantidadVentas;
        document.getElementById('total-recaudacion').innerText = '$' + totalRecaudacion.toFixed(2);
        document.getElementById('total-efectivo').innerText = '$' + sumaEfectivo.toFixed(2);
        document.getElementById('total-transferencia').innerText = '$' + sumaTransferencia.toFixed(2);

    } catch (error) { console.error("Error al cargar historial:", error); }
};

// --- LA FUNCIÓN ESTRELLA: CERRAR LA CAJA ---
window.cerrarCaja = async function() {
    try {
        // 1. Buscamos la caja activa
        const cajas = await db.select("SELECT id FROM cajas WHERE estado = 'ABIERTA' LIMIT 1");
        const cajaActivaId = cajas[0].id;
        
        // 2. Verificamos que haya al menos una venta
        const ventas = await db.select("SELECT id FROM ventas WHERE caja_id = ? LIMIT 1", [cajaActivaId]);
        
        if (ventas.length === 0) {
            // Si no hay ventas, mostrar modal de advertencia
            const modal = new bootstrap.Modal(document.getElementById('modalSinVentas'));
            modal.show();
            return;
        }
        
        // Si hay ventas, mostrar modal de confirmación
        const modal = new bootstrap.Modal(document.getElementById('modalConfirmarCierre'));
        modal.show();
        
    } catch (error) {
        console.error("Error:", error);
    }
};

window.continuarCierreCaja = async function() {
    // Cerrar modal de confirmación
    bootstrap.Modal.getInstance(document.getElementById('modalConfirmarCierre')).hide();
    
    // Mostrar modal para ingresar nombre
    const modal = new bootstrap.Modal(document.getElementById('modalDatosEmpleado'));
    modal.show();
    
    // Limpiar input
    document.getElementById('nombre-empleado-cierre').value = '';
    document.getElementById('nombre-empleado-cierre').focus();
};

window.finalizarCierreCaja = async function() {
    const nombreEmpleado = document.getElementById('nombre-empleado-cierre').value.trim();
    
    if (!nombreEmpleado) {
        alert("Debe ingresar un nombre de empleado.");
        return;
    }

    try {
        // 1. Buscamos la caja activa
        const cajas = await db.select("SELECT id FROM cajas WHERE estado = 'ABIERTA' LIMIT 1");
        const cajaActivaId = cajas[0].id;

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('modalDatosEmpleado')).hide();
        
        // 2. Le ponemos candado (CERRADA) y le marcamos la hora exacta de salida con el nombre
        await db.execute(
            "UPDATE cajas SET estado = 'CERRADA', fecha_cierre = CURRENT_TIMESTAMP, nombre_empleado = ? WHERE id = ?", 
            [nombreEmpleado, cajaActivaId]
        );

        // 3. Abrimos una caja nuevecita y limpia para el próximo turno/día
        await db.execute("INSERT INTO cajas (estado) VALUES ('ABIERTA')");

        alert("¡Caja cerrada con éxito! Todo guardado. Empezando un nuevo turno.");
        
        // Refrescamos la pantalla para ver todo en cero
        window.cargarHistorial();

    } catch (error) {
        console.error("Error al cerrar caja:", error);
        alert("Hubo un problema al cerrar la caja.");
    }
};

window.verDetalleTicket = async function(idVenta, totalVenta) {
    if (!db) return;
    try {
        // Traemos los detalles de la venta incluyendo cómo se pagó
        const ventaInfo = await db.select('SELECT * FROM ventas WHERE id = ?', [idVenta]);
        const venta = ventaInfo[0];
        
        const detalles = await db.select('SELECT * FROM detalle_ventas WHERE venta_id = ?', [idVenta]);
        const tbody = document.getElementById('tabla-detalle-ticket');
        tbody.innerHTML = '';
        detalles.forEach(item => { 
            tbody.innerHTML += `
            <div class="d-flex justify-content-between mb-1">
                <div class="pe-2 text-wrap"><span class="fw-bold">${item.cantidad}x</span> ${item.producto_nombre}</div>
                <div>$${item.subtotal.toFixed(2)}</div>
            </div>`; 
        });
        
        document.getElementById('ticket-titulo').innerText = '🧾 Ticket #' + idVenta.toString().padStart(4, '0');
        document.getElementById('ticket-total').innerText = '$' + totalVenta.toFixed(2);
        
        // Mostramos el desglose de pago si es mixto
        const desgloseElement = document.getElementById('desglose-pago');
        if (venta.monto_efectivo !== null && venta.monto_transferencia !== null && (venta.monto_efectivo > 0 || venta.monto_transferencia > 0)) {
            desgloseElement.style.display = 'block';
            document.getElementById('ticket-efectivo').innerText = venta.monto_efectivo.toFixed(2);
            document.getElementById('ticket-transferencia').innerText = venta.monto_transferencia.toFixed(2);
        } else {
            desgloseElement.style.display = 'none';
        }
        
        new bootstrap.Modal(document.getElementById('modalTicket')).show();
    } catch (error) { console.error("Error ticket:", error); }
};