import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_RUTAS, type Ruta, type EstadoRuta, getEstadoRuta } from "@/types/inspector";

type TabFilter = "TODOS" | "PENDIENTE_SALIDA" | "EN_RUTA" | "PENDIENTE_RETORNO" | "COMPLETADA";

const SALIDA_PILL: Record<string, { cls: string; label: string }> = {
  PENDIENTE: { cls: "bg-amber-100 text-amber-700", label: "⏳ Salida pendiente" },
  VERIFICADA: { cls: "bg-green-100 text-green-700", label: "✓ Salida verificada" },
  CON_OBS: { cls: "bg-orange-100 text-orange-700", label: "⚠ Salida con observaciones" },
};

const RETORNO_PILL: Record<string, { cls: string; label: string }> = {
  EN_RUTA: { cls: "bg-blue-100 text-blue-700", label: "🚚 En ruta" },
  PENDIENTE: { cls: "bg-purple-100 text-purple-700", label: "⏳ Retorno pendiente" },
  COMPLETADO: { cls: "bg-green-100 text-green-700", label: "✓ Retorno completado" },
};

const BORDER_COLOR: Record<EstadoRuta, string> = {
  PENDIENTE_SALIDA: "border-amber-400",
  EN_RUTA: "border-blue-400",
  PENDIENTE_RETORNO: "border-purple-400",
  COMPLETADA: "border-green-400",
};

export default function RutasDelDia() {
  const [date, setDate] = useState<Date>(new Date());
  const [tab, setTab] = useState<TabFilter>("TODOS");
  const [canalFilter, setCanalFilter] = useState("all");
  const navigate = useNavigate();

  const rutas = MOCK_RUTAS;
  const canales = [...new Set(rutas.map((r) => r.canal))];

  const counts = useMemo(() => {
    const c = { PENDIENTE_SALIDA: 0, EN_RUTA: 0, PENDIENTE_RETORNO: 0, COMPLETADA: 0 };
    rutas.forEach((r) => c[getEstadoRuta(r)]++);
    return c;
  }, [rutas]);

  const filtered = useMemo(() => {
    return rutas.filter((r) => {
      const estado = getEstadoRuta(r);
      if (tab !== "TODOS" && estado !== tab) return false;
      if (canalFilter !== "all" && r.canal !== canalFilter) return false;
      return true;
    });
  }, [rutas, tab, canalFilter]);

  const tabs: { key: TabFilter; label: string; count?: number }[] = [
    { key: "TODOS", label: "Todos" },
    { key: "PENDIENTE_SALIDA", label: "Pendiente Salida", count: counts.PENDIENTE_SALIDA },
    { key: "EN_RUTA", label: "En Ruta", count: counts.EN_RUTA },
    { key: "PENDIENTE_RETORNO", label: "Pendiente Retorno", count: counts.PENDIENTE_RETORNO },
    { key: "COMPLETADA", label: "Completada", count: counts.COMPLETADA },
  ];

  function renderAction(ruta: Ruta) {
    if (ruta.salida === "PENDIENTE") {
      return (
        <Button className="min-h-[48px]" onClick={() => navigate(`/inspector/rutas/${ruta.id}/salida`)}>
          Verificar Salida →
        </Button>
      );
    }
    if (ruta.salida === "CON_OBS") {
      return (
        <Button className="min-h-[48px] bg-orange-500 hover:bg-orange-600 text-white" onClick={() => navigate(`/inspector/rutas/${ruta.id}/salida`)}>
          Ver Observaciones →
        </Button>
      );
    }
    if (ruta.retorno === "PENDIENTE") {
      return (
        <Button variant="secondary" className="min-h-[48px]" onClick={() => navigate(`/inspector/rutas/${ruta.id}/retorno`)}>
          Inspeccionar Retorno →
        </Button>
      );
    }
    return (
      <Button variant="ghost" className="min-h-[48px]" onClick={() => navigate(`/inspector/rutas/${ruta.id}/retorno`)}>
        Ver Detalle
      </Button>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Rutas del Día</h1>
          <p className="text-muted-foreground mt-0.5">
            Control de calidad — {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-h-[48px] gap-2">
              <CalendarIcon size={16} />
              {format(date, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary Banner */}
      <div className="bg-card rounded-xl p-4 shadow-sm flex items-center divide-x divide-border">
        {[
          { label: "Pendientes Salida", value: counts.PENDIENTE_SALIDA, cls: "text-amber-600" },
          { label: "En Ruta", value: counts.EN_RUTA, cls: "text-blue-600" },
          { label: "Pendientes Retorno", value: counts.PENDIENTE_RETORNO, cls: "text-purple-600" },
          { label: "Completadas", value: counts.COMPLETADA, cls: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="flex-1 text-center px-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "min-h-[40px] px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap active:scale-95",
                tab === t.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {t.count != null && <span className="ml-1.5 text-xs opacity-80">{t.count}</span>}
            </button>
          ))}
        </div>
        <Select value={canalFilter} onValueChange={setCanalFilter}>
          <SelectTrigger className="w-[180px] min-h-[48px]">
            <SelectValue placeholder="Todos los canales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los canales</SelectItem>
            {canales.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Route Cards */}
      <div className="space-y-3">
        {filtered.map((ruta, i) => {
          const estado = getEstadoRuta(ruta);
          const salidaPill = SALIDA_PILL[ruta.salida];
          const retornoPill = RETORNO_PILL[ruta.retorno];
          return (
            <div
              key={ruta.id}
              className={cn("bg-card rounded-xl p-4 shadow-sm border-l-4 animate-fade-in", BORDER_COLOR[estado])}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-4 flex-wrap">
                {/* LEFT */}
                <div className="w-full sm:w-1/3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">{ruta.codigo}</span>
                    <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded">{ruta.canal}</span>
                  </div>
                  <p className="text-base font-semibold text-foreground">{ruta.vendedor}</p>
                  <p className="text-sm text-muted-foreground">
                    {ruta.pedidos} pedidos · {ruta.productos} productos · Sobrestock: {ruta.sobrestock ? "Sí" : "No"}
                  </p>
                </div>

                {/* CENTER */}
                <div className="w-full sm:w-1/3 space-y-2">
                  <span className={cn("inline-block text-xs font-medium px-3 py-1 rounded-full", salidaPill.cls)}>
                    {salidaPill.label}{ruta.horaSalida && ruta.salida !== "PENDIENTE" ? ` ${ruta.horaSalida}` : ""}
                  </span>
                  <br />
                  <span className={cn("inline-block text-xs font-medium px-3 py-1 rounded-full", retornoPill.cls)}>
                    {retornoPill.label}
                  </span>
                </div>

                {/* RIGHT */}
                <div className="w-full sm:w-1/3 sm:text-right">
                  {renderAction(ruta)}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-card rounded-xl p-12 text-center shadow-sm">
            <p className="text-muted-foreground text-lg">No hay rutas en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
}
