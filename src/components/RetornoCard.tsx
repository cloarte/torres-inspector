import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Clock, MapPin, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Retorno, Condicion, Destino, TipoRetorno } from "@/pages/RetornosPendientes";

/* ── Condición buttons ─────────────────────────────── */
const CONDICIONES: { key: Condicion; label: string }[] = [
  { key: "OPTIMO", label: "ÓPTIMO" },
  { key: "DEFECTO_ESTETICO", label: "DEFECTO ESTÉTICO" },
  { key: "PROXIMO_VENCER", label: "PRÓXIMO A VENCER" },
  { key: "VENCIDO", label: "VENCIDO" },
];

/* ── Destino buttons ───────────────────────────────── */
const DESTINOS: { key: Destino; label: string; inactive: string; active: string }[] = [
  { key: "REINGRESO", label: "REINGRESO", inactive: "bg-green-100 text-green-700", active: "bg-green-600 text-white" },
  { key: "STOCK_FLOTANTE", label: "STOCK FLOTANTE", inactive: "bg-blue-100 text-blue-700", active: "bg-blue-600 text-white" },
  { key: "MERMA", label: "MERMA", inactive: "bg-red-100 text-red-700", active: "bg-red-600 text-white" },
  { key: "POOL_GG", label: "POOL GG", inactive: "bg-purple-100 text-purple-700", active: "bg-purple-600 text-white" },
];

/* ── Tipo retorno badge colors ─────────────────────── */
const TIPO_RETORNO_STYLE: Record<TipoRetorno, string> = {
  RECHAZO_CLIENTE: "bg-orange-100 text-orange-700",
  DAÑADO: "bg-red-100 text-red-700",
  VENCIDO_RETORNO: "bg-red-100 text-red-700",
  NO_ENTREGADO: "bg-slate-100 text-slate-600",
  SOBRANTE: "bg-blue-100 text-blue-700",
};

const TIPO_RETORNO_LABEL: Record<TipoRetorno, string> = {
  RECHAZO_CLIENTE: "RECHAZO CLIENTE",
  DAÑADO: "DAÑADO",
  VENCIDO_RETORNO: "VENCIDO",
  NO_ENTREGADO: "NO ENTREGADO",
  SOBRANTE: "SOBRANTE",
};

/* ── Logic helpers ─────────────────────────────────── */
function getEnabledDestinos(condicion: Condicion | null): Destino[] {
  if (!condicion) return [];
  switch (condicion) {
    case "OPTIMO": return ["REINGRESO", "STOCK_FLOTANTE"];
    case "DEFECTO_ESTETICO": return ["REINGRESO", "STOCK_FLOTANTE", "MERMA", "POOL_GG"];
    case "PROXIMO_VENCER": return ["MERMA", "POOL_GG"];
    case "VENCIDO": return ["MERMA", "POOL_GG"];
  }
}

function getSuggestion(condicion: Condicion | null): { destino: Destino; note: string } | null {
  if (!condicion) return null;
  switch (condicion) {
    case "OPTIMO": return { destino: "REINGRESO", note: "✅ Recomendado: vuelve al stock disponible" };
    case "DEFECTO_ESTETICO": return { destino: "POOL_GG", note: "💡 Recomendado: el GG puede decidir venta con descuento" };
    case "PROXIMO_VENCER": return { destino: "POOL_GG", note: "💡 Si tiene ≤5 días, el GG puede autorizar donación" };
    case "VENCIDO": return { destino: "MERMA", note: "⚠ Producto vencido — solo apto para merma o pool GG" };
  }
}

/* ── Badge helpers ─────────────────────────────────── */
const CONDICION_BADGE: Record<Condicion, string> = {
  OPTIMO: "bg-green-100 text-green-700",
  DEFECTO_ESTETICO: "bg-orange-100 text-orange-700",
  PROXIMO_VENCER: "bg-amber-100 text-amber-700",
  VENCIDO: "bg-red-100 text-red-700",
};
const CONDICION_LABELS: Record<Condicion, string> = {
  OPTIMO: "ÓPTIMO", DEFECTO_ESTETICO: "DEFECTO ESTÉTICO",
  PROXIMO_VENCER: "PRÓXIMO A VENCER", VENCIDO: "VENCIDO",
};
const DESTINO_BADGE: Record<Destino, string> = {
  REINGRESO: "bg-green-100 text-green-700",
  STOCK_FLOTANTE: "bg-blue-100 text-blue-700",
  MERMA: "bg-red-100 text-red-700",
  POOL_GG: "bg-purple-100 text-purple-700",
};
const DESTINO_LABELS: Record<Destino, string> = {
  REINGRESO: "REINGRESO", STOCK_FLOTANTE: "STOCK FLOTANTE",
  MERMA: "MERMA", POOL_GG: "POOL GG",
};

/* ── Component ─────────────────────────────────────── */
interface Props {
  retorno: Retorno;
  onInspect: (id: string, condicion: Condicion, destino: Destino, observaciones: string) => void;
}

export function RetornoCard({ retorno, onInspect }: Props) {
  const [condicion, setCondicion] = useState<Condicion | null>(null);
  const [destino, setDestino] = useState<Destino | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [expanded, setExpanded] = useState(false);

  const isPending = retorno.estado === "PENDIENTE";

  /* ── Processed card ────────────────────── */
  if (!isPending) {
    return (
      <div className="bg-card rounded-xl shadow-sm overflow-hidden border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-4 min-h-[48px] text-left active:scale-[0.99] transition-transform"
        >
          <Package size={18} className="text-muted-foreground shrink-0" />
          <span className="font-medium flex-1 truncate">{retorno.producto}</span>
          {retorno.condicion && (
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", CONDICION_BADGE[retorno.condicion])}>
              {CONDICION_LABELS[retorno.condicion]}
            </span>
          )}
          {retorno.destino && (
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", DESTINO_BADGE[retorno.destino])}>
              {DESTINO_LABELS[retorno.destino]}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={12} /> {retorno.horaProcesado}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded && (
          <div className="px-4 pb-4 border-t space-y-2 text-sm text-muted-foreground">
            <div className="grid grid-cols-2 gap-2 pt-3">
              <p><span className="font-medium text-foreground">SKU:</span> {retorno.sku}</p>
              <p><span className="font-medium text-foreground">Lote:</span> {retorno.lote}</p>
              <p><span className="font-medium text-foreground">Vendedor:</span> {retorno.vendedor}</p>
              <p><span className="font-medium text-foreground">Ruta:</span> {retorno.ruta}</p>
              <p><span className="font-medium text-foreground">Cantidad:</span> {retorno.cantidad} {retorno.unidad}</p>
            </div>
            {retorno.observaciones && (
              <p><span className="font-medium text-foreground">Observaciones:</span> {retorno.observaciones}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Pending card ──────────────────────── */
  const enabledDestinos = getEnabledDestinos(condicion);
  const suggestion = getSuggestion(condicion);

  const handleConfirm = () => {
    if (!condicion || !destino) return;
    onInspect(retorno.id, condicion, destino, observaciones);
    const dl = DESTINO_LABELS[destino];
    if (destino === "POOL_GG") {
      toast.success(`Retorno procesado: ${retorno.producto} → ${dl}`, {
        description: "Enviado al Pool del Gerente General. Recibirá una notificación.",
      });
    } else {
      toast.success(`Retorno procesado: ${retorno.producto} → ${dl}`);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden border">
      {/* 2-column layout on tablet */}
      <div className="flex flex-col md:flex-row">
        {/* LEFT — product info */}
        <div className="flex-1 p-4 space-y-2 md:border-r border-border">
          {/* Row 1: ID + estado */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">N° {retorno.id}</span>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs hover:bg-amber-100">
              PENDIENTE
            </Badge>
          </div>

          {/* Row 2: Product name */}
          <h3 className="text-base font-semibold text-foreground">{retorno.producto}</h3>

          {/* Row 3: SKU + Lote */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>SKU: {retorno.sku}</span>
            <span>Lote: {retorno.lote}</span>
          </div>

          {/* Row 4: Vendedor + Ruta + Cantidad */}
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="flex items-center gap-1 text-foreground">
              <User size={14} className="text-muted-foreground" />
              {retorno.vendedor}
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              {retorno.ruta}
            </Badge>
            <span className="text-muted-foreground">
              Cantidad: <span className="text-foreground font-medium">{retorno.cantidad} {retorno.unidad}</span>
            </span>
          </div>

          {/* Row 5: Tipo retorno badge */}
          <div>
            <span className={cn("inline-block text-xs font-medium px-2.5 py-1 rounded-full", TIPO_RETORNO_STYLE[retorno.tipoRetorno])}>
              {TIPO_RETORNO_LABEL[retorno.tipoRetorno]}
            </span>
          </div>
        </div>

        {/* RIGHT — inspection form */}
        <div className="flex-1 p-4 space-y-4 bg-muted/20">
          {/* Condición */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Condición del producto
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CONDICIONES.map((c) => {
                const isActive = condicion === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => { setCondicion(c.key); setDestino(null); }}
                    className={cn(
                      "min-h-[48px] rounded-lg text-sm font-medium transition-all active:scale-95",
                      isActive
                        ? "bg-primary text-primary-foreground scale-105 shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destino */}
          {condicion && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Destino
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DESTINOS.map((d) => {
                  const enabled = enabledDestinos.includes(d.key);
                  const isSelected = destino === d.key;
                  const isSuggested = suggestion?.destino === d.key;
                  return (
                    <button
                      key={d.key}
                      onClick={() => enabled && setDestino(d.key)}
                      disabled={!enabled}
                      className={cn(
                        "min-h-[48px] rounded-lg text-sm font-medium transition-all active:scale-95 relative",
                        isSelected
                          ? d.active + " shadow-md"
                          : enabled
                            ? d.inactive + " hover:opacity-80"
                            : "bg-slate-50 text-slate-300 cursor-not-allowed"
                      )}
                    >
                      {d.label}
                      {isSuggested && !isSelected && (
                        <span className="absolute -top-1 -right-1 text-[10px] bg-accent text-accent-foreground font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                          ★
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {suggestion && (
                <p className="text-xs text-muted-foreground mt-2 bg-card border p-2.5 rounded-lg">
                  {suggestion.note}
                </p>
              )}
            </div>
          )}

          {/* Observaciones */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Observaciones
            </p>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Empaque dañado en la parte superior, producto apto para consumo"
              className="min-h-[72px] text-base bg-card"
            />
          </div>

          {/* Confirm */}
          <Button
            onClick={handleConfirm}
            disabled={!condicion || !destino}
            className="w-full h-12 text-base font-medium"
          >
            Confirmar inspección
          </Button>
        </div>
      </div>
    </div>
  );
}
