import { useState } from "react";
import Inicio from "./pages/Inicio";
import Servicios from "./pages/Servicios";
import Compras from "./pages/Compras";
import toast from "react-hot-toast";

const PAGES = { inicio: "inicio", compras: "compras", servicios: "servicios" };

export default function App() {
  const [page, setPage] = useState(() => localStorage.getItem("page") || PAGES.inicio);
  const [seccion, setSeccion] = useState(() => localStorage.getItem("seccion") || "A");
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anyo, setAnyo] = useState(hoy.getFullYear());

  const cambiarMes = (delta) => {
    setMes((m) => {
      const nuevo = m + delta;
      if (nuevo < 1) { setAnyo((a) => a - 1); return 12; }
      if (nuevo > 12) { setAnyo((a) => a + 1); return 1; }
      return nuevo;
    });
  };
  const [confirmCerrar, setConfirmCerrar] = useState(false);

  const cerrarPrograma = async () => {
    await fetch("/api/shutdown", { method: "POST" });
    document.body.innerHTML = "<div style='font-family:sans-serif;text-align:center;padding-top:80px'><h1 style='font-size:2.5rem'>✅ Programa cerrado</h1><p style='font-size:1.3rem;color:#666'>Puedes cerrar esta pestaña.</p></div>";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-rose-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✂️</span>
            <h1 className="text-xl font-bold tracking-wide">Peluquería Virginia</h1>
          </div>
          <nav className="flex items-center gap-2">
            <button
              onClick={() => { setPage(PAGES.inicio); localStorage.setItem("page", PAGES.inicio); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === PAGES.inicio ? "bg-white text-rose-600" : "text-white hover:bg-rose-500"
              }`}
            >
              Facturas
            </button>
            <button
              onClick={() => { setPage(PAGES.compras); localStorage.setItem("page", PAGES.compras); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === PAGES.compras ? "bg-white text-rose-600" : "text-white hover:bg-rose-500"
              }`}
            >
              Compras
            </button>
            <button
              onClick={() => { setPage(PAGES.servicios); localStorage.setItem("page", PAGES.servicios); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === PAGES.servicios ? "bg-white text-rose-600" : "text-white hover:bg-rose-500"
              }`}
            >
              Servicios
            </button>
            <div className="ml-4 flex items-center gap-1 bg-rose-700 rounded-lg p-1">
              {["A", "B"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setSeccion(s); localStorage.setItem("seccion", s); }}
                  className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${
                    seccion === s ? "bg-white text-rose-600" : "text-white hover:bg-rose-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setConfirmCerrar(true)}
              className="ml-4 px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-800 text-rose-200 hover:bg-rose-900 transition-colors"
            >
              ⏻ Cerrar
            </button>
          </nav>
        </div>
      </header>

      {confirmCerrar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">¿Cerrar el programa?</h3>
            <p className="text-sm text-gray-500 mb-4">Se cerrará el servidor. Podrás cerrar esta pestaña después.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmCerrar(false)} className="btn-secondary">Cancelar</button>
              <button onClick={cerrarPrograma} className="btn-danger">Cerrar programa</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {page === PAGES.inicio && <Inicio seccion={seccion} mes={mes} anyo={anyo} cambiarMes={cambiarMes} />}
        {page === PAGES.compras && <Compras mes={mes} anyo={anyo} cambiarMes={cambiarMes} />}
        {page === PAGES.servicios && <Servicios />}
      </main>
    </div>
  );
}
