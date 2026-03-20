import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Clock, MapPin, Package, User } from "lucide-react";
import type { Retorno, Condicion, Destino } from "@/pages/RetornosPendientes";

const CONDICIONES: { key: Condicion; label: string; color: string }[] = [
  { key: "OPTIMO", label: "ÓPTIMO", color: "bg-success/10 text-success border-success/30 hover:bg-success/20" },
  { key: "DEFECTO_ESTETICO", label: "DEFECTO ESTÉTICO", color: "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20" },
  { key: "PROXIMO_VENCER", label: "PRÓXIMO A VENCER", color: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200" },
  { key: "VENCIDO", label: "VENCIDO", color: "bg-danger/10 text-danger border-danger/30 hover:bg-danger/20" },
];

const DESTINOS: { key: Destino; label: string; activeColor: string }[] = [
  { key: "REINGRESO", label: "REINGRESO", activeColor: "bg-green-600 text-white" },
  { key: "STOCK_FLOTANTE", label: "STOCK FLOTANTE", activeColor: "bg-blue-600 text-white" },
  { key: "MERMA", label: "MERMA", activeColor: "bg-red-600 text-white" },
  { key: "POOL_GG", label: "POOL GG", activeColor: "bg-purple-600 text-white" },
];

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

function getDestinoBadge(destino: Destino) {
  const map: Record<Destino, string> = {
    REINGRESO: "bg-green-100 text-green-700",
    STOCK_FLOTANTE: "bg-blue-100 text-blue-700",
    MERMA: "bg-red-100 text-red-700",
    POOL_GG: "bg-purple-100 text-purple-700",
  };
  return map[destino];
}

function getCondicionBadge(condicion: Condicion) {
  const map: Record<Condicion, string> = {
    OPTIMO: "bg-green-100 text-green-700",
    DEFECTO_ESTETICO: "bg-orange-100 text-orange-700",
    PROXIMO_VENCER: "bg-amber-100 text-amber-700",
    VENCIDO: "bg-red-100 text-red-700",
  };
  return map[condicion];
}

const CONDICION_LABELS: Record<Condicion, string> = {
  OPTIMO: "ÓPTIMO",
  DEFECTO_ESTETICO: "DEFECTO ESTÉTICO",
  PROXIMO_VENCER: "PRÓXIMO A VENCER",
  VENCIDO: "VENCIDO",
};

const DESTINO_LABELS: Record<Destino, string> = {
  REINGRESO: "REINGRESO",
  STOCK_FLOTANTE: "STOCK FLOTANTE",
  MERMA: "MERMA",
  POOL_GG: "POOL GG",
};

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

  if (!isPending) {
    // Processed card - collapsed/expandable
    return (
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-4 min-h-[48px] text-left active:scale-[0.99] transition-transform"
        >
          <Package size={18} className="text-muted-foreground shrink-0" />
          <span className="font-medium flex-1 truncate">{retorno.producto}</span>
          {retorno.condicion && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCondicionBadge(retorno.condicion)}`}>
              {CONDICION_LABELS[retorno.condicion]}
            </span>
          )}
          {retorno.destino && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDestinoBadge(retorno.destino)}`}>
              {DESTINO_LABELS[retorno.destino]}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={12} /> {retorno.horaProcesado}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded && (
          <div className="px-4 pb-4 pt-0 border-t space-y-2 text-sm text-muted-foreground">
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

  // Pending card - full inspection form
  const enabledDestinos = getEnabledDestinos(condicion);
  const suggestion = getSuggestion(condicion);

  const handleConfirm = () => {
    if (!condicion || !destino) return;
    onInspect(retorno.id, condicion, destino, observaciones);
    const destinoLabel = DESTINO_LABELS[destino];
    if (destino === "POOL_GG") {
      toast.success(`Retorno procesado: ${retorno.producto} → ${destinoLabel}`, {
        description: "Enviado al Pool del Gerente General. Recibirá una notificación.",
      });
    } else {
      toast.success(`Retorno procesado: ${retorno.producto} → ${destinoLabel}`);
    }
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-mono">
                {retorno.id}
              </Badge>
              <Badge className="bg-warning/10 text-warning border-warning/30 text-xs">
                PENDIENTE
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-foreground">{retorno.producto}</h3>
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {retorno.motivoRetorno}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mt-3 text-sm">
          <p className="text-muted-foreground flex items-center gap-1.5">
            <Package size={14} /> SKU: <span className="text-foreground">{retorno.sku}</span>
          </p>
          <p className="text-muted-foreground">Lote: <span className="text-foreground">{retorno.lote}</span></p>
          <p className="text-muted-foreground flex items-center gap-1.5">
            <User size={14} /> <span className="text-foreground">{retorno.vendedor}</span>
          </p>
          <p className="text-muted-foreground flex items-center gap-1.5">
            <MapPin size={14} /> <span className="text-foreground">{retorno.ruta}</span>
          </p>
        </div>
        <p className="text-sm font-medium text-foreground mt-2">
          Cantidad: {retorno.cantidad} {retorno.unidad}
        </p>
      </div>

      {/* Inspection Form */}
      <div className="p-4 space-y-4">
        {/* Condición */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">Condición del producto</p>
          <div className="grid grid-cols-2 gap-2">
            {CONDICIONES.map((c) => (
              <button
                key={c.key}
                onClick={() => { setCondicion(c.key); setDestino(null); }}
                className={`min-h-[48px] rounded-lg border text-sm font-medium transition-all active:scale-95 ${
                  condicion === c.key
                    ? c.color + " border-current ring-2 ring-current/20"
                    : "border-border text-muted-foreground hover:border-foreground/20"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Destino */}
        {condicion && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Destino</p>
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
                    className={`min-h-[48px] rounded-lg border text-sm font-medium transition-all active:scale-95 relative ${
                      isSelected
                        ? d.activeColor + " border-transparent ring-2 ring-current/20"
                        : enabled
                          ? isSuggested
                            ? "border-current/40 bg-muted text-foreground hover:opacity-90"
                            : "border-border text-muted-foreground hover:border-foreground/20"
                          : "border-border text-muted-foreground/30 cursor-not-allowed bg-muted/50"
                    }`}
                  >
                    {d.label}
                    {isSuggested && !isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {suggestion && (
              <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded-md">
                {suggestion.note}
              </p>
            )}
          </div>
        )}

        {/* Observaciones */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">Observaciones</p>
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Empaque dañado en la parte superior, producto apto para consumo"
            className="min-h-[80px] text-base"
          />
        </div>

        {/* Confirm */}
        <Button
          onClick={handleConfirm}
          disabled={!condicion || !destino}
          className="w-full min-h-[48px] text-base font-medium bg-primary hover:bg-primary/90"
        >
          Confirmar inspección
        </Button>
      </div>
    </div>
  );
}
