import { useState, useEffect } from "react";
import { api } from "../api";
import toast from "react-hot-toast";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [nuevo, setNuevo] = useState({ tipoServicio: "", precioServicio: "" });
  const [editando, setEditando] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = () => api.getServicios().then(setServicios).catch(() => toast.error("Error al cargar servicios"));

  useEffect(() => { cargar(); }, []);

  const crear = async () => {
    if (!nuevo.tipoServicio.trim()) { toast.error("Introduce el nombre del servicio"); return; }
    if (!nuevo.precioServicio || isNaN(nuevo.precioServicio)) { toast.error("Introduce un precio válido"); return; }
    try {
      await api.crearServicio({ tipoServicio: nuevo.tipoServicio.trim().toUpperCase(), precioServicio: parseFloat(nuevo.precioServicio) });
      toast.success("Servicio añadido");
      setNuevo({ tipoServicio: "", precioServicio: "" });
      cargar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const guardarEdicion = async (tipoOriginal) => {
    try {
      await api.actualizarServicio(tipoOriginal, {
        tipoServicio: editando.tipoServicio.trim().toUpperCase(),
        precioServicio: parseFloat(editando.precioServicio),
      });
      toast.success("Servicio actualizado");
      setEditando(null);
      cargar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const eliminar = async (tipo) => {
    try {
      await api.eliminarServicio(tipo);
      toast.success("Servicio eliminado");
      cargar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConfirmEliminar(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Catálogo de servicios</h2>

      {/* Añadir nuevo */}
      <div className="card flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
          <input
            type="text"
            value={nuevo.tipoServicio}
            onChange={(e) => setNuevo((p) => ({ ...p, tipoServicio: e.target.value }))}
            placeholder="Nombre del servicio..."
            className="input uppercase"
            onKeyDown={(e) => e.key === "Enter" && crear()}
          />
        </div>
        <div className="w-32">
          <label className="block text-xs font-medium text-gray-500 mb-1">Precio (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={nuevo.precioServicio}
            onChange={(e) => setNuevo((p) => ({ ...p, precioServicio: e.target.value }))}
            placeholder="0.00"
            className="input"
            onKeyDown={(e) => e.key === "Enter" && crear()}
          />
        </div>
        <button onClick={crear} className="btn-primary">Añadir</button>
      </div>

      {/* Lista */}
      <div className="card p-0 overflow-hidden">
        {servicios.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No hay servicios registrados</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Servicio</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-500">Precio base</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => (
                <tr key={s.tipoServicio} className="border-b border-gray-100 table-row-hover">
                  {editando?.tipoOriginal === s.tipoServicio ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editando.tipoServicio}
                          onChange={(e) => setEditando((p) => ({ ...p, tipoServicio: e.target.value }))}
                          className="input uppercase"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editando.precioServicio}
                          onChange={(e) => setEditando((p) => ({ ...p, precioServicio: e.target.value }))}
                          className="input text-right"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => guardarEdicion(s.tipoServicio)} className="px-2.5 py-1 text-xs rounded bg-green-50 text-green-600 hover:bg-green-100">Guardar</button>
                          <button onClick={() => setEditando(null)} className="px-2.5 py-1 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200">Cancelar</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.tipoServicio}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{s.precioServicio.toFixed(2)} €</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => setEditando({ tipoOriginal: s.tipoServicio, tipoServicio: s.tipoServicio, precioServicio: s.precioServicio })}
                            className="px-2.5 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmEliminar(s)}
                            className="px-2.5 py-1 text-xs rounded bg-red-50 text-red-500 hover:bg-red-100"
                          >
                            Borrar
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">¿Eliminar servicio?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Se eliminará <strong>{confirmEliminar.tipoServicio}</strong> del catálogo.
              Las facturas existentes no se verán afectadas.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmEliminar(null)} className="btn-secondary">Cancelar</button>
              <button onClick={() => eliminar(confirmEliminar.tipoServicio)} className="btn-danger">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
