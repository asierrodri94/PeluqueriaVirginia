import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import CompraModal from "../components/CompraModal";
import toast from "react-hot-toast";

const MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
               "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const TRIMESTRE_LABEL = (mes) => {
  const t = Math.ceil(mes / 3);
  const nombres = ["", "1er", "2º", "3er", "4º"];
  return `${nombres[t]} Trim.`;
};

const fmt = (n) => n.toFixed(2).replace(".", ",") + " €";

export default function Compras({ mes, anyo, cambiarMes }) {
  const [compras, setCompras] = useState([]);
  const [resumen, setResumen] = useState({ total_compras: 0, total_importe: 0 });
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState(null); // null | "nueva" | compraObj
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [cs, r] = await Promise.all([
        api.getCompras(mes, anyo),
        api.getResumenCompras(mes, anyo),
      ]);
      setCompras(cs);
      setResumen(r);
    } catch {
      toast.error("Error al cargar compras");
    } finally {
      setCargando(false);
    }
  }, [mes, anyo]);

  useEffect(() => { cargar(); }, [cargar]);


  const eliminar = async (c) => {
    const scrollY = window.scrollY;
    try {
      await api.eliminarCompra(c.numCompra, c.dia, mes, anyo);
      toast.success("Compra eliminada");
      await cargar();
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConfirmEliminar(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
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
            <p className="text-2xl font-bold text-rose-600">{resumen.total_compras}</p>
            <p className="text-xs text-gray-400">Compras</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{fmt(resumen.total_importe)}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => api.exportarTrimestreCompras(mes, anyo)} className="btn-secondary text-sm">
            ⬇ Excel {TRIMESTRE_LABEL(mes)}
          </button>
          <button onClick={() => setModal("nueva")} className="btn-primary text-sm">
            + Nueva compra
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        {cargando ? (
          <div className="py-16 text-center text-gray-400">Cargando...</div>
        ) : compras.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-2">🛒</p>
            <p>No hay compras en {MESES[mes]} {anyo}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-500">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Descripción</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-500">Importe</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.numCompra} className="border-b border-gray-100 table-row-hover">
                  <td className="px-4 py-2.5 text-gray-400 font-mono">{c.numCompra}</td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {String(c.dia).padStart(2, "0")}/{String(c.mes).padStart(2, "0")}/{c.anyo}
                  </td>
                  <td className="px-4 py-2.5 text-gray-800">{c.descripcion}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{fmt(c.importe)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => setModal(c)}
                        className="px-2.5 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmEliminar(c)}
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

      {modal && (
        <CompraModal
          compra={modal === "nueva" ? null : modal}
          mesActual={mes}
          anyoActual={anyo}
          onClose={() => setModal(null)}
          onSaved={cargar}
        />
      )}

      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">¿Eliminar compra?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Se eliminará <strong>{confirmEliminar.descripcion}</strong> ({fmt(confirmEliminar.importe)}).
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
