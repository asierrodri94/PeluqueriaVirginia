import { useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";

const defaultFecha = (mesActual, anyoActual) => {
  const hoy = new Date();
  const diasEnMes = new Date(anyoActual, mesActual, 0).getDate();
  const dia = Math.min(hoy.getDate(), diasEnMes);
  return `${anyoActual}-${String(mesActual).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
};

export default function CompraModal({ compra, mesActual, anyoActual, onClose, onSaved }) {
  const esNueva = !compra;

  const initFecha = () => {
    if (!esNueva) {
      return `${compra.anyo}-${String(compra.mes).padStart(2, "0")}-${String(compra.dia).padStart(2, "0")}`;
    }
    return defaultFecha(mesActual, anyoActual);
  };

  const [fecha, setFecha] = useState(initFecha);
  const [descripcion, setDescripcion] = useState(compra?.descripcion ?? "");
  const [importe, setImporte] = useState(compra?.importe ?? "");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!descripcion.trim()) { toast.error("Introduce una descripción"); return; }
    if (!importe || isNaN(importe) || parseFloat(importe) <= 0) { toast.error("Introduce un importe válido mayor que 0"); return; }

    const [anyo, mes, dia] = fecha.split("-").map(Number);
    const data = { dia, mes, anyo, descripcion: descripcion.trim(), importe: parseFloat(importe) };

    setGuardando(true);
    try {
      if (esNueva) {
        await api.crearCompra(data);
        toast.success("Compra registrada");
      } else {
        await api.actualizarCompra(compra.numCompra, data, compra.dia, mesActual, anyoActual);
        toast.success("Compra actualizada");
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {esNueva ? "Nueva compra" : `Editar compra #${compra.numCompra}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de la compra..."
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Importe (€)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              placeholder="0.00"
              className="input"
            />
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
