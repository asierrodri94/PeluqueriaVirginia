import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import FacturaModal from "../components/FacturaModal";
import toast from "react-hot-toast";

const MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
               "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const TRIMESTRE_LABEL = (mes) => {
  const t = Math.ceil(mes / 3);
  const nombres = ["", "1er", "2º", "3er", "4º"];
  return `${nombres[t]} Trim.`;
};

const fmt = (n) => n.toFixed(2).replace(".", ",") + " €";

export default function Inicio({ seccion }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anyo, setAnyo] = useState(hoy.getFullYear());
  const [facturas, setFacturas] = useState([]);
  const [resumen, setResumen] = useState({ total_personas: 0, total_importe: 0, total_cobrado: 0 });
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState(null); // null | "nueva" | facturaObj
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [fs, r] = await Promise.all([
        api.getFacturas(mes, anyo, seccion),
        api.getResumen(mes, anyo, seccion),
      ]);
      setFacturas(fs);
      setResumen(r);
    } catch (e) {
      toast.error("Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }, [mes, anyo, seccion]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarMes = (delta) => {
    setMes((m) => {
      const nuevo = m + delta;
      if (nuevo < 1) { setAnyo((a) => a - 1); return 12; }
      if (nuevo > 12) { setAnyo((a) => a + 1); return 1; }
      return nuevo;
    });
  };

  const toggleCobrado = async (f) => {
    try {
      await api.toggleCobrado(f.numFactura, mes, anyo, !f.cobrado, seccion);
      setFacturas((prev) =>
        prev.map((x) => x.numFactura === f.numFactura ? { ...x, cobrado: !f.cobrado } : x)
      );
      setResumen((r) => ({
        ...r,
        total_cobrado: r.total_cobrado + (f.cobrado ? -f.importe : f.importe),
      }));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const eliminar = async (f) => {
    const scrollY = window.scrollY;
    try {
      await api.eliminarFactura(f.numFactura, mes, anyo, seccion);
      toast.success("Factura eliminada");
      await cargar();
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConfirmEliminar(null);
    }
  };

  const pendiente = resumen.total_importe - resumen.total_cobrado;

  return (
    <div className="space-y-4">
      {/* Cabecera mes + resumen */}
      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => cambiarMes(-1)} className="btn-ghost text-xl px-2">‹</button>
          <div className="text-center min-w-[140px]">
            <p className="text-lg font-bold text-gray-800">{MESES[mes]} {anyo}</p>
          </div>
          <button onClick={() => cambiarMes(1)} className="btn-ghost text-xl px-2">›</button>
        </div>

        <div className="flex gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-rose-600">{resumen.total_personas}</p>
            <p className="text-xs text-gray-400">Personas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{fmt(resumen.total_importe)}</p>
            <p className="text-xs text-gray-400">Facturado</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{fmt(resumen.total_cobrado)}</p>
            <p className="text-xs text-gray-400">Cobrado</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{fmt(pendiente)}</p>
            <p className="text-xs text-gray-400">Pendiente</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => api.exportarTrimestre(mes, anyo, seccion)} className="btn-secondary text-sm">
            ⬇ Excel {TRIMESTRE_LABEL(mes)}
          </button>
          <button onClick={() => setModal("nueva")} className="btn-primary text-sm">
            + Nueva factura
          </button>
        </div>
      </div>

      {/* Tabla de facturas */}
      <div className="card p-0 overflow-hidden">
        {cargando ? (
          <div className="py-16 text-center text-gray-400">Cargando...</div>
        ) : facturas.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-2">✂️</p>
            <p>No hay facturas en {MESES[mes]} {anyo}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-500">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Cliente</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-500">Importe</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-500">Cobrado</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.numFactura} className="border-b border-gray-100 table-row-hover">
                  <td className="px-4 py-2.5 text-gray-400 font-mono">{f.numFactura}</td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {String(f.dia).padStart(2, "0")}/{String(f.mes).padStart(2, "0")}/{f.anyo}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{f.nombre}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{fmt(f.importe)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => toggleCobrado(f)}
                      className={`w-8 h-8 rounded-full text-base transition-colors ${
                        f.cobrado
                          ? "bg-green-100 text-green-600 hover:bg-green-200"
                          : "bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-500"
                      }`}
                      title={f.cobrado ? "Marcar como pendiente" : "Marcar como cobrado"}
                    >
                      {f.cobrado ? "✓" : "○"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => setModal(f)}
                        className="px-2.5 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmEliminar(f)}
                        className="px-2.5 py-1 text-xs rounded bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nueva / editar */}
      {modal && (
        <FacturaModal
          factura={modal === "nueva" ? null : modal}
          mesActual={mes}
          anyoActual={anyo}
          seccion={seccion}
          onClose={() => setModal(null)}
          onSaved={cargar}
        />
      )}

      {/* Confirm eliminar */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">¿Eliminar factura?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Se eliminará la factura #{confirmEliminar.numFactura} de{" "}
              <strong>{confirmEliminar.nombre}</strong> ({fmt(confirmEliminar.importe)}).
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmEliminar(null)} className="btn-secondary">Cancelar</button>
              <button onClick={() => eliminar(confirmEliminar)} className="btn-danger">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
