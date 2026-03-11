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
            <div class="card-body p-0" style="max-height: 500px; overflow-y: auto;">
                <table class="table table-hover table-striped mb-0 text-center align-middle">
                    <thead class="table-dark" style="position: sticky; top: 0; z-index: 10;">
                        <tr><th class="text-start ps-4">Nombre / Código</th><th>Categoría</th><th>Stock</th><th>Precio Costo</th><th>Precio Venta</th><th>Acciones</th></tr>
                    </thead>
                    <tbody id="tabla-productos"></tbody>
                </table>
            </div>
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
                        <div class="col-md-6"><label class="form-label fw-bold">Código de Barras</label><input type="text" id="prod-codigo" class="form-control" required></div>
                        <div class="col-md-6"><label class="form-label fw-bold">Nombre</label><input type="text" id="prod-nombre" class="form-control" required></div>
                        <div class="col-md-6"><label class="form-label fw-bold">Categoría</label><select id="prod-categoria" class="form-select" required><option value="Almacén">Almacén</option><option value="Bebidas">Bebidas</option><option value="Lácteos">Lácteos</option><option value="Golosinas">Golosinas</option><option value="Limpieza">Limpieza</option><option value="Fiambrería">Fiambrería</option><option value="Galletitas">Galletitas</option><option value="Varios">Varios</option></select></div>
                        <div class="col-md-6"><label class="form-label fw-bold">Stock</label><select id="prod-stock" class="form-select" required><option value="Alto">Alto</option><option value="Medio">Medio</option><option value="Bajo">Bajo</option></select></div>
                        <div class="col-md-3 mt-4"><label class="form-label fw-bold">Costo ($)</label><input type="number" step="0.01" id="prod-costo" class="form-control border-primary" oninput="calcularVenta()" required></div>
                        <div class="col-md-3 mt-4"><label class="form-label fw-bold">IVA (%)</label><input type="number" step="0.1" id="prod-iva" class="form-control border-primary" value="21" oninput="calcularVenta()" required></div>
                        <div class="col-md-3 mt-4"><label class="form-label fw-bold">% Ganancia</label><input type="number" step="1" id="prod-margen" class="form-control border-primary" value="30" oninput="calcularVenta()" required></div>
                        <div class="col-md-3 mt-4"><label class="form-label fw-bold text-success">Venta ($)</label><input type="number" step="0.01" id="prod-venta" class="form-control border-success bg-light fw-bold" required></div>
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
    const ivaPorcentaje = parseFloat(document.getElementById('prod-iva').value) || 0;
    const margen = parseFloat(document.getElementById('prod-margen').value) || 0;
    const costoConIva = costo + (costo * (ivaPorcentaje / 100));
    document.getElementById('prod-venta').value = (costoConIva + (costoConIva * (margen / 100))).toFixed(2);
};

window.abrirModalNuevo = function () {
    document.getElementById('form-producto').reset();
    document.getElementById('prod-id').value = '';
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
    document.getElementById('prod-iva').value = prod.iva !== undefined && prod.iva !== null ? prod.iva : 21;
    document.getElementById('prod-venta').value = prod.precio_venta;
    const costoConIva = prod.precio_costo + (prod.precio_costo * (parseFloat(document.getElementById('prod-iva').value) / 100));
    document.getElementById('prod-margen').value = costoConIva > 0 ? Math.round(((prod.precio_venta - costoConIva) / costoConIva) * 100) : 0;
    document.getElementById('modal-titulo').innerText = '✏️ Editar: ' + prod.nombre;
    document.getElementById('btn-guardar').innerText = 'Actualizar';
    new bootstrap.Modal(document.getElementById('modalProducto')).show();
};

window.guardarProducto = async function (event) {
    event.preventDefault();
    if (!db) return;
    const idOculto = document.getElementById('prod-id').value;
    const codigo = document.getElementById('prod-codigo').value;
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
        tbody.innerHTML += `
            <tr>
                <td class="text-start ps-4"><span class="fw-bold">${prod.nombre}</span><br><small class="text-muted">Cod: ${prod.codigo}</small></td>
                <td><span class="badge bg-secondary">${prod.categoria}</span></td>
                <td><span class="badge ${colorStock}">${prod.stock}</span></td>
                <td class="text-muted">$${prod.precio_costo.toFixed(2)}</td>
                <td class="fw-bold text-success fs-5">$${prod.precio_venta.toFixed(2)}</td>
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
    if (confirm("¿Seguro que querés mandar este producto al tacho?")) {
        await db.execute('DELETE FROM productos WHERE id = ?', [id]);
        window.cargarProductos();
    }
};