let db = null;
let todosLosProductos = [];

export async function cargarVistaProductos(contenedor, baseDeDatos) {
    db = baseDeDatos;
    contenedor.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>📦 PRODUCTOS</h2>
            <button class="btn btn-success fw-bold px-4 shadow-sm" onclick="abrirModalNuevo()">+ Nuevo Producto</button>
        </div>
        <div class="card mb-4 shadow-sm border-0">
            <div class="card-body bg-white rounded">
                <input type="text" id="buscador-productos" class="form-control form-control-lg" placeholder="🔍 Buscar producto..." onkeyup="filtrarProductos()">
            </div>
        </div>
        <div class="card shadow-sm border-0">
            <div class="card-body p-0 table-responsive" style="max-height: 500px; overflow-y: auto;">
                <table class="table table-hover table-striped mb-0 text-center align-middle" style="min-width: 600px;">
                    <thead class="table-dark" style="position: sticky; top: 0; z-index: 10;">
                        <tr><th class="text-start ps-4">Nombre / Código</th><th>Categoría</th><th style="display:none;">Stock</th><th>Precio Costo</th><th>Precio Venta</th><th>Acciones</th></tr>
                    </thead>
                    <tbody id="tabla-productos"></tbody>
                </table>
            </div>
        </div>
        
        <div class="mt-3 text-muted" style="font-size: 0.85rem;">
            ℹ️ <b>Nota aclaratoria:</b> Si el producto te sale de costo $100, deberías verificar si se te aplica IVA o no al comprarlo y poner el porcentaje correspondiente en la casilla. En caso de no llevar, colocar 0.<br>
            <i>* El "Precio al público" real final del producto, será siempre el que figure como "Precio de venta iva".</i>
        </div>

        <div class="modal fade" id="modalProducto" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header bg-dark text-white">
                <h5 class="modal-title" id="modal-titulo">Agregar Nuevo Producto</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body p-4">
                <form id="form-producto" onsubmit="guardarProducto(event)">
                    <input type="hidden" id="prod-id">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Código de Barras</label>
                            <input type="text" id="prod-codigo" class="form-control">
                            <div class="form-text mt-1 text-muted" style="font-size: 0.75rem;">Si no tiene, dejalo vacío y se generará uno automático.</div>
                        </div>
                        <div class="col-md-6"><label class="form-label fw-bold">Nombre</label><input type="text" id="prod-nombre" class="form-control" required></div>
                        <div class="col-md-12"><label class="form-label fw-bold">Categoría</label><select id="prod-categoria" class="form-select" required><option value="Almacén">Almacén</option><option value="Bebidas">Bebidas</option><option value="Lácteos">Lácteos</option><option value="Golosinas">Golosinas</option><option value="Limpieza">Limpieza</option><option value="Fiambrería">Fiambrería</option><option value="Galletitas">Galletitas</option><option value="Varios">Varios</option></select></div>
                        <div class="col-md-6" style="display:none;"><label class="form-label fw-bold">Stock</label><select id="prod-stock" class="form-select" required><option value="Alto">Alto</option><option value="Medio" selected>Medio</option><option value="Bajo">Bajo</option></select></div>
                        <div class="col-12 mt-4">
                            <div class="p-3 bg-light border border-secondary border-opacity-25 rounded shadow-sm">
                                <h6 class="text-secondary mb-3 fw-bold">💰 Precios y Rentabilidad</h6>
                                
                                <div class="row g-3">
                                    <!-- Primera Fila -->
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold small text-muted mb-1">Precio de costo</label>
                                        <input type="number" step="0.01" id="prod-costo" class="form-control border-primary fw-bold text-primary" oninput="calcularVenta()" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold small text-muted mb-1">Porcentaje de utilidad</label>
                                        <input type="number" step="1" id="prod-margen" class="form-control border-primary fw-bold text-primary" value="30" oninput="calcularVenta()" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold small text-muted mb-1">Precio de venta neto</label>
                                        <input type="text" id="prod-venta-neto" class="form-control border-secondary text-secondary bg-white fw-bold" readonly placeholder="0.00">
                                    </div>
                        
                                    <!-- Segunda Fila -->
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold small text-muted mb-1">Alícuota de IVA</label>
                                        <select id="prod-iva" class="form-select border-primary fw-bold text-primary" onchange="calcularVenta()" required>
                                            <option value="27">27%</option>
                                            <option value="21" selected>21%</option>
                                            <option value="10.5">10.5%</option>
                                            <option value="0">0%</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold text-success mb-1">PRECIO DE VENTA IVA</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-success text-white border-success fw-bold">$</span>
                                            <input type="text" id="prod-venta" class="form-control form-control-lg border-success bg-light fw-bold text-success px-2 py-1" readonly placeholder="0.00" required>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-bold small text-primary mb-1">Ganancia neta ($)</label>
                                        <input type="text" id="prod-ganancia-moneda" class="form-control border-primary fw-bold text-primary bg-light" readonly placeholder="+ 0.00">
                                    </div>
                                </div>
                                <div class="mt-3 text-muted" style="font-size: 0.85rem;">
                                    ℹ️ <b>Nota aclaratoria:</b> Si el producto te sale de costo $100, deberías verificar si se te aplica IVA o no al comprarlo y poner el porcentaje correspondiente en la casilla. En caso de no llevar, colocar 0.<br>
                                    <i>* El "Precio al público" real final del producto, será siempre el que figure como "PRECIO DE VENTA IVA".</i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-top text-end">
                        <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" id="btn-guardar" class="btn btn-success fw-bold px-4">Guardar</button>
                    </div>
                </form>
              </div>
            </div>
          </div>
        </div>
    `;
    await window.cargarProductos();
}

window.calcularVenta = function () {
    const costo = parseFloat(document.getElementById('prod-costo').value) || 0;
    const utilidadPorcentaje = parseFloat(document.getElementById('prod-margen').value) || 0;
    const ivaPorcentaje = parseFloat(document.getElementById('prod-iva').value) || 0;
    
    // 1. Calculamos Venta Neta (Costo + Utilidad)
    const gananciaMoneda = costo * (utilidadPorcentaje / 100);
    const precioNeto = costo + gananciaMoneda;
    const inputNeto = document.getElementById('prod-venta-neto');
    if(inputNeto) inputNeto.value = precioNeto.toFixed(2);
    
    // 2. Calculamos Venta con IVA (Neto + IVA del Neto)
    const ivaMoneda = precioNeto * (ivaPorcentaje / 100);
    const precioVentaIva = precioNeto + ivaMoneda;
    
    document.getElementById('prod-ganancia-moneda').value = '+ $' + gananciaMoneda.toFixed(2);
    document.getElementById('prod-venta').value = precioVentaIva.toFixed(2);
};

window.abrirModalNuevo = function () {
    document.getElementById('form-producto').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-stock').value = 'Medio'; // Fuerza el stock Medio
    document.getElementById('prod-ganancia-moneda').value = '';
    const inputNeto = document.getElementById('prod-venta-neto');
    if(inputNeto) inputNeto.value = '';
    document.getElementById('modal-titulo').innerText = 'Agregar Nuevo Producto';
    document.getElementById('btn-guardar').innerText = 'Guardar';
    new bootstrap.Modal(document.getElementById('modalProducto')).show();
};

window.editarProducto = function (id) {
    const prod = todosLosProductos.find(p => p.id === id);
    if (!prod) return;
    document.getElementById('prod-id').value = prod.id;
    document.getElementById('prod-codigo').value = prod.codigo;
    document.getElementById('prod-nombre').value = prod.nombre;
    document.getElementById('prod-categoria').value = prod.categoria;
    document.getElementById('prod-stock').value = prod.stock;
    document.getElementById('prod-costo').value = prod.precio_costo;
    const ivaPorcentaje = prod.iva !== undefined && prod.iva !== null ? prod.iva : 21;
    document.getElementById('prod-iva').value = ivaPorcentaje;
    document.getElementById('prod-venta').value = prod.precio_venta;
    
    const costoBase = prod.precio_costo;
    
    // Desglosar la fórmula de Venta = Neto * (1 + iva/100) -> Neto = Venta / (1 + iva/100)
    const precioNeto = prod.precio_venta / (1 + (ivaPorcentaje / 100));
    const inputNeto = document.getElementById('prod-venta-neto');
    if(inputNeto) inputNeto.value = precioNeto.toFixed(2);
    
    // Ganancia Real en base al Neto
    const gananciaReales = precioNeto - costoBase;
    
    document.getElementById('prod-margen').value = costoBase > 0 ? Math.round((gananciaReales / costoBase) * 100) : 0;
    document.getElementById('prod-ganancia-moneda').value = '+ $' + Math.max(0, gananciaReales).toFixed(2);
    document.getElementById('modal-titulo').innerText = '✏️ Editar: ' + prod.nombre;
    document.getElementById('btn-guardar').innerText = 'Actualizar';
    new bootstrap.Modal(document.getElementById('modalProducto')).show();
};

window.guardarProducto = async function (event) {
    event.preventDefault();
    if (!db) return;
    const idOculto = document.getElementById('prod-id').value;
    let codigo = document.getElementById('prod-codigo').value.trim();
    if (!codigo) {
        codigo = 'GEN-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
    const nombre = document.getElementById('prod-nombre').value;
    const categoria = document.getElementById('prod-categoria').value;
    const stock = document.getElementById('prod-stock').value;
    const costo = parseFloat(document.getElementById('prod-costo').value);
    const iva = parseFloat(document.getElementById('prod-iva').value) || 0;
    const venta = parseFloat(document.getElementById('prod-venta').value);

    try {
        if (idOculto) {
            await db.execute('UPDATE productos SET codigo = ?, nombre = ?, categoria = ?, stock = ?, precio_costo = ?, iva = ?, precio_venta = ? WHERE id = ?', [codigo, nombre, categoria, stock, costo, iva, venta, idOculto]);
        } else {
            await db.execute('INSERT INTO productos (codigo, nombre, categoria, stock, precio_costo, iva, precio_venta) VALUES (?, ?, ?, ?, ?, ?, ?)', [codigo, nombre, categoria, stock, costo, iva, venta]);
        }
        const modalEl = document.getElementById('modalProducto');
        (bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)).hide();
        window.cargarProductos();
    } catch (error) {
        alert("¡Cuidado! Código de barras duplicado.");
    }
};

window.cargarProductos = async function () {
    if (!db) return;
    try {
        todosLosProductos = await db.select('SELECT * FROM productos ORDER BY id DESC');
        window.dibujarTabla(todosLosProductos);
    } catch (error) { console.error(error); }
};

window.dibujarTabla = function (productos) {
    const tbody = document.getElementById('tabla-productos');
    tbody.innerHTML = '';
    productos.forEach(prod => {
        let colorStock = prod.stock === 'Bajo' ? 'bg-danger' : (prod.stock === 'Medio' ? 'bg-warning text-dark' : 'bg-success');
        
        // Construimos el desglose matemático para el Tooltip (Hover)
        const ivaPorcentaje = prod.iva !== undefined && prod.iva !== null ? prod.iva : 21;
        const costoBase = prod.precio_costo;
        const precioNeto = prod.precio_venta / (1 + (ivaPorcentaje / 100));
        const gananciaReales = Math.max(0, precioNeto - costoBase);
        const margenPct = costoBase > 0 ? Math.round((gananciaReales / costoBase) * 100) : 0;
        
        const desgloseTooltip = `Costo: $${costoBase.toFixed(2)} | Utilidad: ${margenPct}% (+$${gananciaReales.toFixed(2)}) | IVA: ${ivaPorcentaje}%`;

        tbody.innerHTML += `
            <tr>
                <td class="text-start ps-4"><span class="fw-bold">${prod.nombre}</span><br><small class="text-muted">Cod: ${prod.codigo}</small></td>
                <td><span class="badge bg-secondary">${prod.categoria}</span></td>
                <td style="display:none;"><span class="badge ${colorStock}">${prod.stock}</span></td>
                <td class="text-muted">$${prod.precio_costo.toFixed(2)}</td>
                <td class="fw-bold text-success fs-5" title="${desgloseTooltip}" style="cursor: help;">$${prod.precio_venta.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editarProducto(${prod.id})" title="Editar">✏️</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${prod.id})" title="Borrar">🗑️</button>
                </td>
            </tr>
        `;
    });
};

window.filtrarProductos = function () {
    const textoBuscado = document.getElementById('buscador-productos').value.toLowerCase();
    window.dibujarTabla(todosLosProductos.filter(prod => prod.nombre.toLowerCase().includes(textoBuscado) || prod.codigo.toLowerCase().includes(textoBuscado)));
};

window.eliminarProducto = async function (id) {
    if (!db) return;
    const { confirm } = await import('@tauri-apps/plugin-dialog');
    const seguro = await confirm("¿Seguro que querés mandar este producto al tacho?", { title: 'Eliminar Producto', kind: 'warning' });
    if (seguro) {
        await db.execute('DELETE FROM productos WHERE id = ?', [id]);
        window.cargarProductos();
    }
};