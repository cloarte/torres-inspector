import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MOCK_RUTAS, type RetornoItem, type Condicion, type Destino } from "@/types/inspector";

type TabFilter = "TODOS" | "PENDIENTES" | "INSPECCIONADOS" | "POOL_GG";

const CONDICION_LABELS: Record<Condicion, string> = {
  OPTIMO: "ÓPTIMO",
  DEFECTO_ESTETICO: "DEFECTO ESTÉTICO",
  PROXIMO_VENCER: "PRÓXIMO A VENCER",
  VENCIDO: "VENCIDO",
};

const TIPO_RETORNO_STYLE: Record<string, string> = {
  RECHAZO_CLIENTE: "bg-orange-100 text-orange-700",
  DAÑADO: "bg-red-100 text-red-700",
  VENCIDO_RETORNO: "bg-red-100 text-red-700",
  NO_ENTREGADO: "bg-muted text-muted-foreground",
  SOBRANTE: "bg-blue-100 text-blue-700",
};

const DESTINO_LABELS: Record<Destino, string> = {
  REINGRESO: "REINGRESO",
  STOCK_FLOTANTE: "STOCK FLOTANTE",
  MERMA: "MERMA",
  POOL_GG: "POOL GG",
};

function getHighlightedDestino(cond: Condicion): Destino | null {
  switch (cond) {
    case "OPTIMO": return "REINGRESO";
    case "DEFECTO_ESTETICO": return "POOL_GG";
    case "PROXIMO_VENCER": return "POOL_GG";
    case "VENCIDO": return "MERMA";
  }
}

function getDisabledDestinos(cond: Condicion): Destino[] {
  if (cond === "VENCIDO") return ["REINGRESO", "STOCK_FLOTANTE"];
  return [];
}

export default function ControlRetorno() {
  const { rutaId } = useParams();
  const navigate = useNavigate();
  const ruta = MOCK_RUTAS.find((r) => r.id === rutaId);

  const [retornos, setRetornos] = useState<RetornoItem[]>(ruta?.retornos ?? []);
  const [tab, setTab] = useState<TabFilter>("TODOS");
  const [despachoOpen, setDespachoOpen] = useState(false);
  const [formState, setFormState] = useState<Record<string, { condicion?: Condicion; destino?: Destino; obs: string }>>({});

  const counts = useMemo(() => {
    const total = retornos.length;
    const inspeccionados = retornos.filter((r) => r.estado === "PROCESADO").length;
    const pendientes = retornos.filter((r) => r.estado === "PENDIENTE").length;
    const mermas = retornos.filter((r) => r.destino === "MERMA").length;
    return { total, inspeccionados, pendientes, mermas };
  }, [retornos]);

  const filtered = useMemo(() => {
    return retornos.filter((r) => {
      if (tab === "PENDIENTES" && r.estado !== "PENDIENTE") return false;
      if (tab === "INSPECCIONADOS" && r.estado !== "PROCESADO") return false;
      if (tab === "POOL_GG" && r.destino !== "POOL_GG") return false;
      return true;
    });
  }, [retornos, tab]);

  if (!ruta) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <p className="text-muted-foreground text-lg">Ruta no encontrada</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/inspector/rutas")}>← Volver</Button>
      </div>
    );
  }

  const salidaHadObs = ruta.salida === "CON_OBS";
  const salidaObsCount = ruta.productosSalida.filter((p) => p.cantVerificada !== p.cantDespacho).length;

  const getForm = (id: string) => formState[id] ?? { obs: "" };
  const setForm = (id: string, update: Partial<{ condicion?: Condicion; destino?: Destino; obs: string }>) => {
    setFormState((prev) => ({ ...prev, [id]: { ...getForm(id), ...update } }));
  };

  const handleConfirm = (id: string) => {
    const form = getForm(id);
    if (!form.condicion || !form.destino) return;

    setRetornos((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, estado: "PROCESADO" as const, condicion: form.condicion, destino: form.destino, observaciones: form.obs, horaProcesado: format(new Date(), "HH:mm") }
          : r
      )
    );

    if (form.destino === "POOL_GG") {
      toast("⏳ Enviado al Pool GG — el Gerente General recibirá notificación", { duration: 4000 });
    } else {
      toast(`✓ Inspección registrada — ${form.destino}`, { duration: 3000 });
    }
  };

  const tabs: { key: TabFilter; label: string; count?: number }[] = [
    { key: "TODOS", label: "Todos" },
    { key: "PENDIENTES", label: "Pendientes", count: counts.pendientes },
    { key: "INSPECCIONADOS", label: "Inspeccionados", count: counts.inspeccionados },
    { key: "POOL_GG", label: "En Pool GG" },
  ];

  const allDestinos: Destino[] = ["REINGRESO", "STOCK_FLOTANTE", "MERMA", "POOL_GG"];
  const allCondiciones: Condicion[] = ["OPTIMO", "DEFECTO_ESTETICO", "PROXIMO_VENCER", "VENCIDO"];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" onClick={() => navigate("/inspector/rutas")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Control de Retorno — Ruta {ruta.codigo}</h1>
            <p className="text-muted-foreground mt-0.5">
              {ruta.vendedor} · Salió: {ruta.horaSalida ?? "—"} · Regresó: {format(new Date(), "dd/MM/yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
          PENDIENTE
        </span>
      </div>

      {/* Collapsible Despacho Original */}
      <div className="bg-muted rounded-xl border overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground min-h-[48px]"
          onClick={() => setDespachoOpen(!despachoOpen)}
        >
          <span>📦 Ver despacho original</span>
          {despachoOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {despachoOpen && (
          <div className="px-4 pb-4 space-y-3">
            {ruta.productosSalida.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase border-b">
                    <th className="px-2 py-2 text-left font-medium">Producto</th>
                    <th className="px-2 py-2 text-center font-medium">Cant. Despachada</th>
                    <th className="px-2 py-2 text-center font-medium">Cant. Verificada</th>
                    <th className="px-2 py-2 text-left font-medium">Estado Salida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ruta.productosSalida.map((p) => (
                    <tr key={p.id}>
                      <td className="px-2 py-1.5">{p.producto}</td>
                      <td className="px-2 py-1.5 text-center">{p.cantDespacho}</td>
                      <td className="px-2 py-1.5 text-center">{p.cantVerificada}</td>
                      <td className="px-2 py-1.5">
                        <span className={cn("text-xs px-2 py-0.5 rounded", p.cantVerificada === p.cantDespacho ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                          {p.cantVerificada === p.cantDespacho ? "OK" : "DIFERENCIA"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos de despacho disponibles.</p>
            )}
            {salidaHadObs && (
              <div className="bg-orange-50 border border-orange-200 p-2 rounded text-sm text-orange-700">
                ⚠ Esta ruta tuvo {salidaObsCount} observaciones en la salida.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Banner */}
      <div className="bg-card rounded-xl p-4 shadow-sm flex items-center divide-x divide-border">
        {[
          { label: "Retornos", value: counts.total, cls: "text-muted-foreground" },
          { label: "Inspeccionados", value: counts.inspeccionados, cls: "text-green-600" },
          { label: "Pendientes", value: counts.pendientes, cls: "text-amber-600" },
          { label: "Mermas", value: counts.mermas, cls: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="flex-1 text-center px-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Chips */}
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

      {/* Retorno Cards */}
      <div className="space-y-3">
        {filtered.map((retorno, i) => {
          const form = getForm(retorno.id);
          const isPending = retorno.estado === "PENDIENTE";
          const highlighted = form.condicion ? getHighlightedDestino(form.condicion) : null;
          const disabled = form.condicion ? getDisabledDestinos(form.condicion) : [];

          return (
            <div
              key={retorno.id}
              className="bg-card rounded-xl shadow-sm overflow-hidden animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex flex-col sm:flex-row">
                {/* LEFT */}
                <div className="p-4 sm:w-1/2 space-y-2 border-b sm:border-b-0 sm:border-r border-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{retorno.id}</span>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", retorno.estado === "PROCESADO" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                      {retorno.estado}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-foreground">{retorno.producto}</p>
                  <p className="text-sm text-muted-foreground">{retorno.sku} · {retorno.lote}</p>
                  <p className="text-sm text-muted-foreground">
                    {ruta.vendedor} · <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">{ruta.codigo}</span> · Cantidad: {retorno.cantidad} {retorno.unidad}
                  </p>
                  <span className={cn("inline-block text-xs font-medium px-2 py-0.5 rounded", TIPO_RETORNO_STYLE[retorno.tipoRetorno] ?? "bg-muted text-muted-foreground")}>
                    {retorno.tipoRetorno.replace("_", " ")}
                  </span>

                  {/* Show result if processed */}
                  {retorno.estado === "PROCESADO" && retorno.condicion && retorno.destino && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm space-y-1">
                      <p><span className="font-medium">Condición:</span> {CONDICION_LABELS[retorno.condicion]}</p>
                      <p><span className="font-medium">Destino:</span> {DESTINO_LABELS[retorno.destino]}</p>
                      {retorno.observaciones && <p><span className="font-medium">Obs:</span> {retorno.observaciones}</p>}
                      <p className="text-xs text-muted-foreground">Procesado: {retorno.horaProcesado}</p>
                    </div>
                  )}
                </div>

                {/* RIGHT — Inspection Form */}
                {isPending && (
                  <div className="p-4 sm:w-1/2 space-y-4">
                    {/* Condición */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Condición del producto</p>
                      <div className="grid grid-cols-2 gap-2">
                        {allCondiciones.map((c) => (
                          <button
                            key={c}
                            onClick={() => setForm(retorno.id, { condicion: c, destino: undefined })}
                            className={cn(
                              "min-h-[48px] rounded-lg text-sm font-medium transition-all",
                              form.condicion === c
                                ? "bg-primary text-primary-foreground scale-105 shadow"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {CONDICION_LABELS[c]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Destino */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Destino</p>
                      <div className="grid grid-cols-2 gap-2">
                        {allDestinos.map((d) => {
                          const isDisabled = !form.condicion || disabled.includes(d);
                          const isHighlighted = highlighted === d;
                          const isSelected = form.destino === d;
                          return (
                            <button
                              key={d}
                              disabled={isDisabled}
                              onClick={() => setForm(retorno.id, { destino: d })}
                              className={cn(
                                "min-h-[48px] rounded-lg text-sm font-medium transition-all",
                                isDisabled && "opacity-40 cursor-not-allowed",
                                isSelected
                                  ? "bg-primary text-primary-foreground scale-105 shadow"
                                  : isHighlighted
                                  ? d === "REINGRESO" ? "bg-green-100 text-green-700 ring-2 ring-green-400"
                                    : d === "MERMA" ? "bg-red-100 text-red-700 ring-2 ring-red-400"
                                    : d === "POOL_GG" ? "bg-purple-100 text-purple-700 ring-2 ring-purple-400"
                                    : "bg-blue-100 text-blue-700 ring-2 ring-blue-400"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {DESTINO_LABELS[d]}
                            </button>
                          );
                        })}
                      </div>
                      {form.destino === "POOL_GG" && (
                        <p className="text-xs text-purple-600 mt-1.5">El GG decidirá: donación, descuento o descarte</p>
                      )}
                    </div>

                    {/* Observaciones */}
                    <Textarea
                      value={form.obs}
                      onChange={(e) => setForm(retorno.id, { obs: e.target.value })}
                      placeholder="Observaciones (opcional)"
                      className="min-h-[60px]"
                    />

                    {/* Confirm */}
                    <Button
                      className="w-full min-h-[48px]"
                      disabled={!form.condicion || !form.destino}
                      onClick={() => handleConfirm(retorno.id)}
                    >
                      Confirmar inspección
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-card rounded-xl p-12 text-center shadow-sm">
            <p className="text-muted-foreground text-lg">No hay retornos en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
}
