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
  getServiciosFactura: (num, mes, anyo, seccion) =>
    req("GET", `/facturas/${num}/servicios?mes=${mes}&anyo=${anyo}&seccion=${seccion}`),
  crearFactura: (data, seccion) =>
    req("POST", `/facturas?seccion=${seccion}`, data),
  actualizarFactura: (num, data, mesOriginal, anyoOriginal, seccion) =>
    req("PUT", `/facturas/${num}?mes_original=${mesOriginal}&anyo_original=${anyoOriginal}&seccion=${seccion}`, data),
  toggleCobrado: (num, mes, anyo, cobrado, seccion) =>
    req("PATCH", `/facturas/${num}/cobrado?mes=${mes}&anyo=${anyo}&cobrado=${cobrado}&seccion=${seccion}`),
  eliminarFactura: (num, mes, anyo, seccion) =>
    req("DELETE", `/facturas/${num}?mes=${mes}&anyo=${anyo}&seccion=${seccion}`),

  // Servicios
  getServicios: () => req("GET", "/servicios"),
  crearServicio: (data) => req("POST", "/servicios", data),
  actualizarServicio: (tipo, data) => req("PUT", `/servicios/${encodeURIComponent(tipo)}`, data),
  eliminarServicio: (tipo) => req("DELETE", `/servicios/${encodeURIComponent(tipo)}`),

  // Export
  exportarTrimestre: (mes, anyo, seccion) => {
    window.open(`${BASE}/export/trimestre?mes=${mes}&anyo=${anyo}&seccion=${seccion}`, "_blank");
  },
};
