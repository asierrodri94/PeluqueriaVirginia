import { useState } from "react";
import Inicio from "./pages/Inicio";
import Servicios from "./pages/Servicios";

const PAGES = { inicio: "inicio", servicios: "servicios" };

export default function App() {
  const [page, setPage] = useState(PAGES.inicio);
  const [seccion, setSeccion] = useState("A");

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
              onClick={() => setPage(PAGES.inicio)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === PAGES.inicio ? "bg-white text-rose-600" : "text-white hover:bg-rose-500"
              }`}
            >
              Facturas
            </button>
            <button
              onClick={() => setPage(PAGES.servicios)}
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
                  onClick={() => setSeccion(s)}
                  className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${
                    seccion === s ? "bg-white text-rose-600" : "text-white hover:bg-rose-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {page === PAGES.inicio && <Inicio seccion={seccion} />}
        {page === PAGES.servicios && <Servicios />}
      </main>
    </div>
  );
}
