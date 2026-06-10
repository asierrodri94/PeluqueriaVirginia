import { useState, useEffect } from "react";
import { api } from "../api";
import toast from "react-hot-toast";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function FacturaModal({ factura, mesActual, anyoActual, seccion, onClose, onSaved }) {
  const esNueva = !factura;

  const [fecha, setFecha] = useState(today());
  const [nombre, setNombre] = useState("");
  const [cobrado, setCobrado] = useState(false);
  const [catalogo, setCatalogo] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.getServicios().then(setCatalogo).catch(() => {});
    if (!esNueva) {
      const mes = String(factura.mes).padStart(2, "0");
      const dia = String(factura.dia).padStart(2, "0");
      setFecha(`${factura.anyo}-${mes}-${dia}`);
      setNombre(factura.nombre);
      setCobrado(factura.cobrado);
      api.getServiciosFactura(factura.numFactura, mesActual, anyoActual, seccion)
        .then(setLineas)
        .catch(() => {});
    }
  }, []);

  const toggleServicio = (srv) => {
    setLineas((prev) => {
      const exists = prev.find((l) => l.tipoServicio === srv.tipoServicio);
      if (exists) return prev.filter((l) => l.tipoServicio !== srv.tipoServicio);
      return [...prev, { tipoServicio: srv.tipoServicio, precioServicio: srv.precioServicio }];
    });
  };

  const updatePrecio = (tipo, precio) => {
    setLineas((prev) =>
      prev.map((l) => (l.tipoServicio === tipo ? { ...l, precioServicio: parseFloat(precio) || 0 } : l))
    );
  };

  const total = lineas.reduce((s, l) => s + (l.precioServicio || 0), 0);

  const guardar = async () => {
    if (!nombre.trim()) { toast.error("Introduce el nombre del cliente"); return; }
    if (lineas.length === 0) { toast.error("Selecciona al menos un servicio"); return; }
    if (lineas.some((l) => !l.precioServicio || l.precioServicio <= 0)) {
      toast.error("El precio de todos los servicios debe ser mayor que 0"); return;
    }

    const [anyo, mes, dia] = fecha.split("-").map(Number);
    const data = { dia, mes, anyo, nombre: nombre.trim(), servicios: lineas, cobrado };

    setGuardando(true);
    try {
      if (esNueva) {
        await api.crearFactura(data, seccion);
        toast.success("Factura creada");
      } else {
        await api.actualizarFactura(factura.numFactura, data, mesActual, anyoActual, seccion);
        toast.success("Factura actualizada");
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {esNueva ? "Nueva factura" : `Editar factura #${factura.numFactura}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cliente</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre..."
                className="input uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Servicios realizados</label>
            <div className="grid grid-cols-2 gap-1.5">
              {catalogo.map((srv) => {
                const linea = lineas.find((l) => l.tipoServicio === srv.tipoServicio);
                const seleccionado = !!linea;
                return (
                  <div
                    key={srv.tipoServicio}
                    onClick={() => toggleServicio(srv)}
                    className={`flex flex-col gap-1 p-2 rounded-lg border cursor-pointer transition-colors ${
                      seleccionado
                        ? "bg-rose-50 border-rose-400 text-rose-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-rose-200"
                    }`}
                  >
                    <span className="text-xs font-medium leading-tight break-words">{srv.tipoServicio}</span>
                    {seleccionado ? (
                      <input
                        type="number"
                        step="0.01"
                        value={linea.precioServicio}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updatePrecio(srv.tipoServicio, e.target.value)}
                        className="w-full text-right border border-rose-300 rounded px-1 py-0.5 text-xs bg-white"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">{srv.precioServicio.toFixed(2)} €</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Servicios de la factura que ya no están en el catálogo */}
            {lineas.filter((l) => !catalogo.find((s) => s.tipoServicio === l.tipoServicio)).length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-amber-600 font-medium mb-1.5">⚠ Servicios eliminados del catálogo</p>
                <div className="flex flex-col gap-1.5">
                  {lineas
                    .filter((l) => !catalogo.find((s) => s.tipoServicio === l.tipoServicio))
                    .map((l) => (
                      <div key={l.tipoServicio} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50">
                        <span className="text-xs font-medium text-amber-800 flex-1 break-words">{l.tipoServicio}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={l.precioServicio}
                          onChange={(e) => updatePrecio(l.tipoServicio, e.target.value)}
                          className="w-20 text-right border border-amber-300 rounded px-1 py-0.5 text-xs bg-white shrink-0"
                        />
                        <button
                          onClick={() => setLineas((prev) => prev.filter((x) => x.tipoServicio !== l.tipoServicio))}
                          className="text-red-400 hover:text-red-600 text-sm shrink-0"
                          title="Quitar servicio"
                        >✕</button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cobrado}
                onChange={(e) => setCobrado(e.target.checked)}
                className="w-4 h-4 accent-rose-600"
              />
              <span className="text-sm font-medium text-gray-700">Cobrado</span>
            </label>
            <div className="text-right">
              <span className="text-xs text-gray-400">Total</span>
              <p className="text-xl font-bold text-rose-600">{total.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="btn-primary">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
