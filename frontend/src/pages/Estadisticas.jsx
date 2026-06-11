import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, LabelList,
} from "recharts";

const MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
               "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_FULL = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const TRIMESTRE_DE_MES = (m) => Math.ceil(m / 3);
const NOMBRES_TRIM = ["", "1er Trim.", "2º Trim.", "3er Trim.", "4º Trim."];

// Paleta de colores para los servicios
const COLORES = [
  "#e11d48", "#7c3aed", "#2563eb", "#059669", "#d97706",
  "#db2777", "#4f46e5", "#0891b2", "#16a34a", "#ca8a04",
  "#9333ea", "#dc2626", "#0284c7", "#15803d", "#b45309",
];

const fmtEur = (v) => v.toFixed(2).replace(".", ",") + " €";

// Tooltip personalizado
const CustomTooltip = ({ active, payload, label, metrica }) => {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.dataKey !== "_total" && p.value > 0);
  const total = items.reduce((s, p) => s + (p.value || 0), 0);
  if (!items.length) return null;
  return (
    <div style={{ zIndex: 9999, position: "relative" }} className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-[220px]">
      <p className="font-bold text-gray-700 mb-1.5">{label}</p>
      {items.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: p.fill }} />
            <span style={{ color: p.fill }}>{p.dataKey}</span>
          </span>
          <span className="font-semibold text-gray-800">
            {metrica === "importe" ? fmtEur(p.value) : p.value}
          </span>
        </div>
      ))}
      {items.length > 1 && (
        <div className="border-t border-gray-100 mt-1.5 pt-1.5 flex justify-between font-bold text-gray-700">
          <span>Total</span>
          <span>{metrica === "importe" ? fmtEur(total) : total}</span>
        </div>
      )}
    </div>
  );
};

// Añade separador de miles con punto (fiable en cualquier entorno)
const miles = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Formatea tick del eje Y
const fmtY = (metrica) => (v) => metrica === "importe" ? `${miles(v)}€` : miles(v);
const fmtLabel = (metrica) => (v) => {
  if (v == null) return "";
  return metrica === "importe" ? `${miles(v)}€` : miles(v);
};

// Clave especial que lleva el label del total en el entry
const lblKey = (tipo) => `_lbl_${tipo}`;

// ─── Vista Por Mes ────────────────────────────────────────────────────────────
function VistaMes({ mes, anyo, seccion }) {
  const [datos, setDatos] = useState([]);
  const [servicios, setServicios] = useState([]); // todos los tipos
  const [filtro, setFiltro] = useState([]); // vacío = todos
  const [metrica, setMetrica] = useState("conteo");
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const rows = await api.getStatsMes(mes, anyo, seccion);
      const tipos = [...new Set(rows.map((r) => r.tipo))].sort();
      setServicios(tipos);
      setDatos(rows);
    } catch {
      toast.error("Error al cargar estadísticas");
    } finally {
      setCargando(false);
    }
  }, [mes, anyo, seccion]);

  useEffect(() => { cargar(); }, [cargar]);

  const tiposActivos = filtro.length ? filtro : servicios;

  // Construir datos por día
  const diasEnMes = new Date(anyo, mes, 0).getDate();
  const porDia = [];
  for (let d = 1; d <= diasEnMes; d++) {
    const entry = { label: `${d}` };
    let total = 0;
    for (const tipo of tiposActivos) {
      const row = datos.find((r) => r.dia === d && r.tipo === tipo);
      const val = row ? row[metrica] : 0;
      entry[tipo] = val;
      total += val;
    }
    entry._total = total > 0 ? total : null;
    if (total > 0) {
      const topTipo = [...tiposActivos].reverse().find((t) => entry[t] > 0);
      if (topTipo) entry[lblKey(topTipo)] = total;
    }
    porDia.push(entry);
  }

  // Barra de total separada
  const totalGlobal = tiposActivos.reduce((s, tipo) => {
    return s + datos.filter((r) => r.tipo === tipo).reduce((ss, r) => ss + r[metrica], 0);
  }, 0);
  const totalEntry = { label: "TOTAL", _esTotal: true, _total: totalGlobal };
  for (const tipo of tiposActivos) {
    totalEntry[tipo] = datos.filter((r) => r.tipo === tipo).reduce((s, r) => s + r[metrica], 0);
  }
  if (totalGlobal > 0) {
    const topTipo = [...tiposActivos].reverse().find((t) => totalEntry[t] > 0);
    if (topTipo) totalEntry[lblKey(topTipo)] = totalGlobal;
  }

  const toggleFiltro = (tipo) => {
    setFiltro((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  if (cargando) return <div className="py-16 text-center text-gray-400">Cargando...</div>;
  if (!datos.length) return (
    <div className="py-16 text-center text-gray-400">
      <p className="text-4xl mb-2">📊</p>
      <p>No hay datos en {MESES_FULL[mes]} {anyo}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Controls metrica={metrica} setMetrica={setMetrica} servicios={servicios} filtro={filtro} toggleFiltro={toggleFiltro} setFiltro={setFiltro} colores={COLORES} />

      {/* Gráfico por día */}
      <div className="card overflow-visible">
        <p className="text-sm font-semibold text-gray-600 mb-3">Por día — {MESES_FULL[mes]} {anyo}</p>
        <ResponsiveContainer width="100%" height={340} style={{ overflow: "visible" }}>
          <BarChart data={porDia} margin={{ top: 28, right: 8, left: 0, bottom: 0 }} style={{ overflow: "visible" }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtY(metrica)} tick={{ fontSize: 11 }} width={metrica === "importe" ? 55 : 35} allowDecimals={metrica === "importe"} />
            <Tooltip content={<CustomTooltip metrica={metrica} />} wrapperStyle={{ zIndex: 9999 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {tiposActivos.map((tipo, i) => (
              <Bar key={tipo} dataKey={tipo} stackId="a" fill={COLORES[i % COLORES.length]} maxBarSize={40}>
                <LabelList dataKey={lblKey(tipo)} position="top" formatter={fmtLabel(metrica)} style={{ fontSize: 10, fill: "#374151", fontWeight: 600 }} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Barra de total */}
      <div className="card overflow-visible">
        <p className="text-sm font-semibold text-gray-600 mb-3">
          Total del mes — {metrica === "importe" ? fmtEur(totalGlobal) : `${totalGlobal} servicios`}
        </p>
        <ResponsiveContainer width="100%" height={180} style={{ overflow: "visible" }}>
          <BarChart data={[totalEntry]} margin={{ top: 28, right: 8, left: 0, bottom: 0 }} style={{ overflow: "visible" }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmtY(metrica)} tick={{ fontSize: 11 }} width={metrica === "importe" ? 55 : 35} allowDecimals={metrica === "importe"} />
            <Tooltip content={<CustomTooltip metrica={metrica} />} wrapperStyle={{ zIndex: 9999 }} position={{ y: 0 }} />
            {tiposActivos.map((tipo, i) => (
              <Bar key={tipo} dataKey={tipo} stackId="a" fill={COLORES[i % COLORES.length]} maxBarSize={80}>
                <LabelList dataKey={lblKey(tipo)} position="top" formatter={fmtLabel(metrica)} style={{ fontSize: 12, fill: "#374151", fontWeight: 700 }} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Vista Anual ──────────────────────────────────────────────────────────────
function VistaAnyo({ anyo, seccion }) {
  const [datos, setDatos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [filtro, setFiltro] = useState([]);
  const [metrica, setMetrica] = useState("conteo");
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const rows = await api.getStatsAnyo(anyo, seccion);
      const tipos = [...new Set(rows.map((r) => r.tipo))].sort();
      setServicios(tipos);
      setDatos(rows);
    } catch {
      toast.error("Error al cargar estadísticas");
    } finally {
      setCargando(false);
    }
  }, [anyo, seccion]);

  useEffect(() => { cargar(); }, [cargar]);

  const tiposActivos = filtro.length ? filtro : servicios;

  // Construir datos por mes + subtotales por trimestre + total anual
  const chartData = [];
  for (let t = 1; t <= 4; t++) {
    const mesesTrim = [t * 3 - 2, t * 3 - 1, t * 3];
    for (const m of mesesTrim) {
      const entry = { label: MESES[m], _mes: m };
      let rowTotal = 0;
      for (const tipo of tiposActivos) {
        const row = datos.find((r) => r.mes === m && r.tipo === tipo);
        const val = row ? row[metrica] : 0;
        entry[tipo] = val;
        rowTotal += val;
      }
      entry._total = rowTotal > 0 ? rowTotal : null;
      if (rowTotal > 0) {
        const topTipo = [...tiposActivos].reverse().find((t) => entry[t] > 0);
        if (topTipo) entry[lblKey(topTipo)] = rowTotal;
      }
      chartData.push(entry);
    }
    // Subtotal trimestre
    const subtEntry = { label: NOMBRES_TRIM[t], _esSubtotal: true };
    let subtTotal = 0;
    for (const tipo of tiposActivos) {
      const val = datos
        .filter((r) => mesesTrim.includes(r.mes) && r.tipo === tipo)
        .reduce((s, r) => s + r[metrica], 0);
      subtEntry[tipo] = val;
      subtTotal += val;
    }
    subtEntry._total = subtTotal > 0 ? subtTotal : null;
    if (subtTotal > 0) {
      const topTipo = [...tiposActivos].reverse().find((t) => subtEntry[t] > 0);
      if (topTipo) subtEntry[lblKey(topTipo)] = subtTotal;
    }
    chartData.push(subtEntry);
  }
  // Total anual
  const totalEntry = { label: "TOTAL AÑO", _esTotal: true };
  let totalGlobal = 0;
  for (const tipo of tiposActivos) {
    const val = datos.filter((r) => r.tipo === tipo).reduce((s, r) => s + r[metrica], 0);
    totalEntry[tipo] = val;
    totalGlobal += val;
  }
  totalEntry._total = totalGlobal;
  if (totalGlobal > 0) {
    const topTipo = [...tiposActivos].reverse().find((t) => totalEntry[t] > 0);
    if (topTipo) totalEntry[lblKey(topTipo)] = totalGlobal;
  }

  const toggleFiltro = (tipo) => {
    setFiltro((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  // Colorear ticks especiales
  const CustomTick = ({ x, y, payload }) => {
    const entry = chartData.find((e) => e.label === payload.value);
    const color = entry?._esTotal ? "#be123c" : entry?._esSubtotal ? "#7c3aed" : "#374151";
    const weight = (entry?._esTotal || entry?._esSubtotal) ? "bold" : "normal";
    return (
      <text x={x} y={y + 10} textAnchor="middle" fill={color} fontWeight={weight} fontSize={11}>
        {payload.value}
      </text>
    );
  };

  if (cargando) return <div className="py-16 text-center text-gray-400">Cargando...</div>;
  if (!datos.length) return (
    <div className="py-16 text-center text-gray-400">
      <p className="text-4xl mb-2">📊</p>
      <p>No hay datos en {anyo}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Controls metrica={metrica} setMetrica={setMetrica} servicios={servicios} filtro={filtro} toggleFiltro={toggleFiltro} setFiltro={setFiltro} colores={COLORES} />

      {/* Gráfico anual con subtotales */}
      <div className="card overflow-visible">
        <p className="text-sm font-semibold text-gray-600 mb-3">Por mes — {anyo}</p>
        <ResponsiveContainer width="100%" height={380} style={{ overflow: "visible" }}>
          <BarChart data={chartData} margin={{ top: 28, right: 8, left: 0, bottom: 0 }} style={{ overflow: "visible" }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={<CustomTick />} interval={0} />
            <YAxis tickFormatter={fmtY(metrica)} tick={{ fontSize: 11 }} width={metrica === "importe" ? 55 : 35} allowDecimals={metrica === "importe"} />
            <Tooltip content={<CustomTooltip metrica={metrica} />} wrapperStyle={{ zIndex: 9999 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {[3, 7, 11].map((idx) => (
              <ReferenceLine key={idx} x={chartData[idx]?.label} stroke="#c4b5fd" strokeDasharray="4 2" />
            ))}
            {tiposActivos.map((tipo, i) => (
              <Bar key={tipo} dataKey={tipo} stackId="a" fill={COLORES[i % COLORES.length]} maxBarSize={40}>
                <LabelList dataKey={lblKey(tipo)} position="top" formatter={fmtLabel(metrica)} style={{ fontSize: 10, fill: "#374151", fontWeight: 600 }} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Barra total anual */}
      <div className="card overflow-visible">
        <p className="text-sm font-semibold text-gray-600 mb-3">
          Total anual — {metrica === "importe" ? fmtEur(totalGlobal) : `${totalGlobal} servicios`}
        </p>
        <ResponsiveContainer width="100%" height={180} style={{ overflow: "visible" }}>
          <BarChart data={[totalEntry]} margin={{ top: 28, right: 8, left: 0, bottom: 0 }} style={{ overflow: "visible" }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmtY(metrica)} tick={{ fontSize: 11 }} width={metrica === "importe" ? 55 : 35} allowDecimals={metrica === "importe"} />
            <Tooltip content={<CustomTooltip metrica={metrica} />} wrapperStyle={{ zIndex: 9999 }} position={{ y: 0 }} />
            {tiposActivos.map((tipo, i) => (
              <Bar key={tipo} dataKey={tipo} stackId="a" fill={COLORES[i % COLORES.length]} maxBarSize={80}>
                <LabelList dataKey={lblKey(tipo)} position="top" formatter={fmtLabel(metrica)} style={{ fontSize: 12, fill: "#374151", fontWeight: 700 }} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Controles compartidos ────────────────────────────────────────────────────
function Controls({ metrica, setMetrica, servicios, filtro, toggleFiltro, setFiltro, colores }) {
  const todosActivos = filtro.length === 0;
  return (
    <div className="card flex flex-wrap items-center gap-3">
      {/* Toggle métrica */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {["conteo", "importe"].map((m) => (
          <button
            key={m}
            onClick={() => setMetrica(m)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              metrica === m ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {m === "conteo" ? "Nº servicios" : "Importe (€)"}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Filtro servicios */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setFiltro([])}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
            todosActivos
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-white text-gray-500 border-gray-300 hover:border-gray-500"
          }`}
        >
          Todos
        </button>
        {servicios.map((tipo, i) => {
          const activo = filtro.includes(tipo);
          return (
            <button
              key={tipo}
              onClick={() => toggleFiltro(tipo)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                activo ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
              }`}
              style={activo ? { background: colores[i % colores.length], borderColor: colores[i % colores.length] } : {}}
            >
              {tipo}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Estadisticas({ mes, anyo, cambiarMes, seccion }) {
  const [vista, setVista] = useState("mes");

  return (
    <div className="space-y-4 pb-96">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => cambiarMes(-1)} className="btn-ghost text-xl px-2">‹</button>
          <div className="text-center min-w-[150px]">
            <p className="text-lg font-bold text-gray-800">{MESES_FULL[mes]} {anyo}</p>
          </div>
          <button onClick={() => cambiarMes(1)} className="btn-ghost text-xl px-2">›</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[["mes", "Por mes"], ["anyo", "Anual"]].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  vista === v ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-400">Sección {seccion}</span>
        </div>
      </div>

      {vista === "mes"
        ? <VistaMes mes={mes} anyo={anyo} seccion={seccion} />
        : <VistaAnyo anyo={anyo} seccion={seccion} />
      }
    </div>
  );
}
