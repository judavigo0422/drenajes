/* =========================================================
   INVENTARIO DE MATERIALES
   SCRIPT PRINCIPAL
   ========================================================= */

// ============================================================
// FUNCIONES GENERALES
// ============================================================
function obtenerCampo(objeto, ...campos) {
    if (!objeto) return "";
    for (const campo of campos) {
        if (objeto[campo] !== undefined && objeto[campo] !== null) {
            return objeto[campo];
        }
    }
    return "";
}

function numero(valor) {
    if (valor === null || valor === undefined || valor === "") return 0;
    if (typeof valor === "number") return isNaN(valor) ? 0 : valor;
    let texto = String(valor).trim().replace(/\s/g, "");
    if (texto.includes(",") && texto.includes(".")) {
        if (texto.lastIndexOf(",") > texto.lastIndexOf(".")) {
            texto = texto.replace(/\./g, "").replace(",", ".");
        } else {
            texto = texto.replace(/,/g, "");
        }
    } else if (texto.includes(",")) {
        texto = texto.replace(",", ".");
    }
    const resultado = parseFloat(texto);
    return isNaN(resultado) ? 0 : resultado;
}

function formatearNumero(valor) {
    return numero(valor).toLocaleString("es-CO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatearMoneda(valor) {
    return numero(valor).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    });
}

function escapeHTML(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function fechaActual() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    const horas = String(ahora.getHours()).padStart(2, "0");
    const minutos = String(ahora.getMinutes()).padStart(2, "0");
    const segundos = String(ahora.getSeconds()).padStart(2, "0");
    return `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}

function fechaVisible(fecha) {
    if (!fecha) return "";
    const texto = String(fecha);
    if (texto.includes(" ")) return texto;
    if (texto.includes("T")) return texto.replace("T", " ").substring(0, 19);
    return texto;
}

// ============================================================
// LOCAL STORAGE
// ============================================================
function guardarDatos(clave, datos) {
    try {
        localStorage.setItem(clave, JSON.stringify(datos));
    } catch (error) {
        console.error("Error guardando datos:", clave, error);
    }
}

function leerDatos(clave) {
    try {
        const datos = localStorage.getItem(clave);
        if (!datos) return [];
        const resultado = JSON.parse(datos);
        return Array.isArray(resultado) ? resultado : [];
    } catch (error) {
        console.error("Error leyendo datos:", clave, error);
        return [];
    }
}

// ============================================================
// CLAVES
// ============================================================
const CLAVES = {
    materiales: "inventario_materiales",
    haciendas: "inventario_haciendas",
    usuarios: "inventario_usuarios",
    entradas: "inventario_entradas",
    consumos: "inventario_consumos",
    ajustes: "inventario_ajustes",
    proyectos: "inventario_proyectos",
    proyectoMateriales: "inventario_proyecto_materiales",
    movimientosProyecto: "inventario_movimientos_proyecto"
};

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let materiales = [];
let haciendas = [];
let usuarios = [];
let entradas = [];
let consumos = [];
let ajustes = [];
let proyectos = [];
let proyectoMateriales = [];
let movimientosProyecto = [];

// ============================================================
// CARGAR DATOS
// ============================================================
function cargarDatosCompatibles() {
    materiales = leerDatos(CLAVES.materiales);
    haciendas = leerDatos(CLAVES.haciendas);
    usuarios = leerDatos(CLAVES.usuarios);
    entradas = leerDatos(CLAVES.entradas);
    consumos = leerDatos(CLAVES.consumos);
    ajustes = leerDatos(CLAVES.ajustes);
    proyectos = leerDatos(CLAVES.proyectos);
    proyectoMateriales = leerDatos(CLAVES.proyectoMateriales);
    movimientosProyecto = leerDatos(CLAVES.movimientosProyecto);
}

// ============================================================
// BUSCAR MATERIAL
// ============================================================
function buscarMaterial(codigo) {
    if (!codigo) return null;
    const codigoBuscado = String(codigo).trim();
    return materiales.find(material => {
        const codigoMaterial = obtenerCampo(material, "CODIGO", "codigo", "Codigo", "ID_MATERIAL", "id_material");
        return String(codigoMaterial).trim() === codigoBuscado;
    }) || null;
}

// ============================================================
// DESCRIPCIONES
// ============================================================
const DESCRIPCIONES_MATERIALES = {
    "1795213": "TUBERIA PEAD 4\"",
    "1795214": "TUBERIA PEAD 6\"",
    "1795215": "TUBERIA PEAD 8\"",
    "1795216": "TUBERIA PEAD 10\"",
    "1795217": "TUBERIA PEAD 12\""
};

function descripcionMaterial(material) {
    if (!material) return "";
    const descripcion = obtenerCampo(material, "DESCRIPCION_CORTA", "descripcion_corta", "DESCRIPCION", "descripcion", "DESCRIPCION_LARGA", "Descripcion", "NOMBRE", "nombre");
    if (descripcion) return descripcion;
    const codigo = obtenerCampo(material, "CODIGO", "codigo", "Codigo", "ID_MATERIAL", "id_material");
    return DESCRIPCIONES_MATERIALES[String(codigo).trim()] || "";
}

// ============================================================
// BUSCAR PROYECTO
// ============================================================
function buscarProyecto(idProyecto) {
    if (!idProyecto) return null;
    const idBuscado = String(idProyecto).trim();
    return proyectos.find(proyecto => {
        const campos = ["ID_PROYECTO", "ID", "id", "Id"];
        for (const campo of campos) {
            const valor = obtenerCampo(proyecto, campo);
            if (String(valor).trim() === idBuscado) return true;
        }
        return false;
    }) || null;
}

// ============================================================
// BUSCAR MATERIAL DE PROYECTO
// ============================================================
function buscarRegistroProyectoMaterial(idProyecto, codigoMaterial) {
    return proyectoMateriales.find(registro => {
        const proyecto = obtenerCampo(registro, "ID_PROYECTO", "id_proyecto");
        const codigo = obtenerCampo(registro, "CODIGO_MATERIAL", "codigo_material");
        return String(proyecto).trim() === String(idProyecto).trim() &&
            String(codigo).trim() === String(codigoMaterial).trim();
    }) || null;
}

// ============================================================
// OBTENER STOCK GENERAL
// ============================================================
function obtenerInventario() {
    return materiales.map(material => {
        const codigo = obtenerCampo(material, "CODIGO", "codigo", "Codigo", "ID_MATERIAL", "id_material");
        const descripcion = descripcionMaterial(material);
        const unidad = obtenerCampo(material, "UNIDAD", "unidad");
        const precio = numero(obtenerCampo(material, "PRECIO_UNITARIO", "precio_unitario", "PRECIO", "precio"));

        const entradasMaterial = entradas.filter(movimiento => {
            const codigoMovimiento = obtenerCampo(movimiento, "CODIGO_MATERIAL", "codigo_material", "CODIGO", "codigo");
            return String(codigoMovimiento).trim() === String(codigo).trim();
        }).reduce((total, movimiento) => total + numero(obtenerCampo(movimiento, "CANTIDAD", "cantidad")), 0);

        const consumosMaterial = consumos.filter(movimiento => {
            const codigoMovimiento = obtenerCampo(movimiento, "CODIGO_MATERIAL", "codigo_material", "CODIGO", "codigo");
            return String(codigoMovimiento).trim() === String(codigo).trim();
        }).reduce((total, movimiento) => total + numero(obtenerCampo(movimiento, "CANTIDAD", "cantidad")), 0);

        const ajustesMaterial = ajustes.filter(movimiento => {
            const codigoMovimiento = obtenerCampo(movimiento, "CODIGO_MATERIAL", "codigo_material", "CODIGO", "codigo");
            return String(codigoMovimiento).trim() === String(codigo).trim();
        }).reduce((total, movimiento) => {
            const tipo = String(obtenerCampo(movimiento, "TIPO", "tipo")).toUpperCase();
            const cantidad = numero(obtenerCampo(movimiento, "CANTIDAD", "cantidad"));
            if (tipo.includes("SALIDA") || tipo.includes("NEGATIVO") || tipo.includes("DISMINU")) {
                return total - cantidad;
            }
            return total + cantidad;
        }, 0);

        const stock = entradasMaterial - consumosMaterial + ajustesMaterial;
        const estado = stock > 0 ? "DISPONIBLE" : "AGOTADO";
        const valorStock = stock * precio;

        return {
            codigo,
            descripcion,
            unidad,
            entradas: entradasMaterial,
            consumos: consumosMaterial,
            ajustes: ajustesMaterial,
            stock,
            estado,
            precio,
            valorStock
        };
    });
}
// ============================================================
// MOSTRAR INVENTARIO
// ============================================================
function mostrarInventario() {
    const tabla = document.getElementById("tbody-inventario");
    if (!tabla) {
        console.error("ERROR: No se encontró tbody-inventario en el HTML");
        return;
    }

    const inventario = obtenerInventario();
    const buscador = document.getElementById("buscar-inventario");
    const textoBusqueda = (buscador ? buscador.value : "").toLowerCase().trim();

    const filtrados = inventario.filter(item => {
        if (!textoBusqueda) return true;
        return String(item.codigo).toLowerCase().includes(textoBusqueda) ||
               String(item.descripcion).toLowerCase().includes(textoBusqueda) ||
               String(item.unidad).toLowerCase().includes(textoBusqueda);
    });

    if (filtrados.length === 0) {
        tabla.innerHTML = '<tr><td colspan="9" class="sin-datos">No hay materiales para mostrar.</td></tr>';
        return;
    }

    let html = "";
    for (let i = 0; i < filtrados.length; i++) {
        const item = filtrados[i];
        const claseEstado = item.estado === "DISPONIBLE" ? "estado-disponible" : "estado-agotado";
        html += `<tr>
            <td>${escapeHTML(item.codigo)}</td>
            <td>${escapeHTML(item.descripcion)}</td>
            <td>${escapeHTML(item.unidad)}</td>
            <td>${formatearNumero(item.entradas)}</td>
            <td>${formatearNumero(item.consumos)}</td>
            <td>${formatearNumero(item.ajustes)}</td>
            <td><strong>${formatearNumero(item.stock)}</strong></td>
            <td><span class="${claseEstado}">${escapeHTML(item.estado)}</span></td>
            <td>${formatearMoneda(item.valorStock)}</td>
        </tr>`;
    }
    tabla.innerHTML = html;
}

// ============================================================
// OBTENER CONSUMIDO EN PROYECTO
// ============================================================
function obtenerConsumidoProyecto(idProyecto, codigoMaterial) {
    return proyectoMateriales.filter(registro => {
        const proyecto = obtenerCampo(registro, "ID_PROYECTO", "id_proyecto");
        const codigo = obtenerCampo(registro, "CODIGO_MATERIAL", "codigo_material");
        return String(proyecto).trim() === String(idProyecto).trim() &&
            String(codigo).trim() === String(codigoMaterial).trim();
    }).reduce((total, registro) => total + numero(obtenerCampo(registro, "CANTIDAD_CONSUMIDA", "cantidad_consumida")), 0);
}

// ============================================================
// OBTENER DISPONIBLE EN PROYECTO
// ============================================================
function obtenerDisponibleProyecto(idProyecto, codigoMaterial) {
    const registro = buscarRegistroProyectoMaterial(idProyecto, codigoMaterial);
    const asignada = registro ? numero(obtenerCampo(registro, "CANTIDAD_ASIGNADA", "cantidad_asignada")) : 0;
    const consumida = obtenerConsumidoProyecto(idProyecto, codigoMaterial);
    return asignada - consumida;
}

// ============================================================
// MOSTRAR MATERIALES DEL PROYECTO
// ============================================================
function mostrarMaterialesProyecto(idProyecto) {
    const tabla = document.getElementById("tbody-proyecto-materiales");
    if (!tabla) return;
    const registros = proyectoMateriales.filter(registro => {
        const proyecto = obtenerCampo(registro, "ID_PROYECTO", "id_proyecto");
        return String(proyecto).trim() === String(idProyecto).trim();
    });
    if (registros.length === 0) {
        tabla.innerHTML = `<tr><td colspan="8" class="sin-datos">No hay materiales asociados a este proyecto.</td></tr>`;
        return;
    }
    tabla.innerHTML = registros.map(registro => {
        const codigo = obtenerCampo(registro, "CODIGO_MATERIAL", "codigo_material");
        const material = buscarMaterial(codigo);
        const descripcion = material ? descripcionMaterial(material) : (obtenerCampo(registro, "DESCRIPCION", "descripcion", "DESCRIPCION_MATERIAL", "descripcion_material") || "");
        const unidad = material ? obtenerCampo(material, "UNIDAD", "unidad") : (obtenerCampo(registro, "UNIDAD", "unidad") || "");
        const solicitada = numero(obtenerCampo(registro, "CANTIDAD_SOLICITADA", "cantidad_solicitada"));
        const asignada = numero(obtenerCampo(registro, "CANTIDAD_ASIGNADA", "cantidad_asignada"));
        const consumida = obtenerConsumidoProyecto(idProyecto, codigo);
        const disponible = obtenerDisponibleProyecto(idProyecto, codigo);
        const idProyectoEscapado = String(idProyecto).replace(/'/g, "\\'");
        const codigoEscapado = String(codigo).replace(/'/g, "\\'");
        return `<tr>
            <td>${escapeHTML(codigo)}</td>
            <td>${escapeHTML(descripcion)}</td>
            <td>${escapeHTML(unidad)}</td>
            <td>${formatearNumero(solicitada)}</td>
            <td>${formatearNumero(asignada)}</td>
            <td>${formatearNumero(consumida)}</td>
            <td><strong>${formatearNumero(disponible)}</strong></td>
            <td>
                <button type="button" class="btn-danger" onclick="eliminarMaterialProyecto('${idProyectoEscapado}', '${codigoEscapado}')" style="background:#ef4444;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;margin-right:4px;">🗑️</button>
                <button type="button" class="btn-primary" onclick="editarCantidadMaterialProyecto('${idProyectoEscapado}', '${codigoEscapado}')" style="background:#0f766e;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;">✏️</button>
            </td>
        </tr>`;
    }).join("");
    guardarDatos(CLAVES.proyectoMateriales, proyectoMateriales);
}

// ============================================================
// MOSTRAR DOCUMENTOS DEL PROYECTO
// ============================================================
function mostrarDocumentosProyecto(idProyecto) {
    const contenedor = document.getElementById("documentos-proyecto");
    if (!contenedor) return;
    const proyecto = buscarProyecto(idProyecto);
    if (!proyecto) {
        contenedor.innerHTML = `<p style="color:#999;">No se encontró el proyecto.</p>`;
        return;
    }
    const archivos = proyecto.ARCHIVOS || [];
    if (archivos.length === 0) {
        contenedor.innerHTML = `<p style="color:#999;text-align:center;">No hay documentos adjuntos.</p>`;
        return;
    }
    contenedor.innerHTML = archivos.map(archivo => {
        let icono = "📄";
        if (archivo.tipo?.includes("image")) icono = "🖼️";
        else if (archivo.tipo?.includes("pdf")) icono = "📕";
        else if (archivo.tipo?.includes("excel") || archivo.tipo?.includes("sheet")) icono = "📊";
        else if (archivo.tipo?.includes("word") || archivo.tipo?.includes("document")) icono = "📝";
        const tamañoKB = Math.round(archivo.tamaño / 1024);
        const tamañoStr = tamañoKB > 1024 ? (tamañoKB / 1024).toFixed(1) + " MB" : tamañoKB + " KB";
        const idEscapado = String(idProyecto).replace(/'/g, "\\'");
        const docIdEscapado = String(archivo.id).replace(/'/g, "\\'");
        return `
            <div class="documento-item" style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:15px;display:flex;align-items:center;gap:15px;box-shadow:0 1px 3px rgba(0,0,0,0.05);margin-bottom:10px;">
                <span style="font-size:32px;">${icono}</span>
                <div style="flex:1;min-width:0;">
                    <strong style="display:block;font-size:14px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(archivo.nombre)}</strong>
                    <small style="display:block;font-size:11px;color:#6b7280;">${tamañoStr} • ${fechaVisible(archivo.fecha)}</small>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn-primary" onclick="descargarArchivoProyecto('${idEscapado}', '${docIdEscapado}')" style="padding:6px 12px;font-size:12px;background:#0f766e;color:white;border:none;border-radius:6px;cursor:pointer;">📥</button>
                    <button class="btn-danger" onclick="eliminarDocumentoProyecto('${idEscapado}', '${docIdEscapado}')" style="padding:6px 12px;font-size:12px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;">🗑️</button>
                </div>
            </div>
        `;
    }).join("");
}

// ============================================================
// CERRAR DETALLE PROYECTO
// ============================================================
function cerrarDetalleProyecto() {
    const detalle = document.getElementById("detalle-proyecto");
    if (detalle) {
        detalle.style.display = "none";
        detalle.classList.remove("activa");
    }
    mostrarSeccion("proyectos");
}

// ============================================================
// CERRAR FORMULARIO PROYECTO
// ============================================================
function cerrarFormularioProyecto() {
    const contenedor = document.getElementById("contenedor-formulario-proyecto");
    if (contenedor) contenedor.style.display = "none";
    const formulario = document.getElementById("form-proyecto");
    if (formulario) formulario.reset();
}

// ============================================================
// CARGAR HACIENDAS
// ============================================================
function cargarHaciendasSelect() {
    const selects = document.querySelectorAll("#consumo-hacienda");
    selects.forEach(select => {
        const valorActual = select.value;
        select.innerHTML = `<option value="">Seleccione hacienda</option>`;
        haciendas.forEach(hacienda => {
            const codigo = obtenerCampo(hacienda, "CODIGO_HACIENDA", "codigo_hacienda", "CODIGO", "codigo", "ID_HACIENDA", "id_hacienda");
            const nombre = obtenerCampo(hacienda, "NOMBRE_HACIENDA", "nombre_hacienda", "NOMBRE", "nombre");
            if (!codigo) return;
            const option = document.createElement("option");
            option.value = codigo;
            option.textContent = `${codigo} - ${nombre}`;
            select.appendChild(option);
        });
        if (valorActual) select.value = valorActual;
    });
}

// ============================================================
// CARGAR MATERIALES PARA PROYECTO
// ============================================================
function cargarMaterialesProyectoSelect() {
    const select = document.getElementById("proyecto-material");
    if (!select) return;
    const valorActual = select.value;
    select.innerHTML = `<option value="">Seleccione un material</option>`;
    materiales.forEach(material => {
        const codigo = obtenerCampo(material, "CODIGO", "codigo", "Codigo", "ID_MATERIAL", "id_material");
        const descripcion = descripcionMaterial(material);
        if (!codigo) return;
        const option = document.createElement("option");
        option.value = codigo;
        option.textContent = `${codigo} - ${descripcion}`;
        select.appendChild(option);
    });
    if (valorActual) select.value = valorActual;
}

// ============================================================
// CARGAR HACIENDAS PARA PROYECTO
// ============================================================
function cargarHaciendasProyectoSelect() {
    const select = document.getElementById("proyecto-hacienda");
    const datalist = document.getElementById("haciendas-list");
    if (!select) return;
    const valorActual = select.value;
    select.innerHTML = `<option value="">Seleccione una hacienda</option>`;
    if (datalist) datalist.innerHTML = "";
    haciendas.forEach(hacienda => {
        const codigo = obtenerCampo(hacienda, "CODIGO_HACIENDA", "codigo_hacienda", "CODIGO", "codigo", "ID_HACIENDA", "id_hacienda");
        const nombre = obtenerCampo(hacienda, "NOMBRE_HACIENDA", "nombre_hacienda", "NOMBRE", "nombre");
        if (!codigo) return;
        const option = document.createElement("option");
        option.value = codigo;
        option.textContent = `${codigo} - ${nombre}`;
        select.appendChild(option);
        if (datalist) {
            const optionDatalist = document.createElement("option");
            optionDatalist.value = `${codigo} - ${nombre}`;
            datalist.appendChild(optionDatalist);
        }
    });
    if (valorActual) select.value = valorActual;
}

// ============================================================
// OCULTAR FORMULARIO PROYECTO
// ============================================================
function ocultarFormularioProyecto() {
    const contenedor = document.getElementById("contenedor-formulario-proyecto");
    if (contenedor) contenedor.style.display = "none";
    const formulario = document.getElementById("form-proyecto");
    if (formulario) formulario.reset();
}

// ============================================================
// MOSTRAR FORMULARIO PROYECTO
// ============================================================
function mostrarFormularioProyecto() {
    const contenedor = document.getElementById("contenedor-formulario-proyecto");
    if (!contenedor) return;
    cargarHaciendasProyectoSelect();
    contenedor.style.display = "block";
    const formulario = document.getElementById("form-proyecto");
    if (formulario) formulario.reset();
}

// ============================================================
// GENERAR ID PROYECTO
// ============================================================
function generarIdProyecto() {
    return "PROY-" + Date.now();
}

// ============================================================
// MOSTRAR PROYECTOS
// ============================================================
function mostrarProyectos() {
    const tabla = document.getElementById("tbody-proyectos");
    if (!tabla) return;
    const buscador = document.getElementById("buscar-proyectos");
    const textoBusqueda = (buscador ? buscador.value : "").toLowerCase().trim();
    const proyectosFiltrados = proyectos.filter(proyecto => {
        if (!textoBusqueda) return true;
        const titulo = (obtenerCampo(proyecto, "TITULO", "titulo") || "").toLowerCase();
        const solped = (obtenerCampo(proyecto, "SOLPED", "solped") || "").toLowerCase();
        const hacienda = (obtenerCampo(proyecto, "HACIENDA", "hacienda") || "").toLowerCase();
        const suerte = (obtenerCampo(proyecto, "SUERTE", "suerte") || "").toLowerCase();
        const id = (obtenerCampo(proyecto, "ID_PROYECTO", "ID", "id") || "").toLowerCase();
        return titulo.includes(textoBusqueda) || solped.includes(textoBusqueda) ||
               hacienda.includes(textoBusqueda) || suerte.includes(textoBusqueda) ||
               id.includes(textoBusqueda);
    });
    if (proyectosFiltrados.length === 0) {
        tabla.innerHTML = `<tr><td colspan="7" class="sin-datos">No hay proyectos que coincidan con la búsqueda.</td></tr>`;
        return;
    }
    tabla.innerHTML = proyectosFiltrados.map(proyecto => {
        const idProyecto = obtenerCampo(proyecto, "ID_PROYECTO", "ID", "id");
        const titulo = obtenerCampo(proyecto, "TITULO", "titulo");
        const solped = obtenerCampo(proyecto, "SOLPED", "solped");
        const hacienda = obtenerCampo(proyecto, "HACIENDA", "hacienda");
        const suerte = obtenerCampo(proyecto, "SUERTE", "suerte");
        const estado = obtenerCampo(proyecto, "ESTADO", "estado") || "ACTIVO";
        return `<tr>
            <td>${escapeHTML(idProyecto)}</td>
            <td>${escapeHTML(titulo)}</td>
            <td>${escapeHTML(solped)}</td>
            <td>${escapeHTML(hacienda)}</td>
            <td>${escapeHTML(suerte)}</td>
            <td><span class="${estado === "ACTIVO" ? "estado-disponible" : "estado-agotado"}">${escapeHTML(estado)}</span></td>
            <td>
                <button type="button" class="btn-primary" onclick="mostrarDetalleProyecto('${idProyecto}')" style="background:#0f766e;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;margin-right:4px;">📋 Ver</button>
                <button type="button" class="btn-danger" onclick="eliminarProyecto('${idProyecto}')" style="background:#ef4444;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;">🗑️ Eliminar</button>
            </td>
        </tr>`;
    }).join("");
}

// ============================================================
// ELIMINAR PROYECTO
// ============================================================
function eliminarProyecto(idProyecto) {
    const proyecto = buscarProyecto(idProyecto);
    if (!proyecto) {
        alert("No se encontró el proyecto.");
        return;
    }
    const titulo = obtenerCampo(proyecto, "TITULO", "titulo");
    if (!confirm(`¿Eliminar el proyecto?\n\n${titulo}\nID: ${idProyecto}`)) return;
    proyectoMateriales = proyectoMateriales.filter(r => {
        const pid = obtenerCampo(r, "ID_PROYECTO", "id_proyecto");
        return String(pid).trim() !== String(idProyecto).trim();
    });
    guardarDatos(CLAVES.proyectoMateriales, proyectoMateriales);
    const idx = proyectos.findIndex(p => {
        const id = obtenerCampo(p, "ID_PROYECTO", "ID", "id");
        return String(id).trim() === String(idProyecto).trim();
    });
    if (idx !== -1) {
        proyectos.splice(idx, 1);
        guardarDatos(CLAVES.proyectos, proyectos);
    }
    const detalle = document.getElementById("detalle-proyecto");
    if (detalle && detalle.dataset.proyectoId === String(idProyecto)) {
        cerrarDetalleProyecto();
    }
    mostrarProyectos();
    actualizarDashboard();
    alert("Proyecto eliminado correctamente.");
}

// ============================================================
// MOSTRAR DETALLE PROYECTO
// ============================================================
function mostrarDetalleProyecto(idProyecto) {
    document.querySelectorAll(".seccion").forEach(sec => sec.style.display = "none");
    const proyecto = buscarProyecto(idProyecto);
    if (!proyecto) {
        alert("No se encontró el proyecto.");
        return;
    }
    const detalle = document.getElementById("detalle-proyecto");
    if (!detalle) return;
    detalle.style.display = "block";
    detalle.classList.add("activa");
    detalle.dataset.proyectoId = idProyecto;
    const titulo = document.getElementById("detalle-proyecto-titulo");
    const subtitulo = document.getElementById("detalle-proyecto-subtitulo");
    if (titulo) titulo.textContent = obtenerCampo(proyecto, "TITULO", "titulo");
    if (subtitulo) subtitulo.textContent = "SOLPED " + obtenerCampo(proyecto, "SOLPED", "solped");
    const btnEstado = document.getElementById("btn-cambiar-estado");
    if (btnEstado) {
        const estado = obtenerCampo(proyecto, "ESTADO", "estado") || "ACTIVO";
        btnEstado.textContent = "📌 Estado: " + estado;
        btnEstado.style.background = estado === "ACTIVO" ? "#0f766e" : "#6b7280";
    }
    const informacion = document.getElementById("detalle-proyecto-informacion");
    if (informacion) {
        informacion.innerHTML = `
            <div class="dashboard-card">
                <span class="card-icon">🏷️</span>
                <div><span class="card-label">SOLPED</span><strong>${escapeHTML(obtenerCampo(proyecto, "SOLPED", "solped"))}</strong></div>
            </div>
            <div class="dashboard-card">
                <span class="card-icon">🌱</span>
                <div><span class="card-label">Hacienda</span><strong>${escapeHTML(obtenerCampo(proyecto, "HACIENDA", "hacienda"))}</strong></div>
            </div>
            <div class="dashboard-card">
                <span class="card-icon">📍</span>
                <div><span class="card-label">Suerte</span><strong>${escapeHTML(obtenerCampo(proyecto, "SUERTE", "suerte"))}</strong></div>
            </div>
            <div class="dashboard-card">
                <span class="card-icon">🚰</span>
                <div><span class="card-label">Drenes</span><strong>${formatearNumero(obtenerCampo(proyecto, "CANTIDAD_DRENES", "cantidad_drenes"))}</strong></div>
            </div>
            <div class="dashboard-card">
                <span class="card-icon">📝</span>
                <div><span class="card-label">Observación</span><strong>${escapeHTML(obtenerCampo(proyecto, "OBSERVACION", "observacion"))}</strong></div>
            </div>
        `;
    }
    cargarMaterialesProyectoSelect();
    mostrarMaterialesProyecto(idProyecto);
    mostrarDocumentosProyecto(idProyecto);
    actualizarResumenProyecto(idProyecto);
}

// ============================================================
// REGISTRAR PROYECTO
// ============================================================
function registrarProyecto(evento) {
    evento.preventDefault();
    const titulo = document.getElementById("proyecto-titulo")?.value.trim() || "";
    const hacienda = document.getElementById("proyecto-hacienda")?.value || "";
    const suerte = document.getElementById("proyecto-suerte")?.value.trim() || "";
    const drenes = numero(document.getElementById("proyecto-drenes")?.value);
    const solped = document.getElementById("proyecto-solped")?.value.trim() || "";
    const observacion = document.getElementById("proyecto-observacion")?.value.trim() || "";
    const imagenInput = document.getElementById("proyecto-imagen-diseno");
    const excelInput = document.getElementById("proyecto-excel-diseno");
    if (!titulo || !hacienda || !suerte || !solped) {
        alert("Complete todos los campos obligatorios.");
        return;
    }
    const idProyecto = generarIdProyecto();
    const proyecto = {
        ID_PROYECTO: idProyecto,
        TITULO: titulo,
        HACIENDA: hacienda,
        SUERTE: suerte,
        CANTIDAD_DRENES: drenes,
        SOLPED: solped,
        ESTADO: "ACTIVO",
        OBSERVACION: observacion,
        FECHA: fechaActual(),
        USUARIO: obtenerUsuarioActual(),
        ARCHIVOS: []
    };
    proyectos.push(proyecto);
    guardarDatos(CLAVES.proyectos, proyectos);
    if (imagenInput && imagenInput.files && imagenInput.files[0]) {
        const archivo = imagenInput.files[0];
        if (archivo.type && archivo.type.startsWith("image/")) {
            const lector = new FileReader();
            lector.onload = function(e) {
                const proyectoActual = buscarProyecto(idProyecto);
                if (proyectoActual) {
                    if (!proyectoActual.ARCHIVOS) proyectoActual.ARCHIVOS = [];
                    proyectoActual.ARCHIVOS.push({
                        id: Date.now() + "-" + Math.random().toString(36).substr(2, 9),
                        nombre: archivo.name,
                        tipo: archivo.type,
                        tamaño: archivo.size,
                        fecha: fechaActual(),
                        contenido: e.target.result
                    });
                    guardarDatos(CLAVES.proyectos, proyectos);
                }
            };
            lector.readAsDataURL(archivo);
        }
    }
    if (excelInput && excelInput.files && excelInput.files[0]) {
        const archivo = excelInput.files[0];
        const lector = new FileReader();
        lector.onload = function(e) {
            const proyectoActual = buscarProyecto(idProyecto);
            if (proyectoActual) {
                if (!proyectoActual.ARCHIVOS) proyectoActual.ARCHIVOS = [];
                proyectoActual.ARCHIVOS.push({
                    id: Date.now() + "-" + Math.random().toString(36).substr(2, 9),
                    nombre: archivo.name,
                    tipo: archivo.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    tamaño: archivo.size,
                    fecha: fechaActual(),
                    contenido: e.target.result
                });
                guardarDatos(CLAVES.proyectos, proyectos);
                mostrarDocumentosProyecto(idProyecto);
            }
        };
        lector.readAsDataURL(archivo);
    }
    alert(`✅ Proyecto creado correctamente.\n\nProyecto: ${titulo}\nSOLPED: ${solped}`);
    ocultarFormularioProyecto();
    mostrarProyectos();
    actualizarDashboard();
}

// ============================================================
// OBTENER USUARIO ACTUAL
// ============================================================
function obtenerUsuarioActual() {
    const usuario = localStorage.getItem("usuario_actual");
    return usuario || "Usuario";
}

// ============================================================
// MOSTRAR FORMULARIO MATERIAL PROYECTO
// ============================================================
function mostrarFormularioMaterialProyecto() {
    const formulario = document.getElementById("form-material-proyecto");
    if (!formulario) {
        alert("No se encontró el formulario para agregar materiales al proyecto.");
        return;
    }
    formulario.style.display = "block";
    cargarMaterialesProyectoSelect();
    const select = document.getElementById("proyecto-material");
    const cantidadInput = document.getElementById("proyecto-material-cantidad");
    select.onchange = function() {
        const codigo = this.value;
        if (codigo) {
            const stock = obtenerStockMaterial(codigo);
            const material = buscarMaterial(codigo);
            const descripcion = material ? descripcionMaterial(material) : "";
            cantidadInput.placeholder = "Stock disponible: " + formatearNumero(stock);
            cantidadInput.title = "Stock disponible: " + formatearNumero(stock) + " unidades de " + descripcion;
        } else {
            cantidadInput.placeholder = "Cantidad";
            cantidadInput.title = "";
        }
    };
}

// ============================================================
// OCULTAR FORMULARIO MATERIAL PROYECTO
// ============================================================
function ocultarFormularioMaterialProyecto() {
    const formulario = document.getElementById("form-material-proyecto");
    if (formulario) {
        formulario.style.display = "none";
        formulario.reset();
    }
}

// ============================================================
// AGREGAR MATERIAL AL PROYECTO
// ============================================================
function agregarMaterialProyecto(evento) {
    if (evento) evento.preventDefault();
    const detalle = document.getElementById("detalle-proyecto");
    const idProyecto = detalle ? detalle.dataset.proyectoId : "";
    if (!idProyecto) {
        alert("No hay un proyecto seleccionado.");
        return;
    }
    const selectMaterial = document.getElementById("proyecto-material");
    const inputCantidad = document.getElementById("proyecto-material-cantidad");
    const codigo = selectMaterial ? selectMaterial.value : "";
    const cantidad = numero(inputCantidad ? inputCantidad.value : 0);
    if (!codigo) {
        alert("Seleccione un material.");
        return;
    }
    if (cantidad <= 0) {
        alert("Ingrese una cantidad válida.");
        return;
    }
    const material = buscarMaterial(codigo);
    if (!material) {
        alert("No se encontró el material seleccionado.");
        return;
    }
    const stockActual = obtenerStockMaterial(codigo);
    if (cantidad > stockActual) {
        alert("⚠️ No hay suficiente stock disponible.\n\nDisponible: " + formatearNumero(stockActual) + "\nSolicitado: " + formatearNumero(cantidad));
        return;
    }
    const consumo = {
        ID: "CON-" + Date.now(),
        FECHA: fechaActual(),
        CODIGO_MATERIAL: codigo,
        DESCRIPCION: descripcionMaterial(material),
        CANTIDAD: cantidad,
        ID_PROYECTO: idProyecto,
        TIPO: "ASIGNACION_PROYECTO",
        OBSERVACION: "Asignación al proyecto " + idProyecto,
        USUARIO: obtenerUsuarioActual()
    };
    consumos.push(consumo);
    guardarDatos(CLAVES.consumos, consumos);
    const existente = buscarRegistroProyectoMaterial(idProyecto, codigo);
    if (existente) {
        const solicitadaActual = numero(obtenerCampo(existente, "CANTIDAD_SOLICITADA", "cantidad_solicitada"));
        const asignadaActual = numero(obtenerCampo(existente, "CANTIDAD_ASIGNADA", "cantidad_asignada"));
        existente.CANTIDAD_SOLICITADA = solicitadaActual + cantidad;
        existente.CANTIDAD_ASIGNADA = asignadaActual + cantidad;
    } else {
        proyectoMateriales.push({
            ID: "PM-" + Date.now(),
            ID_PROYECTO: idProyecto,
            CODIGO_MATERIAL: codigo,
            DESCRIPCION: descripcionMaterial(material),
            UNIDAD: obtenerCampo(material, "UNIDAD", "unidad"),
            CANTIDAD_SOLICITADA: cantidad,
            CANTIDAD_ASIGNADA: cantidad,
            CANTIDAD_CONSUMIDA: 0,
            FECHA: fechaActual(),
            USUARIO: obtenerUsuarioActual()
        });
    }
    guardarDatos(CLAVES.proyectoMateriales, proyectoMateriales);
    mostrarMaterialesProyecto(idProyecto);
    ocultarFormularioMaterialProyecto();
    mostrarInventario();
    actualizarDashboard();
    alert("✅ Material asignado al proyecto.\n\nMaterial: " + descripcionMaterial(material) + "\nCódigo: " + codigo + "\nCantidad: " + formatearNumero(cantidad) + "\n\n📦 Stock restante: " + formatearNumero(stockActual - cantidad));
}

// ============================================================
// ELIMINAR MATERIAL DEL PROYECTO
// ============================================================
function eliminarMaterialProyecto(idProyecto, codigoMaterial) {
    const indice = proyectoMateriales.findIndex(registro => {
        const proyecto = obtenerCampo(registro, "ID_PROYECTO", "id_proyecto");
        const codigo = obtenerCampo(registro, "CODIGO_MATERIAL", "codigo_material");
        return String(proyecto).trim() === String(idProyecto).trim() &&
            String(codigo).trim() === String(codigoMaterial).trim();
    });
    if (indice === -1) {
        alert("No se encontró el material.");
        return;
    }
    const registro = proyectoMateriales[indice];
    const cantidad = numero(obtenerCampo(registro, "CANTIDAD_ASIGNADA", "cantidad_asignada"));
    const material = buscarMaterial(codigoMaterial);
    const descripcion = material ? descripcionMaterial(material) : codigoMaterial;
    if (!confirm(`¿Eliminar del proyecto y devolver al inventario?\n\n${descripcion}\nCódigo: ${codigoMaterial}\nCantidad: ${formatearNumero(cantidad)}`)) return;
    const entrada = {
        ID: `ENT-${Date.now()}`,
        FECHA: fechaActual(),
        CODIGO_MATERIAL: codigoMaterial,
        DESCRIPCION: descripcion,
        CANTIDAD: cantidad,
        PROVEEDOR: "DEVOLUCION_PROYECTO",
        OBSERVACION: `Devolución del proyecto ${idProyecto}`,
        USUARIO: obtenerUsuarioActual()
    };
    entradas.push(entrada);
    guardarDatos(CLAVES.entradas, entradas);
    proyectoMateriales.splice(indice, 1);
    guardarDatos(CLAVES.proyectoMateriales, proyectoMateriales);
    mostrarMaterialesProyecto(idProyecto);
    mostrarInventario();
    actualizarDashboard();
    alert(`✅ Material devuelto al inventario.`);
}

// ============================================================
// EDITAR CANTIDAD MATERIAL PROYECTO
// ============================================================
function editarCantidadMaterialProyecto(idProyecto, codigoMaterial) {
    const registro = buscarRegistroProyectoMaterial(idProyecto, codigoMaterial);
    if (!registro) {
        alert("No se encontró el material.");
        return;
    }
    const actual = numero(obtenerCampo(registro, "CANTIDAD_ASIGNADA", "cantidad_asignada"));
    const nuevaCantidad = prompt("Ingrese la nueva cantidad:", actual);
    if (nuevaCantidad === null) return;
    const cantidad = numero(nuevaCantidad);
    if (cantidad <= 0) {
        alert("La cantidad debe ser mayor que cero.");
        return;
    }
    const consumida = numero(obtenerCampo(registro, "CANTIDAD_CONSUMIDA", "cantidad_consumida"));
    if (cantidad < consumida) {
        alert(`No puede asignar ${cantidad} porque ya se han consumido ${consumida}.`);
        return;
    }
    registro.CANTIDAD_ASIGNADA = cantidad;
    registro.CANTIDAD_SOLICITADA = cantidad;
    guardarDatos(CLAVES.proyectoMateriales, proyectoMateriales);
    mostrarMaterialesProyecto(idProyecto);
}

// ============================================================
// REGISTRAR ENTRADA
// ============================================================
function registrarEntrada(evento) {
    evento.preventDefault();
    const codigo = document.getElementById("entrada-material")?.value || "";
    const cantidad = numero(document.getElementById("entrada-cantidad")?.value);
    const material = buscarMaterial(codigo);
    const solped = document.getElementById("entrada-solped")?.value.trim() || "";
    const proveedor = document.getElementById("entrada-proveedor")?.value.trim() || "";
    const observacion = document.getElementById("entrada-observacion")?.value.trim() || "";
    const idProyecto = document.getElementById("entrada-proyecto")?.value || "";
    if (!codigo) {
        alert("Seleccione un material.");
        return;
    }
    if (cantidad <= 0) {
        alert("La cantidad debe ser mayor que cero.");
        return;
    }
    if (!material) {
        alert("El material seleccionado no existe en el catálogo.");
        return;
    }
    const precioIngresado = numero(document.getElementById("entrada-precio")?.value);
    const precioCatalogo = numero(obtenerCampo(material, "PRECIO_UNITARIO", "precio_unitario", "PRECIO", "precio"));
    const precio = precioIngresado > 0 ? precioIngresado : precioCatalogo;
    const registro = {
        ID: `ENT-${Date.now()}`,
        FECHA: fechaActual(),
        CODIGO_MATERIAL: codigo,
        DESCRIPCION: descripcionMaterial(material),
        CANTIDAD: cantidad,
        PRECIO_UNITARIO: precio,
        PROVEEDOR: proveedor,
        SOLPED: solped,
        OBSERVACION: observacion,
        USUARIO: obtenerUsuarioActual()
    };
    if (idProyecto) {
        registro.ID_PROYECTO = idProyecto;
    }
    entradas.push(registro);
    guardarDatos(CLAVES.entradas, entradas);
    if (idProyecto) {
        const existente = buscarRegistroProyectoMaterial(idProyecto, codigo);
        if (existente) {
            const asignadaActual = numero(obtenerCampo(existente, "CANTIDAD_ASIGNADA", "cantidad_asignada"));
            const solicitadaActual = numero(obtenerCampo(existente, "CANTIDAD_SOLICITADA", "cantidad_solicitada"));
            existente.CANTIDAD_ASIGNADA = asignadaActual + cantidad;
            existente.CANTIDAD_SOLICITADA = solicitadaActual + cantidad;
        } else {
            proyectoMateriales.push({
                ID: `PM-${Date.now()}`,
                ID_PROYECTO: idProyecto,
                CODIGO_MATERIAL: codigo,
                DESCRIPCION: descripcionMaterial(material),
                UNIDAD: obtenerCampo(material, "UNIDAD", "unidad"),
                CANTIDAD_SOLICITADA: cantidad,
                CANTIDAD_ASIGNADA: cantidad,
                CANTIDAD_CONSUMIDA: 0,
                FECHA: fechaActual(),
                USUARIO: obtenerUsuarioActual()
            });
        }
        guardarDatos(CLAVES.proyectoMateriales, proyectoMateriales);
        mostrarMaterialesProyecto(idProyecto);
    }
    evento.target.reset();
    mostrarInventario();
    mostrarMovimientos();
    actualizarDashboard();
    cargarProyectosEnEntrada();
    const mensaje = idProyecto ?
        `✅ Entrada registrada y asignada al proyecto automáticamente.` :
        `✅ Entrada registrada correctamente.`;
    alert(mensaje);
}

// ============================================================
// REGISTRAR CONSUMO
// ============================================================
function registrarConsumo(evento) {
    evento.preventDefault();

    const idProyecto = document.getElementById("consumo-proyecto")?.value || "";
    const codigoMaterial = document.getElementById("consumo-material")?.value || "";
    const cantidad = numero(document.getElementById("consumo-cantidad")?.value);
    const zona = document.getElementById("consumo-zona")?.value.trim() || "";
    const tipoUso = document.getElementById("consumo-tipo-uso")?.value || "";
    const responsable = document.getElementById("consumo-responsable")?.value.trim() || "";
    let observacion = document.getElementById("consumo-observacion")?.value.trim() || "";

    let proyectoDestino = "";
    if (tipoUso === "MOVIMIENTO") {
        proyectoDestino = document.getElementById("consumo-proyecto-destino")?.value || "";
        if (!proyectoDestino) {
            alert("Seleccione el proyecto destino.");
            return;
        }
        const proyectoDestinoObj = buscarProyecto(proyectoDestino);
        if (proyectoDestinoObj) {
            const solpedDestino = obtenerCampo(proyectoDestinoObj, "SOLPED", "solped") || "";
            observacion = `Movimiento a ${proyectoDestinoObj.TITULO || proyectoDestino} (SOLPED: ${solpedDestino}) - ${observacion}`;
        }
    }

    if (!idProyecto) {
        alert("Seleccione un proyecto.");
        return;
    }
    if (!codigoMaterial) {
        alert("Seleccione un material.");
        return;
    }
    if (cantidad <= 0) {
        alert("Ingrese una cantidad válida.");
        return;
    }

    // 🔥 VERIFICAR STOCK EN EL PROYECTO
    const disponibleProyecto = obtenerDisponibleProyecto(idProyecto, codigoMaterial);
    if (cantidad > disponibleProyecto) {
        alert(`⚠️ No hay suficiente stock en el proyecto.\n\nDisponible: ${formatearNumero(disponibleProyecto)}\nSolicitado: ${formatearNumero(cantidad)}`);
        return;
    }

    const material = buscarMaterial(codigoMaterial);
    const proyecto = buscarProyecto(idProyecto);
    const solped = obtenerCampo(proyecto, "SOLPED", "solped") || "";

    // 🔥 1. REGISTRAR CONSUMO
    const registro = {
        ID: `CON-${Date.now()}`,
        FECHA: fechaActual(),
        ID_PROYECTO: idProyecto,
        CODIGO_MATERIAL: codigoMaterial,
        DESCRIPCION: material ? descripcionMaterial(material) : "",
        CANTIDAD: cantidad,
        SOLPED: solped,
        ZONA: zona,
        TIPO_USO: tipoUso,
        PROYECTO_DESTINO: proyectoDestino,
        RESPONSABLE: responsable,
        OBSERVACION: observacion,
        USUARIO: obtenerUsuarioActual()
    };
    consumos.push(registro);
    guardarDatos(CLAVES.consumos, consumos);

    // 🔥 2. ACTUALIZAR EL PROYECTO
    const existente = buscarRegistroProyectoMaterial(idProyecto, codigoMaterial);
    if (existente) {
        const consumidaActual = numero(obtenerCampo(existente, "CANTIDAD_CONSUMIDA", "cantidad_consumida"));
        existente.CANTIDAD_CONSUMIDA = consumidaActual + cantidad;
        console.log(`✅ Proyecto actualizado: Consumido ${cantidad} (total: ${existente.CANTIDAD_CONSUMIDA})`);
    } else {
        proyectoMateriales.push({
            ID: `PM-${Date.now()}`,
            ID_PROYECTO: idProyecto,
            CODIGO_MATERIAL: codigoMaterial,
            DESCRIPCION: material ? descripcionMaterial(material) : "",
            UNIDAD: material ? obtenerCampo(material, "UNIDAD", "unidad") : "",
            CANTIDAD_SOLICITADA: cantidad,
            CANTIDAD_ASIGNADA: cantidad,
            CANTIDAD_CONSUMIDA: cantidad,
            FECHA: fechaActual(),
            USUARIO: obtenerUsuarioActual()
        });
    }
    guardarDatos(CLAVES.proyectoMateriales, proyectoMateriales);

    // 🔥 3. ACTUALIZAR TODO
    mostrarInventario();
    mostrarMovimientos();
    actualizarDashboard();
    mostrarMaterialesProyecto(idProyecto);
    actualizarResumenProyecto(idProyecto);

    evento.target.reset();
    cargarProyectosConsumoSelect();
    toggleProyectoDestino();

    alert(`✅ Consumo registrado correctamente.\n\nProyecto: ${proyecto?.TITULO || idProyecto}\nMaterial: ${material ? descripcionMaterial(material) : codigoMaterial}\nCantidad: ${formatearNumero(cantidad)}\nStock restante en proyecto: ${formatearNumero(disponibleProyecto - cantidad)}`);
}
// ============================================================
// REGISTRAR AJUSTE
// ============================================================
function registrarAjuste(evento) {
    evento.preventDefault();
    const codigoMaterial = document.getElementById("ajuste-material")?.value || "";
    const tipo = document.getElementById("ajuste-tipo")?.value || "ENTRADA";
    const cantidad = numero(document.getElementById("ajuste-cantidad")?.value);
    const motivo = document.getElementById("ajuste-motivo")?.value || "";
    const observacion = document.getElementById("ajuste-observacion")?.value.trim() || "";
    if (!codigoMaterial) {
        alert("Seleccione un material.");
        return;
    }
    if (cantidad <= 0) {
        alert("Ingrese una cantidad válida.");
        return;
    }
    const material = buscarMaterial(codigoMaterial);
    const registro = {
        ID: `AJU-${Date.now()}`,
        FECHA: fechaActual(),
        CODIGO_MATERIAL: codigoMaterial,
        DESCRIPCION: material ? descripcionMaterial(material) : "",
        TIPO: tipo,
        CANTIDAD: cantidad,
        MOTIVO: motivo,
        OBSERVACION: observacion,
        USUARIO: obtenerUsuarioActual()
    };
    ajustes.push(registro);
    guardarDatos(CLAVES.ajustes, ajustes);
    mostrarInventario();
    mostrarMovimientos();
    actualizarDashboard();
    evento.target.reset();
    alert("Ajuste registrado correctamente.");
}

// ============================================================
// MOSTRAR MOVIMIENTOS
// ============================================================
function mostrarMovimientos() {
    const tabla = document.getElementById("tbody-movimientos");
    if (!tabla) return;
    const todos = [];
    entradas.forEach(entrada => {
        const codigo = obtenerCampo(entrada, "CODIGO_MATERIAL", "codigo_material");
        const material = buscarMaterial(codigo);
        const idProyecto = obtenerCampo(entrada, "ID_PROYECTO", "id_proyecto");
        const proyecto = idProyecto ? buscarProyecto(idProyecto) : null;
        const nombreProyecto = proyecto ? (proyecto.TITULO || proyecto.titulo || "") : "";
        todos.push({
            fecha: obtenerCampo(entrada, "FECHA", "fecha"),
            tipo: "ENTRADA",
            codigo: codigo,
            descripcion: material ? descripcionMaterial(material) : "",
            cantidad: numero(obtenerCampo(entrada, "CANTIDAD", "cantidad")),
            proyecto: nombreProyecto,
            solped: obtenerCampo(entrada, "SOLPED", "solped") || "",
            responsable: obtenerCampo(entrada, "RESPONSABLE", "responsable") || obtenerCampo(entrada, "PROVEEDOR", "proveedor") || "",
            usuario: obtenerCampo(entrada, "USUARIO", "usuario") || "",
            observacion: obtenerCampo(entrada, "OBSERVACION", "observacion") || ""
        });
    });
    consumos.forEach(consumo => {
        const codigo = obtenerCampo(consumo, "CODIGO_MATERIAL", "codigo_material");
        const material = buscarMaterial(codigo);
        const idProyecto = obtenerCampo(consumo, "ID_PROYECTO", "id_proyecto");
        const proyecto = idProyecto ? buscarProyecto(idProyecto) : null;
        const nombreProyecto = proyecto ? (proyecto.TITULO || proyecto.titulo || "") : "";
        todos.push({
            fecha: obtenerCampo(consumo, "FECHA", "fecha"),
            tipo: "CONSUMO",
            codigo: codigo,
            descripcion: material ? descripcionMaterial(material) : "",
            cantidad: numero(obtenerCampo(consumo, "CANTIDAD", "cantidad")),
            proyecto: nombreProyecto,
            solped: obtenerCampo(consumo, "SOLPED", "solped") || "",
            responsable: obtenerCampo(consumo, "RESPONSABLE", "responsable") || "",
            usuario: obtenerCampo(consumo, "USUARIO", "usuario") || "",
            observacion: obtenerCampo(consumo, "OBSERVACION", "observacion") || ""
        });
    });
    ajustes.forEach(ajuste => {
        const codigo = obtenerCampo(ajuste, "CODIGO_MATERIAL", "codigo_material");
        const material = buscarMaterial(codigo);
        todos.push({
            fecha: obtenerCampo(ajuste, "FECHA", "fecha"),
            tipo: `AJUSTE ${obtenerCampo(ajuste, "TIPO", "tipo")}`,
            codigo: codigo,
            descripcion: material ? descripcionMaterial(material) : "",
            cantidad: numero(obtenerCampo(ajuste, "CANTIDAD", "cantidad")),
            proyecto: "",
            solped: "",
            responsable: obtenerCampo(ajuste, "MOTIVO", "motivo") || "",
            usuario: obtenerCampo(ajuste, "USUARIO", "usuario") || "",
            observacion: obtenerCampo(ajuste, "OBSERVACION", "observacion") || ""
        });
    });
    todos.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    if (todos.length === 0) {
        tabla.innerHTML = `<tr><td colspan="10" class="sin-datos">No hay movimientos registrados.</td></tr>`;
        return;
    }
    tabla.innerHTML = todos.map(m => {
        return `<tr>
            <td>${escapeHTML(fechaVisible(m.fecha))}</td>
            <td>${escapeHTML(m.tipo)}</td>
            <td>${escapeHTML(m.codigo)}</td>
            <td>${escapeHTML(m.descripcion)}</td>
            <td>${formatearNumero(m.cantidad)}</td>
            <td>${escapeHTML(m.proyecto)}</td>
            <td>${escapeHTML(m.solped)}</td>
            <td>${escapeHTML(m.responsable)}</td>
            <td>${escapeHTML(m.usuario)}</td>
            <td>${escapeHTML(m.observacion)}</td>
        </tr>`;
    }).join("");
}

// ============================================================
// ACTUALIZAR DASHBOARD
// ============================================================
function actualizarDashboard() {
    const inventario = obtenerInventario();
    const materialesElemento = document.getElementById("total-materiales");
    const entradasElemento = document.getElementById("total-entradas");
    const consumosElemento = document.getElementById("total-consumos");
    const stockElemento = document.getElementById("total-stock");
    const disponiblesElemento = document.getElementById("total-disponibles");
    const agotadosElemento = document.getElementById("total-agotados");
    const valorElemento = document.getElementById("valor-inventario");

    // 🔥 CALCULAR DINERO GASTADO EN CONSUMOS
    let totalGastado = 0;
    consumos.forEach(consumo => {
        const codigo = obtenerCampo(consumo, "CODIGO_MATERIAL", "codigo_material");
        const material = buscarMaterial(codigo);
        const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO", "precio_unitario", "PRECIO", "precio")) : 0;
        const cantidad = numero(obtenerCampo(consumo, "CANTIDAD", "cantidad"));
        totalGastado += precio * cantidad;
    });

    const materialesCount = materiales.length;
    const entradasCount = entradas.length;
    const consumosCount = consumos.length;
    const stockTotal = inventario.reduce((total, item) => total + numero(item.stock), 0);
    const disponibles = inventario.filter(item => numero(item.stock) > 0).length;
    const agotados = inventario.filter(item => numero(item.stock) <= 0).length;
    const valor = inventario.reduce((total, item) => total + numero(item.valorStock), 0);

    if (materialesElemento) materialesElemento.textContent = formatearNumero(materialesCount);
    if (entradasElemento) entradasElemento.textContent = formatearNumero(entradasCount);
    if (consumosElemento) consumosElemento.textContent = formatearNumero(consumosCount);
    if (stockElemento) stockElemento.textContent = formatearNumero(stockTotal);
    if (disponiblesElemento) disponiblesElemento.textContent = formatearNumero(disponibles);
    if (agotadosElemento) agotadosElemento.textContent = formatearNumero(agotados);
    if (valorElemento) valorElemento.textContent = formatearMoneda(valor);

    // 🔥 MOSTRAR DINERO GASTADO (CREAR NUEVO ELEMENTO)
    let gastadoElemento = document.getElementById("total-gastado");
    if (!gastadoElemento) {
        // Si no existe, lo creamos
        const dashboardGrid = document.querySelector(".dashboard-grid");
        if (dashboardGrid) {
            const card = document.createElement("div");
            card.className = "dashboard-card";
            card.innerHTML = `
                <span class="card-icon">💸</span>
                <div>
                    <span class="card-label">Gastado</span>
                    <strong id="total-gastado">$0</strong>
                </div>
            `;
            dashboardGrid.appendChild(card);
            gastadoElemento = document.getElementById("total-gastado");
        }
    }
    if (gastadoElemento) {
        gastadoElemento.textContent = formatearMoneda(totalGastado);
    }
}

// ============================================================
// MOSTRAR SECCIÓN
// ============================================================
function mostrarSeccion(nombre) {
    const detalle = document.getElementById("detalle-proyecto");
    if (detalle) {
        detalle.style.display = "none";
        detalle.classList.remove("activa");
    }
    const secciones = document.querySelectorAll(".seccion");
    secciones.forEach(seccion => seccion.style.display = "none");
    const seccion = document.getElementById(nombre);
    if (seccion) seccion.style.display = "block";
    if (nombre === "inventario") mostrarInventario();
    if (nombre === "movimientos") mostrarMovimientos();
    if (nombre === "proyectos") mostrarProyectos();
    if (nombre === "inicio") actualizarDashboard();
    if (nombre === "entradas") cargarMaterialesSelect();
    if (nombre === "consumos") cargarMaterialesSelect();
    if (nombre === "ajustes") cargarMaterialesSelect();
}

// ============================================================
// CARGAR MATERIALES SELECT GENERAL
// ============================================================
function cargarMaterialesSelect() {
    const selects = document.querySelectorAll("#entrada-material, #consumo-material, #ajuste-material");
    selects.forEach(select => {
        const valorActual = select.value;
        select.innerHTML = `<option value="">Seleccione un material</option>`;
        materiales.forEach(material => {
            const codigo = obtenerCampo(material, "CODIGO", "codigo", "Codigo", "ID_MATERIAL", "id_material");
            const descripcion = descripcionMaterial(material);
            if (!codigo) return;
            const option = document.createElement("option");
            option.value = codigo;
            option.textContent = `${codigo} - ${descripcion}`;
            select.appendChild(option);
        });
        if (valorActual) select.value = valorActual;
    });
}

// ============================================================
// CARGAR PROYECTOS EN SELECT DE ENTRADAS
// ============================================================
function cargarProyectosEnEntrada() {
    const select = document.getElementById("entrada-proyecto");
    if (!select) return;
    const valorActual = select.value;
    select.innerHTML = `<option value="">Asignar a proyecto</option>`;
    proyectos.forEach(proyecto => {
        const id = obtenerCampo(proyecto, "ID_PROYECTO", "ID", "id");
        const titulo = obtenerCampo(proyecto, "TITULO", "titulo");
        const solped = obtenerCampo(proyecto, "SOLPED", "solped");
        if (id) {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = `${titulo || 'Sin título'} - SOLPED ${solped || 'N/A'}`;
            select.appendChild(option);
        }
    });
    if (valorActual) select.value = valorActual;
}

// ============================================================
// CARGAR PROYECTOS EN CONSUMOS
// ============================================================
function cargarProyectosConsumoSelect() {
    const select = document.getElementById("consumo-proyecto");
    if (!select) return;
    const valorActual = select.value;
    select.innerHTML = `<option value="">Seleccione un proyecto</option>`;
    proyectos.forEach(proyecto => {
        const id = obtenerCampo(proyecto, "ID_PROYECTO", "ID", "id");
        const titulo = obtenerCampo(proyecto, "TITULO", "titulo");
        const solped = obtenerCampo(proyecto, "SOLPED", "solped");
        if (id) {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = `${titulo || "Proyecto"} - SOLPED: ${solped || "Sin SOLPED"}`;
            select.appendChild(option);
        }
    });
    if (valorActual) select.value = valorActual;
}

// ============================================================
// MOSTRAR/OCULTAR PROYECTO DESTINO
// ============================================================
function toggleProyectoDestino() {
    const tipoUso = document.getElementById("consumo-tipo-uso")?.value;
    const contenedor = document.getElementById("contenedor-proyecto-destino");
    const selectDestino = document.getElementById("consumo-proyecto-destino");
    if (tipoUso === "MOVIMIENTO") {
        if (contenedor) contenedor.style.display = "block";
        if (selectDestino) {
            const valorActual = selectDestino.value;
            selectDestino.innerHTML = `<option value="">Seleccione proyecto destino</option>`;
            proyectos.forEach(proyecto => {
                const id = obtenerCampo(proyecto, "ID_PROYECTO", "ID", "id");
                const titulo = obtenerCampo(proyecto, "TITULO", "titulo");
                const solped = obtenerCampo(proyecto, "SOLPED", "solped");
                if (id) {
                    const option = document.createElement("option");
                    option.value = id;
                    option.textContent = `${titulo || "Proyecto"} - SOLPED: ${solped || "Sin SOLPED"}`;
                    selectDestino.appendChild(option);
                }
            });
            if (valorActual) selectDestino.value = valorActual;
        }
    } else {
        if (contenedor) contenedor.style.display = "none";
    }
}

// ============================================================
// ACTUALIZAR RESUMEN DEL PROYECTO (CON COSTO)
// ============================================================
function actualizarResumenProyecto(idProyecto) {
    const contenedor = document.getElementById("resumen-proyecto");
    if (!contenedor) {
        console.warn("No se encontró resumen-proyecto en el HTML");
        return;
    }
    const registros = proyectoMateriales.filter(registro => {
        const proyecto = obtenerCampo(registro, "ID_PROYECTO", "id_proyecto");
        return String(proyecto).trim() === String(idProyecto).trim();
    });
    if (registros.length === 0) {
        contenedor.innerHTML = `
            <div class="dashboard-card" style="grid-column: 1 / -1;">
                <p style="text-align:center;color:#999;">No hay materiales para mostrar resumen.</p>
            </div>
        `;
        return;
    }
    let totalSolicitado = 0;
    let totalAsignado = 0;
    let totalConsumido = 0;
    let totalDisponible = 0;
    let totalCostoAsignado = 0;
    let totalCostoConsumido = 0;
    registros.forEach(registro => {
        const codigo = obtenerCampo(registro, "CODIGO_MATERIAL", "codigo_material");
        const material = buscarMaterial(codigo);
        const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO", "precio_unitario", "PRECIO", "precio")) : 0;
        const solicitado = numero(obtenerCampo(registro, "CANTIDAD_SOLICITADA", "cantidad_solicitada"));
        const asignado = numero(obtenerCampo(registro, "CANTIDAD_ASIGNADA", "cantidad_asignada"));
        const consumido = obtenerConsumidoProyecto(idProyecto, codigo);
        const disponible = obtenerDisponibleProyecto(idProyecto, codigo);
        totalSolicitado += solicitado;
        totalAsignado += asignado;
        totalConsumido += consumido;
        totalDisponible += disponible;
        totalCostoAsignado += asignado * precio;
        totalCostoConsumido += consumido * precio;
    });
    contenedor.innerHTML = `
        <div class="dashboard-card">
            <span class="card-icon">📦</span>
            <div>
                <span class="card-label">Materiales</span>
                <strong>${formatearNumero(registros.length)}</strong>
            </div>
        </div>
        <div class="dashboard-card">
            <span class="card-icon">📝</span>
            <div>
                <span class="card-label">Solicitado</span>
                <strong>${formatearNumero(totalSolicitado)}</strong>
            </div>
        </div>
        <div class="dashboard-card">
            <span class="card-icon">✅</span>
            <div>
                <span class="card-label">Asignado</span>
                <strong>${formatearNumero(totalAsignado)}</strong>
            </div>
        </div>
        <div class="dashboard-card">
            <span class="card-icon">➖</span>
            <div>
                <span class="card-label">Consumido</span>
                <strong>${formatearNumero(totalConsumido)}</strong>
            </div>
        </div>
        <div class="dashboard-card">
            <span class="card-icon">📊</span>
            <div>
                <span class="card-label">Disponible</span>
                <strong>${formatearNumero(totalDisponible)}</strong>
            </div>
        </div>
        <div class="dashboard-card" style="background:#ecfdf5; border:2px solid #0f766e;">
            <span class="card-icon">💰</span>
            <div>
                <span class="card-label">💰 Costo Asignado</span>
                <strong style="color:#0f766e;">${formatearMoneda(totalCostoAsignado)}</strong>
            </div>
        </div>
        <div class="dashboard-card" style="background:#fef2f2; border:2px solid #ef4444;">
            <span class="card-icon">🔥</span>
            <div>
                <span class="card-label">🔥 Costo Consumido</span>
                <strong style="color:#dc2626;">${formatearMoneda(totalCostoConsumido)}</strong>
            </div>
        </div>
    `;
}

// ============================================================
// EXPORTAR DATOS
// ============================================================
function exportarDatos() {
    const datos = { materiales, haciendas, usuarios, entradas, consumos, ajustes, proyectos, proyectoMateriales, movimientosProyecto };
    const contenido = JSON.stringify(datos, null, 2);
    const archivo = new Blob([contenido], { type: "application/json" });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `inventario_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
}

// ============================================================
// IMPORTAR DATOS
// ============================================================
function importarDatosArchivo(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function() {
        try {
            const datos = JSON.parse(lector.result);
            if (!datos || typeof datos !== "object") throw new Error("Formato inválido.");
            if (Array.isArray(datos.materiales)) materiales = datos.materiales;
            if (Array.isArray(datos.haciendas)) haciendas = datos.haciendas;
            if (Array.isArray(datos.usuarios)) usuarios = datos.usuarios;
            if (Array.isArray(datos.entradas)) entradas = datos.entradas;
            if (Array.isArray(datos.consumos)) consumos = datos.consumos;
            if (Array.isArray(datos.ajustes)) ajustes = datos.ajustes;
            if (Array.isArray(datos.proyectos)) proyectos = datos.proyectos;
            if (Array.isArray(datos.proyectoMateriales)) proyectoMateriales = datos.proyectoMateriales;
            if (Array.isArray(datos.movimientosProyecto)) movimientosProyecto = datos.movimientosProyecto;
            guardarDatos(CLAVES.proyectos, proyectos);
            guardarDatos(CLAVES.proyectoMateriales, proyectoMateriales);
            guardarDatos(CLAVES.movimientosProyecto, movimientosProyecto);
            guardarDatos(CLAVES.entradas, entradas);
            guardarDatos(CLAVES.consumos, consumos);
            guardarDatos(CLAVES.ajustes, ajustes);
            actualizarDashboard();
            mostrarInventario();
            mostrarMovimientos();
            mostrarProyectos();
            cargarMaterialesSelect();
            cargarHaciendasProyectoSelect();
            alert("Datos importados correctamente.");
        } catch (error) {
            console.error(error);
            alert("No fue posible importar el archivo.");
        }
    };
    lector.readAsText(archivo);
}

// ============================================================
// FORMULARIO MATERIAL NUEVO
// ============================================================
function mostrarFormularioNuevoMaterial() {
    const modal = document.createElement('div');
    modal.id = 'modal-nuevo-material';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 99999;
    `;
    modal.innerHTML = `
        <div style="background:white;padding:30px;border-radius:12px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;">
            <h2 style="margin-top:0;color:#0f766e;">➕ Agregar Nuevo Material</h2>
            <p style="color:#666;margin-bottom:20px;">Ingrese los datos del nuevo material</p>
            <div style="margin-bottom:12px;">
                <label style="display:block;font-weight:600;font-size:14px;margin-bottom:4px;">Código *</label>
                <input id="input-codigo-nuevo" type="text" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;" placeholder="Ej: 1799999">
            </div>
            <div style="margin-bottom:12px;">
                <label style="display:block;font-weight:600;font-size:14px;margin-bottom:4px;">Descripción *</label>
                <input id="input-descripcion-nuevo" type="text" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;" placeholder="Ej: TUBERIA PEAD 14\"">
            </div>
            <div style="margin-bottom:12px;">
                <label style="display:block;font-weight:600;font-size:14px;margin-bottom:4px;">Unidad *</label>
                <input id="input-unidad-nuevo" type="text" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;" placeholder="Ej: ROLLO">
            </div>
            <div style="margin-bottom:12px;">
                <label style="display:block;font-weight:600;font-size:14px;margin-bottom:4px;">Precio Unitario</label>
                <input id="input-precio-nuevo" type="number" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;" placeholder="Ej: 750000">
            </div>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button onclick="guardarNuevoMaterial()" style="background:#0f766e;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;flex:1;">💾 Guardar</button>
                <button onclick="cerrarModalNuevoMaterial()" style="background:#6b7280;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function cerrarModalNuevoMaterial() {
    const modal = document.getElementById('modal-nuevo-material');
    if (modal) modal.remove();
}

function guardarNuevoMaterial() {
    const codigo = document.getElementById('input-codigo-nuevo').value.trim();
    const descripcion = document.getElementById('input-descripcion-nuevo').value.trim();
    const unidad = document.getElementById('input-unidad-nuevo').value.trim();
    const precio = parseFloat(document.getElementById('input-precio-nuevo').value) || 0;
    if (!codigo || !descripcion || !unidad) {
        alert('⚠️ Complete todos los campos obligatorios (*)');
        return;
    }
    const existe = materiales.some(m => String(obtenerCampo(m, "CODIGO", "codigo")).trim() === codigo);
    if (existe) {
        alert('⚠️ El código ya existe en el inventario.');
        return;
    }
    materiales.push({
        CODIGO: codigo,
        DESCRIPCION_CORTA: descripcion,
        DESCRIPCION_LARGA: descripcion,
        UNIDAD: unidad,
        PRECIO_UNITARIO: precio,
        STOCK_MINIMO: 0,
        ACTIVO: true
    });
    guardarDatos(CLAVES.materiales, materiales);
    mostrarInventario();
    actualizarDashboard();
    cargarMaterialesSelect();
    cargarMaterialesProyectoSelect();
    cerrarModalNuevoMaterial();
    alert(`✅ Material agregado correctamente.\n\nCódigo: ${codigo}\nDescripción: ${descripcion}\nUnidad: ${unidad}\nPrecio: $${formatearNumero(precio)}`);
}

// ============================================================
// EXPORTAR REPORTE COMPLETO
// ============================================================
function exportarReporteCompleto() {
    try {
        const inventario = obtenerInventario();
        const movimientos = [];
        entradas.forEach(e => {
            movimientos.push({
                FECHA: e.FECHA || fechaActual(),
                TIPO: 'ENTRADA',
                CODIGO: e.CODIGO_MATERIAL || '',
                DESCRIPCION: e.DESCRIPCION || '',
                CANTIDAD: e.CANTIDAD || 0,
                DETALLE: e.PROVEEDOR || e.OBSERVACION || ''
            });
        });
        consumos.forEach(e => {
            movimientos.push({
                FECHA: e.FECHA || fechaActual(),
                TIPO: 'CONSUMO',
                CODIGO: e.CODIGO_MATERIAL || '',
                DESCRIPCION: e.DESCRIPCION || '',
                CANTIDAD: e.CANTIDAD || 0,
                DETALLE: e.OBSERVACION || e.SOLPED || ''
            });
        });
        ajustes.forEach(e => {
            movimientos.push({
                FECHA: e.FECHA || fechaActual(),
                TIPO: 'AJUSTE ' + (e.TIPO || ''),
                CODIGO: e.CODIGO_MATERIAL || '',
                DESCRIPCION: e.DESCRIPCION || '',
                CANTIDAD: e.CANTIDAD || 0,
                DETALLE: e.MOTIVO || e.OBSERVACION || ''
            });
        });
        movimientos.sort((a, b) => String(b.FECHA).localeCompare(String(a.FECHA)));
        let reporte = '========================================\n';
        reporte += '📊 REPORTE COMPLETO DE INVENTARIO\n';
        reporte += '========================================\n';
        reporte += `Fecha: ${fechaActual()}\n`;
        reporte += `Total Materiales: ${materiales.length}\n`;
        reporte += `Total Entradas: ${entradas.length}\n`;
        reporte += `Total Consumos: ${consumos.length}\n`;
        reporte += `Total Ajustes: ${ajustes.length}\n`;
        reporte += '========================================\n\n';
        reporte += '📦 INVENTARIO ACTUAL\n';
        reporte += '----------------------------------------\n';
        reporte += 'CÓDIGO | DESCRIPCIÓN | UNIDAD | STOCK | ESTADO\n';
        reporte += '----------------------------------------\n';
        inventario.forEach(i => {
            reporte += `${i.codigo} | ${i.descripcion || 'Sin descripción'} | ${i.unidad || '-'} | ${formatearNumero(i.stock)} | ${i.estado}\n`;
        });
        reporte += '\n';
        reporte += '🔄 MOVIMIENTOS\n';
        reporte += '----------------------------------------\n';
        reporte += 'FECHA | TIPO | CÓDIGO | DESCRIPCIÓN | CANTIDAD | DETALLE\n';
        reporte += '----------------------------------------\n';
        movimientos.forEach(m => {
            reporte += `${fechaVisible(m.FECHA)} | ${m.TIPO} | ${m.CODIGO} | ${m.DESCRIPCION || '-'} | ${formatearNumero(m.CANTIDAD)} | ${m.DETALLE || '-'}\n`;
        });
        reporte += '\n';
        reporte += '========================================\n';
        reporte += '📊 FIN DEL REPORTE\n';
        reporte += '========================================\n';
        const blob = new Blob([reporte], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_inventario_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('✅ Reporte descargado correctamente.');
    } catch (error) {
        console.error(error);
        alert('❌ Error al generar el reporte: ' + error.message);
    }
}

function exportarReporteExcel() {
    try {
        const inventario = obtenerInventario();
        
        // ========== DATOS DE INVENTARIO ==========
        const datosInventario = inventario.map(i => ({
            'CÓDIGO': i.codigo || '',
            'DESCRIPCIÓN': i.descripcion || '',
            'UNIDAD': i.unidad || '',
            'ENTRADAS': i.entradas || 0,
            'CONSUMOS': i.consumos || 0,
            'AJUSTES': i.ajustes || 0,
            'STOCK': i.stock || 0,
            'ESTADO': i.estado || '',
            'VALOR STOCK': i.valorStock || 0
        }));
        
        // ========== DATOS DE MOVIMIENTOS CON PROYECTO ==========
        const datosMovimientos = [];
        
        // ENTRADAS
        entradas.forEach(e => {
            const idProyecto = e.ID_PROYECTO || e.id_proyecto || "";
            const proyecto = idProyecto ? buscarProyecto(idProyecto) : null;
            const nombreProyecto = proyecto ? (proyecto.TITULO || proyecto.titulo || "") : "";
            const solped = e.SOLPED || e.solped || "";
            
            datosMovimientos.push({
                'FECHA': e.FECHA || '',
                'TIPO': 'ENTRADA',
                'CÓDIGO': e.CODIGO_MATERIAL || '',
                'DESCRIPCIÓN': e.DESCRIPCION || '',
                'CANTIDAD': e.CANTIDAD || 0,
                'PROYECTO': nombreProyecto,
                'SOLPED': solped,
                'PRECIO UNITARIO': e.PRECIO_UNITARIO || 0,
                'TOTAL': (e.CANTIDAD || 0) * (e.PRECIO_UNITARIO || 0),
                'RESPONSABLE': e.PROVEEDOR || e.responsable || '',
                'OBSERVACIÓN': e.OBSERVACION || ''
            });
        });
        
        // CONSUMOS
        consumos.forEach(e => {
            const idProyecto = e.ID_PROYECTO || e.id_proyecto || "";
            const proyecto = idProyecto ? buscarProyecto(idProyecto) : null;
            const nombreProyecto = proyecto ? (proyecto.TITULO || proyecto.titulo || "") : "";
            const solped = e.SOLPED || e.solped || "";
            
            // 🔥 OBTENER PRECIO DEL MATERIAL
            const material = buscarMaterial(e.CODIGO_MATERIAL || e.codigo_material || "");
            const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO", "precio_unitario", "PRECIO", "precio")) : 0;
            const cantidad = e.CANTIDAD || e.cantidad || 0;
            
            datosMovimientos.push({
                'FECHA': e.FECHA || '',
                'TIPO': 'CONSUMO',
                'CÓDIGO': e.CODIGO_MATERIAL || '',
                'DESCRIPCIÓN': e.DESCRIPCION || '',
                'CANTIDAD': cantidad,
                'PROYECTO': nombreProyecto,
                'SOLPED': solped,
                'PRECIO UNITARIO': precio,
                'TOTAL': cantidad * precio, // 🔥 PRECIO DEL CONSUMO
                'RESPONSABLE': e.RESPONSABLE || e.responsable || '',
                'OBSERVACIÓN': e.OBSERVACION || ''
            });
        });
        
        // AJUSTES
        ajustes.forEach(e => {
            const material = buscarMaterial(e.CODIGO_MATERIAL || e.codigo_material || "");
            const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO", "precio_unitario", "PRECIO", "precio")) : 0;
            const cantidad = e.CANTIDAD || e.cantidad || 0;
            
            datosMovimientos.push({
                'FECHA': e.FECHA || '',
                'TIPO': 'AJUSTE ' + (e.TIPO || ''),
                'CÓDIGO': e.CODIGO_MATERIAL || '',
                'DESCRIPCIÓN': e.DESCRIPCION || '',
                'CANTIDAD': cantidad,
                'PROYECTO': '',
                'SOLPED': '',
                'PRECIO UNITARIO': precio,
                'TOTAL': cantidad * precio,
                'RESPONSABLE': e.MOTIVO || '',
                'OBSERVACIÓN': e.OBSERVACION || ''
            });
        });
        
        // ORDENAR POR FECHA (más reciente primero)
        datosMovimientos.sort((a, b) => String(b.FECHA).localeCompare(String(a.FECHA)));
        
        // ========== CREAR EXCEL ==========
        const wb = XLSX.utils.book_new();
        
        // Hoja de Inventario
        const wsInventario = XLSX.utils.json_to_sheet(datosInventario);
        XLSX.utils.book_append_sheet(wb, wsInventario, 'INVENTARIO');
        
        // Hoja de Movimientos (con Proyecto y Precio)
        const wsMovimientos = XLSX.utils.json_to_sheet(datosMovimientos);
        XLSX.utils.book_append_sheet(wb, wsMovimientos, 'MOVIMIENTOS');
        
        // ========== DESCARGAR ==========
        XLSX.writeFile(wb, `reporte_completo_${new Date().toISOString().slice(0,10)}.xlsx`);
        
        alert('✅ Reporte en Excel descargado correctamente.');
        
    } catch (error) {
        console.error(error);
        alert('❌ Error al generar el reporte: ' + error.message);
    }
}

// ============================================================
// IMPORTAR EXCEL
// ============================================================
function importarExcel(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) {
        alert("No se seleccionó ningún archivo.");
        return;
    }
    const extension = archivo.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(extension)) {
        alert("Por favor, seleccione un archivo Excel (.xlsx o .xls)");
        return;
    }
    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            let mensajes = [];
            let totalImportados = 0;
            let importadosMateriales = 0;
            let importadosHaciendas = 0;
            let importadosEntradas = 0;
            let importadosConsumos = 0;
            let importadosAjustes = 0;
            if (workbook.SheetNames.includes('MATERIALES')) {
                const hoja = workbook.Sheets['MATERIALES'];
                const datos = XLSX.utils.sheet_to_json(hoja);
                datos.forEach(row => {
                    const codigo = String(row.CODIGO || row.codigo || "").trim();
                    const descripcion = String(row.DESCRIPCION_CORTA || row.descripcion_corta || row.DESCRIPCION || row.descripcion || "").trim();
                    const unidad = String(row.UNIDAD || row.unidad || "").trim();
                    const precio = parseFloat(row.PRECIO_UNITARIO || row.precio_unitario || 0);
                    if (codigo && descripcion) {
                        const existe = materiales.some(m => String(obtenerCampo(m, "CODIGO", "codigo")).trim() === codigo);
                        if (!existe) {
                            materiales.push({
                                CODIGO: codigo,
                                DESCRIPCION_CORTA: descripcion,
                                DESCRIPCION_LARGA: String(row.DESCRIPCION_LARGA || row.descripcion_larga || "").trim(),
                                UNIDAD: unidad,
                                LONGITUD: parseFloat(row.LONGITUD || row.longitud || 0),
                                PRECIO_UNITARIO: precio,
                                STOCK_MINIMO: parseFloat(row.STOCK_MINIMO || row.stock_minimo || 0),
                                ACTIVO: String(row.ACTIVO || row.activo || "SI").toUpperCase() === "SI"
                            });
                            importadosMateriales++;
                        }
                    }
                });
                guardarDatos(CLAVES.materiales, materiales);
                mensajes.push(`📦 Materiales: ${importadosMateriales} importados`);
                totalImportados += importadosMateriales;
            }
            if (workbook.SheetNames.includes('HACIENDAS')) {
                const hoja = workbook.Sheets['HACIENDAS'];
                const datos = XLSX.utils.sheet_to_json(hoja);
                datos.forEach(row => {
                    const codigo = String(row.CODIGO_HACIENDA || row.codigo_hacienda || "").trim();
                    const nombre = String(row.NOMBRE_HACIENDA || row.nombre_hacienda || "").trim();
                    if (codigo && nombre) {
                        const existe = haciendas.some(h => String(obtenerCampo(h, "CODIGO_HACIENDA", "codigo_hacienda", "CODIGO", "codigo")).trim() === codigo);
                        if (!existe) {
                            haciendas.push({
                                CODIGO_HACIENDA: codigo,
                                NOMBRE_HACIENDA: nombre,
                                PROVEEDOR: String(row.PROVEEDOR || row.proveedor || "").trim(),
                                ACTIVO: String(row.ACTIVO || row.activo || "SI").toUpperCase() === "SI"
                            });
                            importadosHaciendas++;
                        }
                    }
                });
                guardarDatos(CLAVES.haciendas, haciendas);
                mensajes.push(`🌱 Haciendas: ${importadosHaciendas} importadas`);
                totalImportados += importadosHaciendas;
            }
            if (workbook.SheetNames.includes('ENTRADAS')) {
                const hoja = workbook.Sheets['ENTRADAS'];
                const datos = XLSX.utils.sheet_to_json(hoja);
                datos.forEach(row => {
                    const codigo = String(row.CODIGO_MATERIAL || row.codigo_material || "").trim();
                    const cantidad = parseFloat(row.CANTIDAD || row.cantidad || 0);
                    if (codigo && cantidad > 0) {
                        const material = buscarMaterial(codigo);
                        entradas.push({
                            ID: `ENT-${Date.now()}-${importadosEntradas}`,
                            FECHA: row.FECHA || row.fecha || fechaActual(),
                            CODIGO_MATERIAL: codigo,
                            DESCRIPCION: material ? descripcionMaterial(material) : "",
                            CANTIDAD: cantidad,
                            PRECIO_UNITARIO: parseFloat(row.PRECIO_UNITARIO || row.precio_unitario || 0),
                            PROVEEDOR: String(row.PROVEEDOR || row.proveedor || "").trim(),
                            SOLPED: String(row.SOLPED || row.solped || "").trim(),
                            LOTE: String(row.LOTE || row.lote || "").trim(),
                            VENCIMIENTO: row.VENCIMIENTO || row.vencimiento || "",
                            USUARIO: String(row.USUARIO || row.usuario || "Importado").trim(),
                            OBSERVACION: String(row.OBSERVACION || row.observacion || "Importado desde Excel").trim()
                        });
                        importadosEntradas++;
                    }
                });
                guardarDatos(CLAVES.entradas, entradas);
                mensajes.push(`➕ Entradas: ${importadosEntradas} importadas`);
                totalImportados += importadosEntradas;
            }
            if (workbook.SheetNames.includes('CONSUMOS')) {
                const hoja = workbook.Sheets['CONSUMOS'];
                const datos = XLSX.utils.sheet_to_json(hoja);
                datos.forEach(row => {
                    const codigo = String(row.CODIGO_MATERIAL || row.codigo_material || "").trim();
                    const cantidad = parseFloat(row.CANTIDAD || row.cantidad || 0);
                    if (codigo && cantidad > 0) {
                        const material = buscarMaterial(codigo);
                        consumos.push({
                            ID: `CON-${Date.now()}-${importadosConsumos}`,
                            FECHA: row.FECHA || row.fecha || fechaActual(),
                            CODIGO_MATERIAL: codigo,
                            DESCRIPCION: material ? descripcionMaterial(material) : "",
                            CANTIDAD: cantidad,
                            CODIGO_HACIENDA: String(row.CODIGO_HACIENDA || row.codigo_hacienda || "").trim(),
                            SUERTE: String(row.SUERTE || row.suerte || "").trim(),
                            ZONA: String(row.ZONA || row.zona || "").trim(),
                            TIPO_USO: String(row.TIPO_USO || row.tipo_uso || "").trim(),
                            SOLPED: String(row.SOLPED || row.solped || "").trim(),
                            RESPONSABLE: String(row.RESPONSABLE || row.responsable || "").trim(),
                            USUARIO: String(row.USUARIO || row.usuario || "Importado").trim(),
                            OBSERVACION: String(row.OBSERVACION || row.observacion || "Importado desde Excel").trim()
                        });
                        importadosConsumos++;
                    }
                });
                guardarDatos(CLAVES.consumos, consumos);
                mensajes.push(`➖ Consumos: ${importadosConsumos} importados`);
                totalImportados += importadosConsumos;
            }
            if (workbook.SheetNames.includes('AJUSTES')) {
                const hoja = workbook.Sheets['AJUSTES'];
                const datos = XLSX.utils.sheet_to_json(hoja);
                datos.forEach(row => {
                    const codigo = String(row.CODIGO_MATERIAL || row.codigo_material || "").trim();
                    const cantidad = parseFloat(row.CANTIDAD || row.cantidad || 0);
                    const tipo = String(row.TIPO || row.tipo || "ENTRADA").toUpperCase();
                    if (codigo && cantidad > 0) {
                        const material = buscarMaterial(codigo);
                        ajustes.push({
                            ID: `AJU-${Date.now()}-${importadosAjustes}`,
                            FECHA: row.FECHA || row.fecha || fechaActual(),
                            CODIGO_MATERIAL: codigo,
                            DESCRIPCION: material ? descripcionMaterial(material) : "",
                            TIPO: tipo,
                            CANTIDAD: cantidad,
                            MOTIVO: String(row.MOTIVO || row.motivo || "Ajuste desde Excel").trim(),
                            USUARIO: String(row.USUARIO || row.usuario || "Importado").trim(),
                            OBSERVACION: String(row.OBSERVACION || row.observacion || "Importado desde Excel").trim()
                        });
                        importadosAjustes++;
                    }
                });
                guardarDatos(CLAVES.ajustes, ajustes);
                mensajes.push(`⚙️ Ajustes: ${importadosAjustes} importados`);
                totalImportados += importadosAjustes;
            }
            mostrarInventario();
            mostrarMovimientos();
            actualizarDashboard();
            cargarMaterialesSelect();
            cargarMaterialesProyectoSelect();
            cargarHaciendasProyectoSelect();
            cargarHaciendasSelect();
            let mensaje = `✅ IMPORTACIÓN COMPLETADA\n\n`;
            mensaje += mensajes.join('\n');
            mensaje += `\n\n📊 Total de registros importados: ${totalImportados}`;
            mensaje += `\n\nLos datos se han guardado en el inventario.`;
            alert(mensaje);
        } catch (error) {
            console.error("Error al importar Excel:", error);
            alert(`❌ Error al importar el archivo Excel:\n\n${error.message}`);
        }
    };
    lector.readAsArrayBuffer(archivo);
    evento.target.value = "";
}

// ============================================================
// GESTIÓN DE DOCUMENTOS
// ============================================================
function agregarDocumentosProyecto() {
    const detalle = document.getElementById("detalle-proyecto");
    const idProyecto = detalle ? detalle.dataset.proyectoId : "";
    if (!idProyecto) {
        alert("No hay un proyecto seleccionado.");
        return;
    }
    document.getElementById("input-agregar-documentos").click();
}

function procesarDocumentosProyecto(evento) {
    const archivos = evento.target.files;
    if (!archivos || archivos.length === 0) return;
    const detalle = document.getElementById("detalle-proyecto");
    const idProyecto = detalle ? detalle.dataset.proyectoId : "";
    if (!idProyecto) {
        alert("No hay un proyecto seleccionado.");
        return;
    }
    const proyecto = buscarProyecto(idProyecto);
    if (!proyecto) {
        alert("No se encontró el proyecto.");
        return;
    }
    if (!proyecto.ARCHIVOS) proyecto.ARCHIVOS = [];
    let procesados = 0;
    for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        const lector = new FileReader();
        lector.onload = function(e) {
            proyecto.ARCHIVOS.push({
                id: Date.now() + "-" + i,
                nombre: archivo.name,
                tipo: archivo.type || "application/octet-stream",
                tamaño: archivo.size,
                fecha: fechaActual(),
                contenido: e.target.result
            });
            procesados++;
            if (procesados === archivos.length) {
                guardarDatos(CLAVES.proyectos, proyectos);
                mostrarDocumentosProyecto(idProyecto);
                alert(`✅ ${procesados} documento(s) agregado(s) correctamente.`);
                evento.target.value = "";
            }
        };
        lector.readAsDataURL(archivo);
    }
}

function eliminarDocumentoProyecto(idProyecto, docId) {
    if (!confirm("¿Eliminar este documento?")) return;
    const proyecto = buscarProyecto(idProyecto);
    if (!proyecto) {
        alert("No se encontró el proyecto.");
        return;
    }
    const archivos = proyecto.ARCHIVOS || [];
    const idx = archivos.findIndex(a => a.id === docId);
    if (idx === -1) {
        alert("No se encontró el documento.");
        return;
    }
    archivos.splice(idx, 1);
    guardarDatos(CLAVES.proyectos, proyectos);
    mostrarDocumentosProyecto(idProyecto);
}

function descargarArchivoProyecto(idProyecto, docId) {
    const proyecto = buscarProyecto(idProyecto);
    if (!proyecto) {
        alert("No se encontró el proyecto.");
        return;
    }
    const archivos = proyecto.ARCHIVOS || [];
    const archivo = archivos.find(a => a.id === docId);
    if (!archivo) {
        alert("No se encontró el documento.");
        return;
    }
    const link = document.createElement("a");
    link.href = archivo.contenido;
    link.download = archivo.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================================
// CAMBIAR ESTADO DEL PROYECTO
// ============================================================
function cambiarEstadoProyecto() {
    const detalle = document.getElementById("detalle-proyecto");
    const idProyecto = detalle ? detalle.dataset.proyectoId : "";
    if (!idProyecto) {
        alert("No hay un proyecto seleccionado.");
        return;
    }
    const proyecto = buscarProyecto(idProyecto);
    if (!proyecto) {
        alert("No se encontró el proyecto.");
        return;
    }
    const estadoActual = obtenerCampo(proyecto, "ESTADO", "estado") || "ACTIVO";
    const nuevoEstado = estadoActual === "ACTIVO" ? "CERRADO" : "ACTIVO";
    if (!confirm(`¿Cambiar el estado del proyecto de "${estadoActual}" a "${nuevoEstado}"?`)) return;
    proyecto.ESTADO = nuevoEstado;
    guardarDatos(CLAVES.proyectos, proyectos);
    mostrarDetalleProyecto(idProyecto);
    mostrarProyectos();
    actualizarDashboard();
    alert(`✅ Proyecto cambiado a "${nuevoEstado}" correctamente.`);
}

// ============================================================
// CONFIGURAR NAVEGACIÓN
// ============================================================
function configurarNavegacion() {
    const enlaces = document.querySelectorAll("[data-seccion]");
    enlaces.forEach(enlace => {
        enlace.addEventListener("click", function(evento) {
            evento.preventDefault();
            const seccion = this.dataset.seccion;
            if (seccion) mostrarSeccion(seccion);
        });
    });
}

// ============================================================
// CONFIGURAR BUSCADORES
// ============================================================
function configurarBuscador() {
    const buscadorInventario = document.getElementById("buscar-inventario");
    if (buscadorInventario) {
        buscadorInventario.addEventListener("input", mostrarInventario);
    }
    const buscadorProyectos = document.getElementById("buscar-proyectos");
    if (buscadorProyectos) {
        buscadorProyectos.addEventListener("input", mostrarProyectos);
    }
}

// ============================================================
// CONFIGURAR FORMULARIOS
// ============================================================
function configurarFormularios() {
    const formularioProyecto = document.getElementById("form-proyecto");
    if (formularioProyecto) {
        formularioProyecto.addEventListener("submit", registrarProyecto);
    }
    const formularioMaterialProyecto = document.getElementById("form-material-proyecto");
    if (formularioMaterialProyecto) {
        formularioMaterialProyecto.addEventListener("submit", agregarMaterialProyecto);
    }
    const formularioEntrada = document.getElementById("form-entrada");
    if (formularioEntrada) {
        formularioEntrada.addEventListener("submit", registrarEntrada);
    }
    const formularioConsumo = document.getElementById("form-consumo");
    if (formularioConsumo) {
        formularioConsumo.addEventListener("submit", registrarConsumo);
    }
    const formularioAjuste = document.getElementById("form-ajuste");
    if (formularioAjuste) {
        formularioAjuste.addEventListener("submit", registrarAjuste);
    }
}

// ============================================================
// CONFIGURAR BOTONES ADICIONALES
// ============================================================
function configurarBotonesAdicionales() {
    const botonAgregarMaterial = document.getElementById("btn-agregar-material-proyecto");
    if (botonAgregarMaterial) {
        botonAgregarMaterial.addEventListener("click", mostrarFormularioMaterialProyecto);
    }
    const botonCancelarMaterial = document.getElementById("btn-cancelar-material-proyecto");
    if (botonCancelarMaterial) {
        botonCancelarMaterial.addEventListener("click", ocultarFormularioMaterialProyecto);
    }
    const botonCerrarDetalle = document.getElementById("btn-cerrar-detalle-proyecto");
    if (botonCerrarDetalle) {
        botonCerrarDetalle.addEventListener("click", cerrarDetalleProyecto);
    }
    const botonExportar = document.getElementById("btn-exportar-datos");
    if (botonExportar) {
        botonExportar.addEventListener("click", exportarDatos);
    }
    const inputImportar = document.getElementById("input-importar-datos");
    if (inputImportar) {
        inputImportar.addEventListener("change", importarDatosArchivo);
    }
}

// ============================================================
// FUNCIONES GLOBALES
// ============================================================
window.mostrarSeccion = mostrarSeccion;
window.mostrarInventario = mostrarInventario;
window.mostrarMovimientos = mostrarMovimientos;
window.mostrarProyectos = mostrarProyectos;
window.mostrarDetalleProyecto = mostrarDetalleProyecto;
window.cerrarDetalleProyecto = cerrarDetalleProyecto;
window.cerrarFormularioProyecto = cerrarFormularioProyecto;
window.mostrarFormularioProyecto = mostrarFormularioProyecto;
window.ocultarFormularioProyecto = ocultarFormularioProyecto;
window.mostrarFormularioMaterialProyecto = mostrarFormularioMaterialProyecto;
window.ocultarFormularioMaterialProyecto = ocultarFormularioMaterialProyecto;
window.agregarMaterialProyecto = agregarMaterialProyecto;
window.eliminarMaterialProyecto = eliminarMaterialProyecto;
window.editarCantidadMaterialProyecto = editarCantidadMaterialProyecto;
window.registrarProyecto = registrarProyecto;
window.eliminarProyecto = eliminarProyecto;
window.registrarEntrada = registrarEntrada;
window.registrarConsumo = registrarConsumo;
window.registrarAjuste = registrarAjuste;
window.exportarDatos = exportarDatos;
window.importarDatosArchivo = importarDatosArchivo;

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    try {
        cargarDatosCompatibles();
        configurarNavegacion();
        configurarBuscador();
        configurarFormularios();
        configurarBotonesAdicionales();
        cargarMaterialesSelect();
        cargarHaciendasSelect();
        cargarHaciendasProyectoSelect();
        cargarMaterialesProyectoSelect();
        cargarProyectosEnEntrada();
        cargarProyectosConsumoSelect();
        const tipoUso = document.getElementById("consumo-tipo-uso");
        if (tipoUso) {
            tipoUso.addEventListener("change", toggleProyectoDestino);
        }
        toggleProyectoDestino();
        actualizarDashboard();
        mostrarInventario();
        mostrarMovimientos();
        mostrarProyectos();
        mostrarSeccion("proyectos");
    } catch (error) {
        console.error("Error inicializando la aplicación:", error);
        alert("La aplicación encontró un problema al iniciar. Revise la consola del navegador.");
    }
});
/* =========================================================
   EXPORTAR DATOS A JSON (SIN CONSOLA)
   ========================================================= */

function exportarJSON() {
    try {
        const datos = {
            materiales: JSON.parse(localStorage.getItem("inventario_materiales") || "[]"),
            haciendas: JSON.parse(localStorage.getItem("inventario_haciendas") || "[]"),
            usuarios: JSON.parse(localStorage.getItem("inventario_usuarios") || "[]"),
            entradas: JSON.parse(localStorage.getItem("inventario_entradas") || "[]"),
            consumos: JSON.parse(localStorage.getItem("inventario_consumos") || "[]"),
            ajustes: JSON.parse(localStorage.getItem("inventario_ajustes") || "[]"),
            proyectos: JSON.parse(localStorage.getItem("inventario_proyectos") || "[]"),
            proyectoMateriales: JSON.parse(localStorage.getItem("inventario_proyecto_materiales") || "[]"),
            movimientosProyecto: JSON.parse(localStorage.getItem("inventario_movimientos_proyecto") || "[]")
        };
        
        const blob = new Blob([JSON.stringify(datos, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventario_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`✅ Datos exportados correctamente.\n\n📦 Materiales: ${datos.materiales.length}\n📋 Proyectos: ${datos.proyectos.length}\n📊 Entradas: ${datos.entradas.length}\n📊 Consumos: ${datos.consumos.length}`);
    } catch (error) {
        console.error("Error al exportar:", error);
        alert("❌ Error al exportar los datos: " + error.message);
    }
}

/* =========================================================
   IMPORTAR DATOS DESDE JSON (SIN CONSOLA)
   ========================================================= */

function importarJSON(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) {
        alert("No se seleccionó ningún archivo.");
        return;
    }
    
    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            let importados = 0;
            
            if (datos.materiales) {
                localStorage.setItem("inventario_materiales", JSON.stringify(datos.materiales));
                importados += datos.materiales.length;
            }
            if (datos.haciendas) {
                localStorage.setItem("inventario_haciendas", JSON.stringify(datos.haciendas));
                importados += datos.haciendas.length;
            }
            if (datos.usuarios) {
                localStorage.setItem("inventario_usuarios", JSON.stringify(datos.usuarios));
                importados += datos.usuarios.length;
            }
            if (datos.entradas) {
                localStorage.setItem("inventario_entradas", JSON.stringify(datos.entradas));
                importados += datos.entradas.length;
            }
            if (datos.consumos) {
                localStorage.setItem("inventario_consumos", JSON.stringify(datos.consumos));
                importados += datos.consumos.length;
            }
            if (datos.ajustes) {
                localStorage.setItem("inventario_ajustes", JSON.stringify(datos.ajustes));
                importados += datos.ajustes.length;
            }
            if (datos.proyectos) {
                localStorage.setItem("inventario_proyectos", JSON.stringify(datos.proyectos));
                importados += datos.proyectos.length;
            }
            if (datos.proyectoMateriales) {
                localStorage.setItem("inventario_proyecto_materiales", JSON.stringify(datos.proyectoMateriales));
                importados += datos.proyectoMateriales.length;
            }
            if (datos.movimientosProyecto) {
                localStorage.setItem("inventario_movimientos_proyecto", JSON.stringify(datos.movimientosProyecto));
                importados += datos.movimientosProyecto.length;
            }
            
            alert(`✅ Datos importados correctamente.\n\nTotal registros importados: ${importados}`);
            location.reload();
        } catch (error) {
            alert("❌ Error al importar: " + error.message);
        }
    };
    lector.readAsText(archivo);
    evento.target.value = "";
}
/* =========================================================
   REPORTES AVANZADOS
   ========================================================= */

function mostrarReportes() {
    // Cargar proyectos en el select
    const selectProyecto = document.getElementById("reporte-proyecto");
    if (selectProyecto) {
        selectProyecto.innerHTML = '<option value="">Seleccione un proyecto</option>';
        proyectos.forEach(p => {
            const id = p.ID_PROYECTO || p.ID || p.id || "";
            const titulo = p.TITULO || p.titulo || "";
            const solped = p.SOLPED || p.solped || "";
            if (id) {
                const option = document.createElement("option");
                option.value = id;
                option.textContent = `${titulo} - SOLPED: ${solped}`;
                selectProyecto.appendChild(option);
            }
        });
    }
    
    document.getElementById("modal-reportes").style.display = "flex";
    
    // Eventos para mostrar/ocultar selects
    document.getElementById("reporte-tipo").onchange = function() {
        const val = this.value;
        document.getElementById("contenedor-select-proyecto").style.display = val === "proyecto" ? "block" : "none";
        document.getElementById("contenedor-select-tipo").style.display = val === "movimientos" ? "block" : "none";
    };
}

function cerrarReportes() {
    document.getElementById("modal-reportes").style.display = "none";
}

function generarReporte() {
    const tipo = document.getElementById("reporte-tipo").value;
    
    if (tipo === "resumen") {
        generarResumenEjecutivo();
    } else if (tipo === "proyecto") {
        generarReportePorProyecto();
    } else if (tipo === "movimientos") {
        generarReportePorTipoMovimiento();
    } else if (tipo === "completo") {
        generarReporteCompleto();
    }
    
    cerrarReportes();
}

/* =========================================================
   REPORTE: RESUMEN EJECUTIVO
   ========================================================= */

function generarResumenEjecutivo() {
    let reporte = "========================================\n";
    reporte += "📊 RESUMEN EJECUTIVO DE INVENTARIO\n";
    reporte += "========================================\n";
    reporte += `Fecha: ${fechaActual()}\n\n`;
    
    let totalGeneralAsignado = 0;
    let totalGeneralConsumido = 0;
    let totalGeneralDisponible = 0;
    
    proyectos.forEach(p => {
        const id = p.ID_PROYECTO || p.ID || p.id || "";
        const titulo = p.TITULO || p.titulo || "";
        const solped = p.SOLPED || p.solped || "";
        
        const registros = proyectoMateriales.filter(r => {
            const pid = r.ID_PROYECTO || r.id_proyecto || "";
            return String(pid).trim() === String(id).trim();
        });
        
        let totalAsignado = 0;
        let totalConsumido = 0;
        let totalCostoAsignado = 0;
        let totalCostoConsumido = 0;
        
        registros.forEach(r => {
            const codigo = r.CODIGO_MATERIAL || r.codigo_material || "";
            const material = buscarMaterial(codigo);
            const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
            const asignado = numero(r.CANTIDAD_ASIGNADA || r.cantidad_asignada || 0);
            const consumido = numero(r.CANTIDAD_CONSUMIDA || r.cantidad_consumida || 0);
            totalAsignado += asignado;
            totalConsumido += consumido;
            totalCostoAsignado += asignado * precio;
            totalCostoConsumido += consumido * precio;
        });
        
        const disponible = totalAsignado - totalConsumido;
        const balance = totalCostoAsignado - totalCostoConsumido;
        
        totalGeneralAsignado += totalAsignado;
        totalGeneralConsumido += totalConsumido;
        totalGeneralDisponible += disponible;
        
        reporte += `📋 PROYECTO: ${titulo}\n`;
        reporte += `   SOLPED: ${solped}\n`;
        reporte += `   Materiales: ${registros.length}\n`;
        reporte += `   Asignado: ${formatearNumero(totalAsignado)} unidades\n`;
        reporte += `   Consumido: ${formatearNumero(totalConsumido)} unidades\n`;
        reporte += `   Disponible: ${formatearNumero(disponible)} unidades\n`;
        reporte += `   💰 Costo Asignado: ${formatearMoneda(totalCostoAsignado)}\n`;
        reporte += `   🔥 Costo Consumido: ${formatearMoneda(totalCostoConsumido)}\n`;
        reporte += `   📊 Balance: ${formatearMoneda(balance)}\n`;
        reporte += `   ${balance >= 0 ? "✅" : "⚠️"} Estado: ${balance >= 0 ? "Presupuesto OK" : "Sobre costo"}\n\n`;
    });
    
    reporte += "========================================\n";
    reporte += "📊 TOTALES GENERALES\n";
    reporte += `   Total Asignado: ${formatearNumero(totalGeneralAsignado)} unidades\n`;
    reporte += `   Total Consumido: ${formatearNumero(totalGeneralConsumido)} unidades\n`;
    reporte += `   Total Disponible: ${formatearNumero(totalGeneralDisponible)} unidades\n`;
    reporte += "========================================\n";
    reporte += `📊 FIN DEL REPORTE\n`;
    reporte += "========================================\n";
    
    descargarReporte(reporte, `resumen_ejecutivo_${new Date().toISOString().slice(0,10)}.txt`);
}

/* =========================================================
   REPORTE: POR PROYECTO
   ========================================================= */

function generarReportePorProyecto() {
    const idProyecto = document.getElementById("reporte-proyecto").value;
    if (!idProyecto) {
        alert("Seleccione un proyecto.");
        return;
    }
    
    const proyecto = buscarProyecto(idProyecto);
    if (!proyecto) {
        alert("No se encontró el proyecto.");
        return;
    }
    
    const titulo = proyecto.TITULO || proyecto.titulo || "";
    const solped = proyecto.SOLPED || proyecto.solped || "";
    
    let reporte = "========================================\n";
    reporte += `📋 REPORTE DEL PROYECTO: ${titulo}\n`;
    reporte += `SOLPED: ${solped}\n`;
    reporte += `Fecha: ${fechaActual()}\n`;
    reporte += "========================================\n\n";
    
    // Movimientos del proyecto
    const movimientos = [];
    entradas.filter(e => (e.ID_PROYECTO || e.id_proyecto || "") === idProyecto).forEach(e => {
        const material = buscarMaterial(e.CODIGO_MATERIAL || e.codigo_material || "");
        const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
        movimientos.push({
            fecha: e.FECHA || e.fecha || "",
            tipo: "ENTRADA",
            codigo: e.CODIGO_MATERIAL || e.codigo_material || "",
            descripcion: material ? descripcionMaterial(material) : "",
            cantidad: e.CANTIDAD || e.cantidad || 0,
            precio: precio,
            total: (e.CANTIDAD || 0) * precio,
            detalle: e.PROVEEDOR || e.proveedor || ""
        });
    });
    
    consumos.filter(c => (c.ID_PROYECTO || c.id_proyecto || "") === idProyecto).forEach(c => {
        const material = buscarMaterial(c.CODIGO_MATERIAL || c.codigo_material || "");
        const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
        movimientos.push({
            fecha: c.FECHA || c.fecha || "",
            tipo: c.TIPO_USO === "MOVIMIENTO" ? "TRASLADO" : "CONSUMO",
            codigo: c.CODIGO_MATERIAL || c.codigo_material || "",
            descripcion: material ? descripcionMaterial(material) : "",
            cantidad: c.CANTIDAD || c.cantidad || 0,
            precio: precio,
            total: (c.CANTIDAD || 0) * precio,
            detalle: c.OBSERVACION || c.observacion || ""
        });
    });
    
    movimientos.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    
    reporte += "📊 MOVIMIENTOS\n";
    reporte += "----------------------------------------\n";
    reporte += "FECHA | TIPO | MATERIAL | CANTIDAD | PRECIO | TOTAL | DETALLE\n";
    reporte += "----------------------------------------\n";
    
    let totalGeneral = 0;
    movimientos.forEach(m => {
        reporte += `${fechaVisible(m.fecha)} | ${m.tipo} | ${m.descripcion || m.codigo} | ${formatearNumero(m.cantidad)} | ${formatearMoneda(m.precio)} | ${formatearMoneda(m.total)} | ${m.detalle}\n`;
        totalGeneral += m.total;
    });
    
    reporte += "\n----------------------------------------\n";
    reporte += `💰 TOTAL MOVIMIENTOS: ${formatearMoneda(totalGeneral)}\n`;
    reporte += "----------------------------------------\n";
    
    // Resumen del proyecto
    const registros = proyectoMateriales.filter(r => {
        const pid = r.ID_PROYECTO || r.id_proyecto || "";
        return String(pid).trim() === String(idProyecto).trim();
    });
    
    let totalAsignado = 0;
    let totalConsumido = 0;
    let totalCostoAsignado = 0;
    let totalCostoConsumido = 0;
    
    registros.forEach(r => {
        const codigo = r.CODIGO_MATERIAL || r.codigo_material || "";
        const material = buscarMaterial(codigo);
        const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
        const asignado = numero(r.CANTIDAD_ASIGNADA || r.cantidad_asignada || 0);
        const consumido = numero(r.CANTIDAD_CONSUMIDA || r.cantidad_consumida || 0);
        totalAsignado += asignado;
        totalConsumido += consumido;
        totalCostoAsignado += asignado * precio;
        totalCostoConsumido += consumido * precio;
    });
    
    const balance = totalCostoAsignado - totalCostoConsumido;
    
    reporte += "\n📊 RESUMEN ECONÓMICO\n";
    reporte += "----------------------------------------\n";
    reporte += `💰 Costo Asignado: ${formatearMoneda(totalCostoAsignado)}\n`;
    reporte += `🔥 Costo Consumido: ${formatearMoneda(totalCostoConsumido)}\n`;
    reporte += `📊 Balance: ${formatearMoneda(balance)}\n`;
    reporte += `   Estado: ${balance >= 0 ? "✅ Presupuesto OK" : "⚠️ Sobre costo"}\n`;
    reporte += "========================================\n";
    reporte += "📊 FIN DEL REPORTE\n";
    reporte += "========================================\n";
    
    descargarReporte(reporte, `reporte_proyecto_${titulo.replace(/\s/g, "_")}_${new Date().toISOString().slice(0,10)}.txt`);
}

/* =========================================================
   REPORTE: POR TIPO DE MOVIMIENTO
   ========================================================= */

function generarReportePorTipoMovimiento() {
    const tipo = document.getElementById("reporte-tipo-movimiento").value;
    const tipoLabel = tipo || "TODOS";
    
    let reporte = "========================================\n";
    reporte += `📋 REPORTE DE MOVIMIENTOS - ${tipoLabel}\n`;
    reporte += `Fecha: ${fechaActual()}\n`;
    reporte += "========================================\n\n";
    
    const movimientos = [];
    
    entradas.forEach(e => {
        if (!tipo || tipo === "ENTRADA") {
            const material = buscarMaterial(e.CODIGO_MATERIAL || e.codigo_material || "");
            const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
            const proyecto = buscarProyecto(e.ID_PROYECTO || e.id_proyecto || "");
            movimientos.push({
                fecha: e.FECHA || e.fecha || "",
                tipo: "ENTRADA",
                codigo: e.CODIGO_MATERIAL || e.codigo_material || "",
                descripcion: material ? descripcionMaterial(material) : "",
                cantidad: e.CANTIDAD || e.cantidad || 0,
                precio: precio,
                total: (e.CANTIDAD || 0) * precio,
                proyecto: proyecto ? (proyecto.TITULO || proyecto.titulo || "") : "",
                detalle: e.PROVEEDOR || e.proveedor || ""
            });
        }
    });
    
    consumos.forEach(c => {
        const tipoConsumo = c.TIPO_USO === "MOVIMIENTO" ? "TRASLADO" : "CONSUMO";
        if (!tipo || tipo === tipoConsumo || tipo === "CONSUMO") {
            const material = buscarMaterial(c.CODIGO_MATERIAL || c.codigo_material || "");
            const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
            const proyecto = buscarProyecto(c.ID_PROYECTO || c.id_proyecto || "");
            movimientos.push({
                fecha: c.FECHA || c.fecha || "",
                tipo: tipoConsumo,
                codigo: c.CODIGO_MATERIAL || c.codigo_material || "",
                descripcion: material ? descripcionMaterial(material) : "",
                cantidad: c.CANTIDAD || c.cantidad || 0,
                precio: precio,
                total: (c.CANTIDAD || 0) * precio,
                proyecto: proyecto ? (proyecto.TITULO || proyecto.titulo || "") : "",
                detalle: c.OBSERVACION || c.observacion || ""
            });
        }
    });
    
    ajustes.forEach(a => {
        if (!tipo || tipo === "AJUSTE") {
            const material = buscarMaterial(a.CODIGO_MATERIAL || a.codigo_material || "");
            const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
            movimientos.push({
                fecha: a.FECHA || a.fecha || "",
                tipo: "AJUSTE " + (a.TIPO || ""),
                codigo: a.CODIGO_MATERIAL || a.codigo_material || "",
                descripcion: material ? descripcionMaterial(material) : "",
                cantidad: a.CANTIDAD || a.cantidad || 0,
                precio: precio,
                total: (a.CANTIDAD || 0) * precio,
                proyecto: "",
                detalle: a.MOTIVO || a.motivo || ""
            });
        }
    });
    
    movimientos.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    
    reporte += "📊 MOVIMIENTOS\n";
    reporte += "----------------------------------------\n";
    reporte += "FECHA | TIPO | PROYECTO | MATERIAL | CANTIDAD | PRECIO | TOTAL | DETALLE\n";
    reporte += "----------------------------------------\n";
    
    let totalGeneral = 0;
    movimientos.forEach(m => {
        reporte += `${fechaVisible(m.fecha)} | ${m.tipo} | ${m.proyecto || "-"} | ${m.descripcion || m.codigo} | ${formatearNumero(m.cantidad)} | ${formatearMoneda(m.precio)} | ${formatearMoneda(m.total)} | ${m.detalle}\n`;
        totalGeneral += m.total;
    });
    
    reporte += "\n----------------------------------------\n";
    reporte += `💰 TOTAL MOVIMIENTOS: ${formatearMoneda(totalGeneral)}\n`;
    reporte += `📊 Total registros: ${movimientos.length}\n`;
    reporte += "========================================\n";
    reporte += "📊 FIN DEL REPORTE\n";
    reporte += "========================================\n";
    
    descargarReporte(reporte, `reporte_movimientos_${tipoLabel}_${new Date().toISOString().slice(0,10)}.txt`);
}

/* =========================================================
   REPORTE: COMPLETO
   ========================================================= */

function generarReporteCompleto() {
    let reporte = "========================================\n";
    reporte += "📊 REPORTE COMPLETO DE INVENTARIO\n";
    reporte += `Fecha: ${fechaActual()}\n`;
    reporte += "========================================\n\n";
    
    reporte += "📦 INVENTARIO GENERAL\n";
    reporte += "----------------------------------------\n";
    const inventario = obtenerInventario();
    reporte += "CÓDIGO | DESCRIPCIÓN | UNIDAD | STOCK | VALOR\n";
    reporte += "----------------------------------------\n";
    inventario.forEach(i => {
        reporte += `${i.codigo} | ${i.descripcion || "-"} | ${i.unidad || "-"} | ${formatearNumero(i.stock)} | ${formatearMoneda(i.valorStock)}\n`;
    });
    
    reporte += "\n========================================\n";
    reporte += "📊 FIN DEL REPORTE\n";
    reporte += "========================================\n";
    
    descargarReporte(reporte, `reporte_completo_${new Date().toISOString().slice(0,10)}.txt`);
}

/* =========================================================
   FUNCIÓN AUXILIAR PARA DESCARGAR REPORTE
   ========================================================= */

function descargarReporte(texto, nombreArchivo) {
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`✅ Reporte "${nombreArchivo}" descargado correctamente.`);
}
/* =========================================================
   REPORTES AVANZADOS EN EXCEL
   ========================================================= */

function mostrarReportes() {
    const selectProyecto = document.getElementById("reporte-proyecto");
    if (selectProyecto) {
        selectProyecto.innerHTML = '<option value="">Seleccione un proyecto</option>';
        proyectos.forEach(p => {
            const id = p.ID_PROYECTO || p.ID || p.id || "";
            const titulo = p.TITULO || p.titulo || "";
            const solped = p.SOLPED || p.solped || "";
            if (id) {
                const option = document.createElement("option");
                option.value = id;
                option.textContent = `${titulo} - SOLPED: ${solped}`;
                selectProyecto.appendChild(option);
            }
        });
    }
    
    document.getElementById("modal-reportes").style.display = "flex";
    
    document.getElementById("reporte-tipo").onchange = function() {
        const val = this.value;
        document.getElementById("contenedor-select-proyecto").style.display = val === "proyecto" ? "block" : "none";
        document.getElementById("contenedor-select-tipo").style.display = val === "movimientos" ? "block" : "none";
    };
}

function cerrarReportes() {
    document.getElementById("modal-reportes").style.display = "none";
}

function generarReporte() {
    const tipo = document.getElementById("reporte-tipo").value;
    
    if (tipo === "resumen") {
        generarResumenEjecutivoExcel();
    } else if (tipo === "proyecto") {
        generarReportePorProyectoExcel();
    } else if (tipo === "movimientos") {
        generarReportePorTipoMovimientoExcel();
    } else if (tipo === "completo") {
        generarReporteCompletoExcel();
    }
    
    cerrarReportes();
}

/* =========================================================
   REPORTE: RESUMEN EJECUTIVO EN EXCEL
   ========================================================= */

function generarResumenEjecutivoExcel() {
    try {
        const wb = XLSX.utils.book_new();
        const datos = [];
        
        // Encabezados
        datos.push(['PROYECTO', 'SOLPED', 'MATERIALES', 'ASIGNADO', 'CONSUMIDO', 'DISPONIBLE', 'COSTO ASIGNADO', 'COSTO CONSUMIDO', 'BALANCE', 'ESTADO']);
        
        proyectos.forEach(p => {
            const id = p.ID_PROYECTO || p.ID || p.id || "";
            const titulo = p.TITULO || p.titulo || "";
            const solped = p.SOLPED || p.solped || "";
            
            const registros = proyectoMateriales.filter(r => {
                const pid = r.ID_PROYECTO || r.id_proyecto || "";
                return String(pid).trim() === String(id).trim();
            });
            
            let totalAsignado = 0;
            let totalConsumido = 0;
            let totalCostoAsignado = 0;
            let totalCostoConsumido = 0;
            
            registros.forEach(r => {
                const codigo = r.CODIGO_MATERIAL || r.codigo_material || "";
                const material = buscarMaterial(codigo);
                const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
                const asignado = numero(r.CANTIDAD_ASIGNADA || r.cantidad_asignada || 0);
                const consumido = numero(r.CANTIDAD_CONSUMIDA || r.cantidad_consumida || 0);
                totalAsignado += asignado;
                totalConsumido += consumido;
                totalCostoAsignado += asignado * precio;
                totalCostoConsumido += consumido * precio;
            });
            
            const disponible = totalAsignado - totalConsumido;
            const balance = totalCostoAsignado - totalCostoConsumido;
            
            datos.push([
                titulo,
                solped,
                registros.length,
                totalAsignado,
                totalConsumido,
                disponible,
                totalCostoAsignado,
                totalCostoConsumido,
                balance,
                balance >= 0 ? '✅ OK' : '⚠️ SOBRE COSTO'
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(datos);
        XLSX.utils.book_append_sheet(wb, ws, 'RESUMEN EJECUTIVO');
        XLSX.writeFile(wb, `resumen_ejecutivo_${new Date().toISOString().slice(0,10)}.xlsx`);
        alert('✅ Reporte Excel descargado correctamente.');
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

/* =========================================================
   REPORTE: POR PROYECTO EN EXCEL
   ========================================================= */

function generarReportePorProyectoExcel() {
    const idProyecto = document.getElementById("reporte-proyecto").value;
    if (!idProyecto) {
        alert("Seleccione un proyecto.");
        return;
    }
    
    const proyecto = buscarProyecto(idProyecto);
    if (!proyecto) {
        alert("No se encontró el proyecto.");
        return;
    }
    
    try {
        const wb = XLSX.utils.book_new();
        const datos = [];
        
        const titulo = proyecto.TITULO || proyecto.titulo || "";
        const solped = proyecto.SOLPED || proyecto.solped || "";
        
        // Hoja de Movimientos
        datos.push(['FECHA', 'TIPO', 'CÓDIGO', 'MATERIAL', 'CANTIDAD', 'PRECIO', 'TOTAL', 'DETALLE']);
        
        entradas.filter(e => (e.ID_PROYECTO || e.id_proyecto || "") === idProyecto).forEach(e => {
            const material = buscarMaterial(e.CODIGO_MATERIAL || e.codigo_material || "");
            const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
            datos.push([
                e.FECHA || e.fecha || '',
                'ENTRADA',
                e.CODIGO_MATERIAL || e.codigo_material || '',
                material ? descripcionMaterial(material) : '',
                e.CANTIDAD || e.cantidad || 0,
                precio,
                (e.CANTIDAD || 0) * precio,
                e.PROVEEDOR || e.proveedor || ''
            ]);
        });
        
        consumos.filter(c => (c.ID_PROYECTO || c.id_proyecto || "") === idProyecto).forEach(c => {
            const material = buscarMaterial(c.CODIGO_MATERIAL || c.codigo_material || "");
            const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
            datos.push([
                c.FECHA || c.fecha || '',
                c.TIPO_USO === "MOVIMIENTO" ? 'TRASLADO' : 'CONSUMO',
                c.CODIGO_MATERIAL || c.codigo_material || '',
                material ? descripcionMaterial(material) : '',
                c.CANTIDAD || c.cantidad || 0,
                precio,
                (c.CANTIDAD || 0) * precio,
                c.OBSERVACION || c.observacion || ''
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(datos);
        XLSX.utils.book_append_sheet(wb, ws, 'MOVIMIENTOS');
        
        // Hoja de Resumen
        const registros = proyectoMateriales.filter(r => {
            const pid = r.ID_PROYECTO || r.id_proyecto || "";
            return String(pid).trim() === String(idProyecto).trim();
        });
        
        let totalAsignado = 0;
        let totalConsumido = 0;
        let totalCostoAsignado = 0;
        let totalCostoConsumido = 0;
        
        const resumen = [['MATERIAL', 'ASIGNADO', 'CONSUMIDO', 'DISPONIBLE', 'PRECIO', 'COSTO ASIGNADO', 'COSTO CONSUMIDO']];
        
        registros.forEach(r => {
            const codigo = r.CODIGO_MATERIAL || r.codigo_material || "";
            const material = buscarMaterial(codigo);
            const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
            const asignado = numero(r.CANTIDAD_ASIGNADA || r.cantidad_asignada || 0);
            const consumido = numero(r.CANTIDAD_CONSUMIDA || r.cantidad_consumida || 0);
            const disponible = asignado - consumido;
            totalAsignado += asignado;
            totalConsumido += consumido;
            totalCostoAsignado += asignado * precio;
            totalCostoConsumido += consumido * precio;
            
            resumen.push([
                material ? descripcionMaterial(material) : codigo,
                asignado,
                consumido,
                disponible,
                precio,
                asignado * precio,
                consumido * precio
            ]);
        });
        
        const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
        XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN');
        
        XLSX.writeFile(wb, `reporte_proyecto_${titulo.replace(/\s/g, "_")}_${new Date().toISOString().slice(0,10)}.xlsx`);
        alert('✅ Reporte Excel descargado correctamente.');
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

/* =========================================================
   REPORTE: POR TIPO DE MOVIMIENTO EN EXCEL
   ========================================================= */

function generarReportePorTipoMovimientoExcel() {
    const tipo = document.getElementById("reporte-tipo-movimiento").value;
    const tipoLabel = tipo || "TODOS";
    
    try {
        const wb = XLSX.utils.book_new();
        const datos = [];
        
        datos.push(['FECHA', 'TIPO', 'PROYECTO', 'MATERIAL', 'CANTIDAD', 'PRECIO', 'TOTAL', 'DETALLE']);
        
        entradas.forEach(e => {
            if (!tipo || tipo === "ENTRADA") {
                const material = buscarMaterial(e.CODIGO_MATERIAL || e.codigo_material || "");
                const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
                const proyecto = buscarProyecto(e.ID_PROYECTO || e.id_proyecto || "");
                datos.push([
                    e.FECHA || e.fecha || '',
                    'ENTRADA',
                    proyecto ? (proyecto.TITULO || proyecto.titulo || '') : '',
                    material ? descripcionMaterial(material) : '',
                    e.CANTIDAD || e.cantidad || 0,
                    precio,
                    (e.CANTIDAD || 0) * precio,
                    e.PROVEEDOR || e.proveedor || ''
                ]);
            }
        });
        
        consumos.forEach(c => {
            const tipoConsumo = c.TIPO_USO === "MOVIMIENTO" ? "TRASLADO" : "CONSUMO";
            if (!tipo || tipo === tipoConsumo || tipo === "CONSUMO") {
                const material = buscarMaterial(c.CODIGO_MATERIAL || c.codigo_material || "");
                const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
                const proyecto = buscarProyecto(c.ID_PROYECTO || c.id_proyecto || "");
                datos.push([
                    c.FECHA || c.fecha || '',
                    tipoConsumo,
                    proyecto ? (proyecto.TITULO || proyecto.titulo || '') : '',
                    material ? descripcionMaterial(material) : '',
                    c.CANTIDAD || c.cantidad || 0,
                    precio,
                    (c.CANTIDAD || 0) * precio,
                    c.OBSERVACION || c.observacion || ''
                ]);
            }
        });
        
        ajustes.forEach(a => {
            if (!tipo || tipo === "AJUSTE") {
                const material = buscarMaterial(a.CODIGO_MATERIAL || a.codigo_material || "");
                const precio = material ? numero(obtenerCampo(material, "PRECIO_UNITARIO")) : 0;
                datos.push([
                    a.FECHA || a.fecha || '',
                    'AJUSTE ' + (a.TIPO || ''),
                    '',
                    material ? descripcionMaterial(material) : '',
                    a.CANTIDAD || a.cantidad || 0,
                    precio,
                    (a.CANTIDAD || 0) * precio,
                    a.MOTIVO || a.motivo || ''
                ]);
            }
        });
        
        const ws = XLSX.utils.aoa_to_sheet(datos);
        XLSX.utils.book_append_sheet(wb, ws, `MOVIMIENTOS_${tipoLabel}`);
        XLSX.writeFile(wb, `reporte_movimientos_${tipoLabel}_${new Date().toISOString().slice(0,10)}.xlsx`);
        alert('✅ Reporte Excel descargado correctamente.');
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

/* =========================================================
   REPORTE: COMPLETO EN EXCEL
   ========================================================= */

function generarReporteCompletoExcel() {
    try {
        const wb = XLSX.utils.book_new();
        const datos = [];
        
        datos.push(['CÓDIGO', 'DESCRIPCIÓN', 'UNIDAD', 'ENTRADAS', 'CONSUMOS', 'AJUSTES', 'STOCK', 'ESTADO', 'VALOR STOCK']);
        
        const inventario = obtenerInventario();
        inventario.forEach(i => {
            datos.push([
                i.codigo || '',
                i.descripcion || '',
                i.unidad || '',
                i.entradas || 0,
                i.consumos || 0,
                i.ajustes || 0,
                i.stock || 0,
                i.estado || '',
                i.valorStock || 0
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(datos);
        XLSX.utils.book_append_sheet(wb, ws, 'INVENTARIO COMPLETO');
        XLSX.writeFile(wb, `reporte_completo_${new Date().toISOString().slice(0,10)}.xlsx`);
        alert('✅ Reporte Excel descargado correctamente.');
    } catch (error) {
     alert('❌ Error: ' + error.message);
    }
}
/* =========================================================
   FIN DEL SCRIPT
   ========================================================= */
