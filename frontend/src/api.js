const BASE = "/api";

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail || "Error en la petición");
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Facturas
  getFacturas: (mes, anyo, seccion) =>
    req("GET", `/facturas?mes=${mes}&anyo=${anyo}&seccion=${seccion}`),
  getResumen: (mes, anyo, seccion) =>
    req("GET", `/facturas/resumen?mes=${mes}&anyo=${anyo}&seccion=${seccion}`),
  getServiciosFactura: (num, dia, mes, anyo, seccion) =>
    req("GET", `/facturas/${num}/servicios?dia=${dia}&mes=${mes}&anyo=${anyo}&seccion=${seccion}`),
  crearFactura: (data, seccion) =>
    req("POST", `/facturas?seccion=${seccion}`, data),
  actualizarFactura: (num, data, diaOriginal, mesOriginal, anyoOriginal, seccion) =>
    req("PUT", `/facturas/${num}?dia_original=${diaOriginal}&mes_original=${mesOriginal}&anyo_original=${anyoOriginal}&seccion=${seccion}`, data),
  toggleCobrado: (num, dia, mes, anyo, cobrado, seccion) =>
    req("PATCH", `/facturas/${num}/cobrado?dia=${dia}&mes=${mes}&anyo=${anyo}&cobrado=${cobrado}&seccion=${seccion}`),
  eliminarFactura: (num, dia, mes, anyo, seccion) =>
    req("DELETE", `/facturas/${num}?dia=${dia}&mes=${mes}&anyo=${anyo}&seccion=${seccion}`),
  reordenarFacturas: (mes, anyo, cambios, seccion) =>
    req("POST", `/facturas/reordenar?mes=${mes}&anyo=${anyo}&seccion=${seccion}`, cambios),

  // Servicios
  getServicios: () => req("GET", "/servicios"),
  crearServicio: (data) => req("POST", "/servicios", data),
  actualizarServicio: (tipo, data) => req("PUT", `/servicios/${encodeURIComponent(tipo)}`, data),
  eliminarServicio: (tipo) => req("DELETE", `/servicios/${encodeURIComponent(tipo)}`),

  // Compras
  getCompras: (mes, anyo) =>
    req("GET", `/compras?mes=${mes}&anyo=${anyo}`),
  getResumenCompras: (mes, anyo) =>
    req("GET", `/compras/resumen?mes=${mes}&anyo=${anyo}`),
  crearCompra: (data) =>
    req("POST", `/compras`, data),
  actualizarCompra: (num, data, diaOriginal, mesOriginal, anyoOriginal) =>
    req("PUT", `/compras/${num}?dia_original=${diaOriginal}&mes_original=${mesOriginal}&anyo_original=${anyoOriginal}`, data),
  eliminarCompra: (num, dia, mes, anyo) =>
    req("DELETE", `/compras/${num}?dia=${dia}&mes=${mes}&anyo=${anyo}`),

  // Export
  exportarTrimestre: (mes, anyo, seccion) => {
    window.open(`${BASE}/export/trimestre?mes=${mes}&anyo=${anyo}&seccion=${seccion}`, "_blank");
  },
  exportarTrimestreCompras: (mes, anyo) => {
    window.open(`${BASE}/export/trimestre/compras?mes=${mes}&anyo=${anyo}`, "_blank");
  },
};
