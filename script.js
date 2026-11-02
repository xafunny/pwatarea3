const btnCarrito = document.getElementById('btn-carrito');
const panel = document.getElementById('panel-carrito');
const lista = document.getElementById('lista-carrito');
const contador = document.getElementById('contador');
const totalEl = document.getElementById('total');
const aviso = document.getElementById('aviso');
const contenedor = document.getElementById('productos');
const modoEl = document.getElementById('modo');

let modo = 'php';      
let productos = [];

const CLAVE = 'carrito_tienda';

function leerLocal() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; }
}
function guardarLocal(mapa) {
    try { localStorage.setItem(CLAVE, JSON.stringify(mapa)); } catch (e) { /* ignorar */ }
}
function resumenLocal(mapa) {
    const items = [];
    let total = 0, cantidad = 0;
    productos.forEach(p => {
        const cant = mapa[p.id];
        if (cant > 0) {
            const subtotal = Math.round(cant * p.precio * 100) / 100;
            items.push({ id: p.id, nombre: p.nombre, cantidad: cant, subtotal });
            total += subtotal;
            cantidad += cant;
        }
    });
    return { items, cantidad, total: Math.round(total * 100) / 100 };
}

async function enviar(accion, id = 0) {
    if (modo === 'php') {
        const datos = new FormData();
        datos.append('accion', accion);
        datos.append('id', id);
        const r = await fetch('api.php', { method: 'POST', body: datos });
        return (await r.json()).carrito;
    }
    const mapa = leerLocal();
    id = Number(id);
    if (accion === 'agregar') {
        mapa[id] = (mapa[id] || 0) + 1;
    } else if (accion === 'quitar' && mapa[id]) {
        mapa[id]--;
        if (mapa[id] <= 0) delete mapa[id];
    } else if (accion === 'vaciar') {
        Object.keys(mapa).forEach(k => delete mapa[k]);
    }
    guardarLocal(mapa);
    return resumenLocal(mapa);
}

function crear(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

function mostrarProductos() {
    contenedor.innerHTML = '';
    productos.forEach(p => {
        const tarjeta = crear('article', 'tarjeta');

        const img = document.createElement('img');
        img.src = p.imagen;
        img.alt = p.nombre;

        const cuerpo = crear('div', 'tarjeta-cuerpo');
        const boton = crear('button', 'btn-agregar', 'Agregar al carrito');
        boton.addEventListener('click', async () => {
            mostrarCarrito(await enviar('agregar', p.id));
            mostrarAviso('Producto agregado al carrito ✔');
        });

        cuerpo.append(
            crear('h3', '', p.nombre),
            crear('p', 'descripcion', p.descripcion),
            crear('p', 'precio', '$' + Number(p.precio).toFixed(2)),
            boton
        );
        tarjeta.append(img, cuerpo);
        contenedor.appendChild(tarjeta);
    });
}

function mostrarCarrito(carrito) {
    contador.textContent = carrito.cantidad;
    totalEl.textContent = Number(carrito.total).toFixed(2);
    lista.innerHTML = '';

    if (carrito.items.length === 0) {
        lista.appendChild(crear('li', 'vacio', 'El carrito está vacío'));
        return;
    }

    carrito.items.forEach(item => {
        const li = document.createElement('li');
        const quitar = crear('button', 'btn-quitar', '−');
        quitar.title = 'Quitar uno';
        quitar.addEventListener('click', async () => {
            mostrarCarrito(await enviar('quitar', item.id));
        });
        li.append(
            crear('span', '', item.cantidad + ' × ' + item.nombre),
            crear('span', '', '$' + Number(item.subtotal).toFixed(2)),
            quitar
        );
        lista.appendChild(li);
    });
}

function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.classList.add('visible');
    setTimeout(() => aviso.classList.remove('visible'), 1500);
}

btnCarrito.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    btnCarrito.setAttribute('aria-expanded', String(!panel.hidden));
});

document.getElementById('btn-vaciar').addEventListener('click', async () => {
    mostrarCarrito(await enviar('vaciar'));
});

async function iniciar() {
    let carrito;
    try {
        const r = await fetch('api.php?accion=listar');
        const datos = await r.json();          
        productos = datos.productos;
        carrito = datos.carrito;
        modoEl.textContent = 'Modo: servidor PHP (productos y carrito desde PHP)';
    } catch (e) {
        modo = 'local';
        productos = PRODUCTOS_RESPALDO;
        carrito = resumenLocal(leerLocal());
        modoEl.textContent = 'Nomnbre: Jhoao Guala';
    }
    mostrarProductos();
    mostrarCarrito(carrito);
}

iniciar();
