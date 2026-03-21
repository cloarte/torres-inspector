import { useState, useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, ArrowRight, ArrowUpDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

/* ── Types ────────────────────────────────────────── */
type TipoAlerta = "ALERTA_AMARILLA" | "ALERTA_ROJA" | "APTA_DONACION";

interface AlertaVencimiento {
  id: string;
  producto: string;
  sku: string;
  lote: string;
  clienteAsignado: string;
  fechaVencimiento: Date;
  canal: string;
  ruta: string;
  tieneRetornoPendiente: boolean;
  enviadoPoolGG: boolean;
  trazabilidad: TrazabilidadEntry[];
}

interface TrazabilidadEntry {
  fecha: Date;
  evento: string;
  detalle: string;
  usuario: string;
}

/* ── Helpers ──────────────────────────────────────── */
function getTipoAlerta(diasRestantes: number): TipoAlerta {
  if (diasRestantes <= 5) return "APTA_DONACION";
  if (diasRestantes <= 7) return "ALERTA_ROJA";
  return "ALERTA_AMARILLA";
}

const ALERTA_BADGE: Record<TipoAlerta, { label: string; cls: string }> = {
  ALERTA_AMARILLA: { label: "⚠ Alerta Amarilla", cls: "bg-yellow-100 text-yellow-700" },
  ALERTA_ROJA: { label: "🔴 Alerta Roja", cls: "bg-red-100 text-red-700" },
  APTA_DONACION: { label: "🟣 Apta Donación", cls: "bg-purple-100 text-purple-700" },
};

/* ── Mock Data ────────────────────────────────────── */
const today = new Date(2026, 2, 21);

const MOCK_TRAZABILIDAD: TrazabilidadEntry[] = [
  { fecha: new Date(2026, 1, 15), evento: "Producción", detalle: "Lote producido en planta principal", usuario: "Sistema" },
  { fecha: new Date(2026, 1, 16), evento: "Ingreso a almacén", detalle: "Registrado en almacén central", usuario: "Almacenero" },
  { fecha: new Date(2026, 2, 1), evento: "Despacho", detalle: "Despachado a ruta LIM-01", usuario: "Almacenero" },
  { fecha: new Date(2026, 2, 18), evento: "Alerta generada", detalle: "Producto próximo a vencer detectado", usuario: "Sistema" },
];

const MOCK_ALERTAS: AlertaVencimiento[] = [
  {
    id: "AV-001", producto: "Panetón Clásico 900g", sku: "PAN-CL-900", lote: "L-2026-005",
    clienteAsignado: "Bodega El Sol", fechaVencimiento: new Date(2026, 2, 24),
    canal: "TRADICIONAL", ruta: "LIM-01", tieneRetornoPendiente: true, enviadoPoolGG: false,
    trazabilidad: MOCK_TRAZABILIDAD,
  },
  {
    id: "AV-002", producto: "Pan de Molde Blanco 500g", sku: "PAN-MB-500", lote: "L-2026-012",
    clienteAsignado: "Minimarket Don Pedro", fechaVencimiento: new Date(2026, 2, 28),
    canal: "TRADICIONAL", ruta: "LIM-01", tieneRetornoPendiente: false, enviadoPoolGG: false,
    trazabilidad: MOCK_TRAZABILIDAD,
  },
  {
    id: "AV-003", producto: "Empanada Pollo x12", sku: "EMP-PO-12", lote: "L-2026-007",
    clienteAsignado: "Supermercado Lira", fechaVencimiento: new Date(2026, 2, 25),
    canal: "MODERNO", ruta: "LIM-02", tieneRetornoPendiente: true, enviadoPoolGG: false,
    trazabilidad: MOCK_TRAZABILIDAD,
  },
  {
    id: "AV-004", producto: "Torta Tres Leches 1kg", sku: "TOR-TL-1K", lote: "L-2026-010",
    clienteAsignado: "Pastelería Rosa", fechaVencimiento: new Date(2026, 2, 23),
    canal: "MODERNO", ruta: "PRV-01", tieneRetornoPendiente: false, enviadoPoolGG: false,
    trazabilidad: MOCK_TRAZABILIDAD,
  },
  {
    id: "AV-005", producto: "Panetón Chocolate 900g", sku: "PAN-CH-900", lote: "L-2026-006",
    clienteAsignado: "Bodega La Esquina", fechaVencimiento: new Date(2026, 3, 3),
    canal: "TRADICIONAL", ruta: "PRV-01", tieneRetornoPendiente: false, enviadoPoolGG: false,
    trazabilidad: MOCK_TRAZABILIDAD,
  },
];

/* ── Sort ─────────────────────────────────────────── */
type SortKey = "producto" | "dias" | "fechaVencimiento" | "canal";
type SortDir = "asc" | "desc";

export default function AlertasVencimiento() {
  const [alertas, setAlertas] = useState(MOCK_ALERTAS);
  const [alertaFilter, setAlertaFilter] = useState("all");
  const [canalFilter, setCanalFilter] = useState("all");
  const [rutaFilter, setRutaFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("dias");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [detailAlerta, setDetailAlerta] = useState<AlertaVencimiento | null>(null);

  const canales = [...new Set(alertas.map((a) => a.canal))];
  const rutas = [...new Set(alertas.map((a) => a.ruta))];

  const enriched = useMemo(() => {
    return alertas.map((a) => {
      const diasRestantes = differenceInDays(a.fechaVencimiento, today);
      return { ...a, diasRestantes, tipoAlerta: getTipoAlerta(diasRestantes) };
    });
  }, [alertas]);

  const filtered = useMemo(() => {
    let rows = enriched.filter((a) => {
      if (alertaFilter !== "all" && a.tipoAlerta !== alertaFilter) return false;
      if (canalFilter !== "all" && a.canal !== canalFilter) return false;
      if (rutaFilter !== "all" && a.ruta !== rutaFilter) return false;
      return true;
    });

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "dias": cmp = a.diasRestantes - b.diasRestantes; break;
        case "producto": cmp = a.producto.localeCompare(b.producto); break;
        case "fechaVencimiento": cmp = a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime(); break;
        case "canal": cmp = a.canal.localeCompare(b.canal); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [enriched, alertaFilter, canalFilter, rutaFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleEnviarPool = (id: string) => {
    const alerta = alertas.find((a) => a.id === id);
    if (!alerta) return;
    setAlertas((prev) => prev.map((a) => a.id === id ? { ...a, enviadoPoolGG: true } : a));
    toast.success(`${alerta.producto} enviado al Pool GG`, {
      description: "El Gerente General recibirá una notificación para decidir el destino.",
    });
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => toggleSort(sortKeyName)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown size={14} className={cn("opacity-40", sortKey === sortKeyName && "opacity-100")} />
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-foreground">Alertas de Vencimiento</h1>

      {/* Inspector Context Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">📋 Usa estas alertas como referencia al inspeccionar retornos.</p>
          <p className="mt-1 text-blue-700">
            Los productos con alerta <span className="font-semibold">ROJA</span> o{" "}
            <span className="font-semibold">APTA DONACIÓN</span> son candidatos a{" "}
            <span className="font-semibold">POOL GG</span> cuando regresen como retorno.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={alertaFilter} onValueChange={setAlertaFilter}>
          <SelectTrigger className="w-[200px] min-h-[48px]">
            <SelectValue placeholder="Tipo de alerta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las alertas</SelectItem>
            <SelectItem value="ALERTA_AMARILLA">⚠ Alerta Amarilla (≤15d)</SelectItem>
            <SelectItem value="ALERTA_ROJA">🔴 Alerta Roja (≤7d)</SelectItem>
            <SelectItem value="APTA_DONACION">🟣 Apta Donación (≤5d)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={canalFilter} onValueChange={setCanalFilter}>
          <SelectTrigger className="w-[180px] min-h-[48px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los canales</SelectItem>
            {canales.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={rutaFilter} onValueChange={setRutaFilter}>
          <SelectTrigger className="w-[160px] min-h-[48px]">
            <SelectValue placeholder="Ruta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las rutas</SelectItem>
            {rutas.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Producto" sortKeyName="producto" /></TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Cliente asignado</TableHead>
                <TableHead><SortHeader label="Fecha venc." sortKeyName="fechaVencimiento" /></TableHead>
                <TableHead><SortHeader label="Días rest." sortKeyName="dias" /></TableHead>
                <TableHead>Alerta</TableHead>
                <TableHead><SortHeader label="Canal" sortKeyName="canal" /></TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const badge = ALERTA_BADGE[row.tipoAlerta];
                const canSendPool = row.tieneRetornoPendiente && !row.enviadoPoolGG;
                return (
                  <TableRow key={row.id} className="min-h-[56px]">
                    <TableCell className="font-medium">{row.producto}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{row.lote}</TableCell>
                    <TableCell>{row.clienteAsignado}</TableCell>
                    <TableCell className="whitespace-nowrap">{format(row.fechaVencimiento, "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-bold text-sm",
                        row.diasRestantes <= 5 ? "text-red-600" : row.diasRestantes <= 7 ? "text-amber-600" : "text-yellow-600"
                      )}>
                        {row.diasRestantes}d
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap", badge.cls)}>
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded font-medium">{row.canal}</span>
                    </TableCell>
                    <TableCell>
                      <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded font-medium">{row.ruta}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          className="min-h-[48px] gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => setDetailAlerta(row)}
                        >
                          <Eye size={16} />
                          Ver trazabilidad
                        </Button>
                        {canSendPool && (
                          <Button
                            variant="ghost"
                            className="min-h-[48px] gap-1.5 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                            onClick={() => handleEnviarPool(row.id)}
                          >
                            <ArrowRight size={16} />
                            Pool GG
                          </Button>
                        )}
                        {row.enviadoPoolGG && (
                          <span className="text-xs text-purple-600 font-medium px-2 py-1 bg-purple-50 rounded-full">
                            ✓ Enviado
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No hay alertas con los filtros seleccionados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Trazabilidad Detail Sheet */}
      <Sheet open={!!detailAlerta} onOpenChange={(open) => !open && setDetailAlerta(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Trazabilidad del Lote</SheetTitle>
            <SheetDescription>
              {detailAlerta?.lote} — {detailAlerta?.producto}
            </SheetDescription>
          </SheetHeader>
          {detailAlerta && (
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <DetailField label="Producto" value={detailAlerta.producto} />
                <DetailField label="SKU" value={detailAlerta.sku} />
                <DetailField label="Lote" value={detailAlerta.lote} />
                <DetailField label="Cliente" value={detailAlerta.clienteAsignado} />
                <DetailField label="Canal" value={detailAlerta.canal} />
                <DetailField label="Ruta" value={detailAlerta.ruta} />
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de vencimiento</p>
                  <p className="text-sm font-medium">{format(detailAlerta.fechaVencimiento, "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Alerta</p>
                  {(() => {
                    const badge = ALERTA_BADGE[detailAlerta.tipoAlerta];
                    return <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", badge.cls)}>{badge.label}</span>;
                  })()}
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Historial del Lote
                </p>
                <div className="space-y-0">
                  {detailAlerta.trazabilidad.map((entry, i) => (
                    <div key={i} className="flex gap-3 pb-4 relative">
                      {/* Timeline line */}
                      {i < detailAlerta.trazabilidad.length - 1 && (
                        <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
                      )}
                      <div className="w-4 h-4 rounded-full bg-primary shrink-0 mt-0.5 relative z-10" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{entry.evento}</p>
                        <p className="text-xs text-muted-foreground">{entry.detalle}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(entry.fecha, "dd/MM/yyyy", { locale: es })} — {entry.usuario}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full min-h-[48px]" onClick={() => setDetailAlerta(null)}>
                Cerrar
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
