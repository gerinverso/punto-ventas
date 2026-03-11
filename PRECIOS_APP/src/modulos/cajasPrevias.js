export async function cargarVistaCajasPrevias(contenedor, db) {
    try {
        // Traemos todas las cajas que están cerradas
        const cajasCerradas = await db.select(`
            SELECT * FROM cajas 
            WHERE estado != 'ABIERTA' 
            ORDER BY fecha_cierre DESC
        `);

        if (cajasCerradas.length === 0) {
            contenedor.innerHTML = `
                <div class="container mt-5">
                    <div class="alert alert-info" role="alert">
                        <h4 class="alert-heading">No hay cajas anteriores</h4>
                        <p>Aún no se ha cerrado ninguna caja registradora.</p>
                    </div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="container mt-4">
                <h2>Cajas Anteriores</h2>
                <div style="max-height: 600px; overflow-y: auto;">
                <div class="list-group">
        `;

        // Para cada caja, traemos el total de ventas
        for (const caja of cajasCerradas) {
            const ventas = await db.select(`
                SELECT SUM(total) as total_caja, COUNT(*) as cantidad_ventas 
                FROM ventas 
                WHERE caja_id = ?
            `, [caja.id]);

            const totalCaja = ventas[0]?.total_caja || 0;
            const cantidadVentas = ventas[0]?.cantidad_ventas || 0;

            const fecha = new Date(caja.fecha_apertura);
            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const nombreDia = dias[fecha.getDay()];
            const fechaFormato = fecha.toLocaleDateString('es-AR');
            const titulo = `${nombreDia} ${fechaFormato}`;
            
            // Obtenemos la hora de cierre si existe
            let horaCierre = '';
            let nombreEmpleado = '';
            if (caja.fecha_cierre) {
                const fechaCierre = new Date(caja.fecha_cierre);
                horaCierre = fechaCierre.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                nombreEmpleado = caja.nombre_empleado ? ` - ${caja.nombre_empleado}` : '';
            }

            html += `
                <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" style="cursor: pointer;" onclick="verDetallesCaja(${caja.id})">
                    <div>
                        <h6 class="mb-2">${titulo}</h6>
                        <small class="text-muted">Ventas: ${cantidadVentas}</small>
                        ${horaCierre ? `<small class="text-muted d-block">Cerrado a las ${horaCierre}${nombreEmpleado}</small>` : ''}
                    </div>
                    <div class="text-end">
                        <h5 class="mb-0">$${totalCaja.toFixed(2)}</h5>
                    </div>
                </div>
            `;
        }

        html += `
                </div>
                </div>
            </div>
        `;

        contenedor.innerHTML = html;

        // Función para ver detalles de una caja específica
        window.verDetallesCaja = async function(cajaId) {
            const detalles = await db.select(`
                SELECT v.id, v.total, v.fecha, v.metodo_pago, v.monto_efectivo, v.monto_transferencia, COUNT(dv.id) as items
                FROM ventas v
                LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
                WHERE v.caja_id = ?
                GROUP BY v.id
                ORDER BY v.fecha DESC
            `, [cajaId]);

            let totalCaja = 0;
            detalles.forEach(v => totalCaja += v.total);

            let detalleHTML = `
                <div class="container-fluid p-4">
                    <button class="btn btn-secondary mb-3" onclick="window.cambiarVista('cajasPrevias')">
                        ← Volver a Cajas Previas
                    </button>
                    <h2 class="mb-4">🧾 Ventas de Caja #${cajaId}</h2>
                    
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="card bg-success text-white shadow-sm border-0">
                                <div class="card-body text-center">
                                    <h6 class="text-uppercase fw-bold mb-1">Total Caja</h6>
                                    <h2 class="fw-bold mb-0">$${totalCaja.toFixed(2)}</h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-primary text-white shadow-sm border-0">
                                <div class="card-body text-center">
                                    <h6 class="text-uppercase fw-bold mb-1">Cantidad Ventas</h6>
                                    <h2 class="fw-bold mb-0">${detalles.length}</h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-secondary text-white shadow-sm border-0">
                                <div class="card-body text-center">
                                    <h6 class="text-uppercase fw-bold mb-1">Promedio por Venta</h6>
                                    <h2 class="fw-bold mb-0">$${(totalCaja / (detalles.length || 1)).toFixed(2)}</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card shadow-sm border-0">
                        <div class="card-body p-0" style="max-height: calc(100vh - 350px); overflow-y: auto;">
                            <div class="list-group list-group-flush">
            `;

            for (const venta of detalles) {
                const fecha = new Date(venta.fecha);
                const horaVenta = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                
                let iconoPago = '💵';
                let colorPago = 'success';
                if (venta.metodo_pago === 'Transferencia') {
                    iconoPago = '📱';
                    colorPago = 'info';
                } else if (venta.metodo_pago === 'Mixto') {
                    iconoPago = '💳';
                    colorPago = 'warning';
                }
                
                let desglose = '';
                if (venta.metodo_pago === 'Mixto') {
                    desglose = `<br><small class="text-muted">💵 $${(venta.monto_efectivo || 0).toFixed(2)} | 📱 $${(venta.monto_transferencia || 0).toFixed(2)}</small>`;
                }
                
                detalleHTML += `
                    <div class="list-group-item list-group-item-action p-3 border-bottom" style="cursor: pointer;" onclick="verEntidadTicketAnterior(${venta.id})">
                        <div class="d-flex justify-content-between align-items-start">
                            <div style="flex: 1;">
                                <h6 class="mb-1 fw-bold">#${venta.id.toString().padStart(4, '0')} - ${horaVenta}</h6>
                                <small class="text-muted">📦 ${venta.items} productos</small>
                                ${desglose}
                            </div>
                            <div class="text-end">
                                <h5 class="mb-0 text-success fw-bold">$${venta.total.toFixed(2)}</h5>
                                <small class="badge bg-${colorPago} text-white">${iconoPago} ${venta.metodo_pago}</small>
                            </div>
                        </div>
                    </div>
                `;
            }

            detalleHTML += `
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal fade" id="modalTicketAnterior" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content border-0 shadow">
                            <div class="modal-header bg-dark text-white">
                                <h5 class="modal-title fw-bold" id="titulo-ticket-anterior">Detalle del Ticket</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body p-0">
                                <table class="table table-sm table-striped text-center mb-0 align-middle">
                                    <thead class="table-secondary">
                                        <tr><th class="text-start ps-3 py-2">Producto</th><th>Cant</th><th>Precio</th><th>Subtotal</th></tr>
                                    </thead>
                                    <tbody id="tabla-detalle-anterior"></tbody>
                                </table>
                            </div>
                            <div class="modal-footer bg-light d-flex flex-column border-top-0 gap-2">
                                <div class="d-flex justify-content-between">
                                    <h4 class="mb-0 text-secondary">Total:</h4>
                                    <h2 class="mb-0 text-success fw-bold" id="total-ticket-anterior">$0.00</h2>
                                </div>
                                <div id="desglose-anterior" style="display: none;" class="border-top pt-2">
                                    <div class="d-flex justify-content-between mb-2">
                                        <span class="text-secondary">Efectivo:</span>
                                        <span class="fw-bold">$<span id="ticket-efectivo-anterior">0.00</span></span>
                                    </div>
                                    <div class="d-flex justify-content-between">
                                        <span class="text-secondary">Transferencia:</span>
                                        <span class="fw-bold">$<span id="ticket-transf-anterior">0.00</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('app-content').innerHTML = detalleHTML;
        };
        
        // Función para ver detalles de un ticket anterior
        window.verEntidadTicketAnterior = async function(ventaId) {
            try {
                const ventaInfo = await db.select('SELECT * FROM ventas WHERE id = ?', [ventaId]);
                const venta = ventaInfo[0];
                
                const detalles = await db.select('SELECT * FROM detalle_ventas WHERE venta_id = ?', [ventaId]);
                const tbody = document.getElementById('tabla-detalle-anterior');
                tbody.innerHTML = '';
                
                detalles.forEach(item => {
                    tbody.innerHTML += `<tr><td class="text-start ps-3 fw-bold text-secondary">${item.producto_nombre}</td><td><span class="badge bg-secondary">${item.cantidad}</span></td><td class="text-muted">$${item.precio_unitario.toFixed(2)}</td><td class="fw-bold">$${item.subtotal.toFixed(2)}</td></tr>`;
                });
                
                document.getElementById('titulo-ticket-anterior').innerText = '🧾 Ticket #' + ventaId.toString().padStart(4, '0');
                document.getElementById('total-ticket-anterior').innerText = '$' + venta.total.toFixed(2);
                
                // Desglose si es mixto
                const desgloseElement = document.getElementById('desglose-anterior');
                if (venta.monto_efectivo !== null && venta.monto_transferencia !== null && (venta.monto_efectivo > 0 || venta.monto_transferencia > 0)) {
                    desgloseElement.style.display = 'block';
                    document.getElementById('ticket-efectivo-anterior').innerText = venta.monto_efectivo.toFixed(2);
                    document.getElementById('ticket-transf-anterior').innerText = venta.monto_transferencia.toFixed(2);
                } else {
                    desgloseElement.style.display = 'none';
                }
                
                new bootstrap.Modal(document.getElementById('modalTicketAnterior')).show();
            } catch (error) {
                console.error("Error:", error);
            }
        };

    } catch (error) {
        console.error('Error en cajas previas:', error);
        contenedor.innerHTML = `<div class="alert alert-danger">Error al cargar cajas previas</div>`;
    }
}