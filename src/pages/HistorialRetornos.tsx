import { useState, useMemo } from "react";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, DownloadCloud, Eye, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Condicion, Destino } from "@/pages/RetornosPendientes";

interface HistorialRow {
  id: string;
  fecha: Date;
  vendedor: string;
  ruta: string;
  producto: string;
  sku: string;
  lote: string;
  cantidad: number;
  unidad: string;
  condicion: Condicion;
  destino: Destino;
  procesadoPor: string;
  hora: string;
  observaciones?: string;
}

const MOCK_HISTORIAL: HistorialRow[] = [
  { id: "H-001", fecha: new Date(2026, 2, 20), vendedor: "Juan López", ruta: "LIM-01", producto: "Panetón Clásico 900g", sku: "PAN-CL-900", lote: "L-2026-005", cantidad: 12, unidad: "u", condicion: "PROXIMO_VENCER", destino: "POOL_GG", procesadoPor: "Inspector", hora: "17:30", observaciones: "Producto con fecha próxima, enviado a pool GG para decisión." },
  { id: "H-002", fecha: new Date(2026, 2, 20), vendedor: "Juan López", ruta: "LIM-01", producto: "Pan de Molde Blanco 500g", sku: "PAN-MB-500", lote: "L-2026-009", cantidad: 8, unidad: "u", condicion: "OPTIMO", destino: "REINGRESO", procesadoPor: "Inspector", hora: "17:35" },
  { id: "H-003", fecha: new Date(2026, 2, 20), vendedor: "Pedro Soto", ruta: "LIM-02", producto: "Empanada Pollo x12", sku: "EMP-PO-12", lote: "L-2026-007", cantidad: 5, unidad: "u", condicion: "DEFECTO_ESTETICO", destino: "POOL_GG", procesadoPor: "Inspector", hora: "18:02", observaciones: "Empaque dañado en la parte superior, producto apto para consumo." },
  { id: "H-004", fecha: new Date(2026, 2, 19), vendedor: "María Torres", ruta: "PRV-01", producto: "Panetón Chocolate 900g", sku: "PAN-CH-900", lote: "L-2026-006", cantidad: 20, unidad: "u", condicion: "PROXIMO_VENCER", destino: "POOL_GG", procesadoPor: "Inspector", hora: "16:45" },
  { id: "H-005", fecha: new Date(2026, 2, 19), vendedor: "María Torres", ruta: "PRV-01", producto: "Torta Tres Leches 1kg", sku: "TOR-TL-1K", lote: "L-2026-010", cantidad: 3, unidad: "u", condicion: "VENCIDO", destino: "MERMA", procesadoPor: "Inspector", hora: "16:50", observaciones: "Producto completamente vencido, no apto para consumo." },
];

const CONDICION_BADGE: Record<Condicion, string> = {
  OPTIMO: "bg-green-100 text-green-700",
  DEFECTO_ESTETICO: "bg-orange-100 text-orange-700",
  PROXIMO_VENCER: "bg-amber-100 text-amber-700",
  VENCIDO: "bg-red-100 text-red-700",
};

const CONDICION_LABEL: Record<Condicion, string> = {
  OPTIMO: "Óptimo",
  DEFECTO_ESTETICO: "Defecto Estético",
  PROXIMO_VENCER: "Próximo a Vencer",
  VENCIDO: "Vencido",
};

const DESTINO_BADGE: Record<Destino, string> = {
  REINGRESO: "bg-green-100 text-green-700",
  STOCK_FLOTANTE: "bg-blue-100 text-blue-700",
  MERMA: "bg-red-100 text-red-700",
  POOL_GG: "bg-purple-100 text-purple-700",
};

const DESTINO_LABEL: Record<Destino, string> = {
  REINGRESO: "Reingreso",
  STOCK_FLOTANTE: "Stock Flotante",
  MERMA: "Merma",
  POOL_GG: "Pool GG",
};

type SortKey = "fecha" | "vendedor" | "producto" | "cantidad";
type SortDir = "asc" | "desc";

export default function HistorialRetornos() {
  const today = new Date();
  const [dateFrom, setDateFrom] = useState<Date>(subDays(today, 7));
  const [dateTo, setDateTo] = useState<Date>(today);
  const [vendedorFilter, setVendedorFilter] = useState("all");
  const [condicionFilter, setCondicionFilter] = useState("all");
  const [destinoFilter, setDestinoFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("fecha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [detailRow, setDetailRow] = useState<HistorialRow | null>(null);

  const vendedores = [...new Set(MOCK_HISTORIAL.map((r) => r.vendedor))];

  const filtered = useMemo(() => {
    let rows = MOCK_HISTORIAL.filter((r) => {
      if (!isWithinInterval(r.fecha, { start: startOfDay(dateFrom), end: endOfDay(dateTo) })) return false;
      if (vendedorFilter !== "all" && r.vendedor !== vendedorFilter) return false;
      if (condicionFilter !== "all" && r.condicion !== condicionFilter) return false;
      if (destinoFilter !== "all" && r.destino !== destinoFilter) return false;
      return true;
    });

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "fecha": cmp = a.fecha.getTime() - b.fecha.getTime(); break;
        case "vendedor": cmp = a.vendedor.localeCompare(b.vendedor); break;
        case "producto": cmp = a.producto.localeCompare(b.producto); break;
        case "cantidad": cmp = a.cantidad - b.cantidad; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [dateFrom, dateTo, vendedorFilter, condicionFilter, destinoFilter, sortKey, sortDir]);

  const summary = useMemo(() => ({
    total: filtered.length,
    reingreso: filtered.filter((r) => r.destino === "REINGRESO").length,
    merma: filtered.filter((r) => r.destino === "MERMA").length,
    poolGG: filtered.filter((r) => r.destino === "POOL_GG").length,
  }), [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold text-foreground">Historial de Retornos</h1>
        <Button variant="outline" className="min-h-[48px] gap-2">
          <DownloadCloud size={16} />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-h-[48px] gap-2 text-sm">
              <CalendarIcon size={16} />
              {format(dateFrom, "dd/MM/yy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-sm">—</span>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-h-[48px] gap-2 text-sm">
              <CalendarIcon size={16} />
              {format(dateTo, "dd/MM/yy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>

        <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
          <SelectTrigger className="w-[180px] min-h-[48px]">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los vendedores</SelectItem>
            {vendedores.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={condicionFilter} onValueChange={setCondicionFilter}>
          <SelectTrigger className="w-[180px] min-h-[48px]">
            <SelectValue placeholder="Condición" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las condiciones</SelectItem>
            {(Object.keys(CONDICION_LABEL) as Condicion[]).map((c) => (
              <SelectItem key={c} value={c}>{CONDICION_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={destinoFilter} onValueChange={setDestinoFilter}>
          <SelectTrigger className="w-[160px] min-h-[48px]">
            <SelectValue placeholder="Destino" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los destinos</SelectItem>
            {(Object.keys(DESTINO_LABEL) as Destino[]).map((d) => (
              <SelectItem key={d} value={d}>{DESTINO_LABEL[d]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Fecha" sortKeyName="fecha" /></TableHead>
                <TableHead><SortHeader label="Vendedor" sortKeyName="vendedor" /></TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead><SortHeader label="Producto" sortKeyName="producto" /></TableHead>
                <TableHead>Lote</TableHead>
                <TableHead><SortHeader label="Cant." sortKeyName="cantidad" /></TableHead>
                <TableHead>Condición</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Procesado por</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">{format(row.fecha, "dd/MM", { locale: es })}</TableCell>
                  <TableCell>{row.vendedor}</TableCell>
                  <TableCell><span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded font-medium">{row.ruta}</span></TableCell>
                  <TableCell className="font-medium">{row.producto}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.lote}</TableCell>
                  <TableCell>{row.cantidad}{row.unidad}</TableCell>
                  <TableCell>
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", CONDICION_BADGE[row.condicion])}>
                      {CONDICION_LABEL[row.condicion]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", DESTINO_BADGE[row.destino])}>
                      {DESTINO_LABEL[row.destino]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.procesadoPor}</TableCell>
                  <TableCell className="text-muted-foreground">{row.hora}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" onClick={() => setDetailRow(row)}>
                      <Eye size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                    No hay retornos en el período seleccionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Row */}
        {filtered.length > 0 && (
          <div className="bg-muted/50 border-t border-border px-4 py-3 flex items-center gap-6 text-sm font-semibold">
            <span>Total período: {summary.total} retornos</span>
            <span className="text-green-700">{summary.reingreso} Reingreso</span>
            <span className="text-red-700">{summary.merma} Merma</span>
            <span className="text-purple-700">{summary.poolGG} Pool GG</span>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailRow} onOpenChange={(open) => !open && setDetailRow(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalle de Inspección</SheetTitle>
            <SheetDescription>
              {detailRow?.id} — {detailRow && format(detailRow.fecha, "dd/MM/yyyy")}
            </SheetDescription>
          </SheetHeader>
          {detailRow && (
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <DetailField label="Producto" value={detailRow.producto} />
                <DetailField label="SKU" value={detailRow.sku} />
                <DetailField label="Lote" value={detailRow.lote} />
                <DetailField label="Cantidad" value={`${detailRow.cantidad} ${detailRow.unidad}`} />
                <DetailField label="Vendedor" value={detailRow.vendedor} />
                <DetailField label="Ruta" value={detailRow.ruta} />
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Condición</p>
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", CONDICION_BADGE[detailRow.condicion])}>
                    {CONDICION_LABEL[detailRow.condicion]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Destino</p>
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", DESTINO_BADGE[detailRow.destino])}>
                    {DESTINO_LABEL[detailRow.destino]}
                  </span>
                </div>
                <DetailField label="Procesado por" value={detailRow.procesadoPor} />
                <DetailField label="Hora" value={detailRow.hora} />
              </div>

              {detailRow.observaciones && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{detailRow.observaciones}</p>
                </div>
              )}

              <Button
                className="w-full min-h-[48px] mt-4"
                variant="outline"
                onClick={() => setDetailRow(null)}
              >
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
