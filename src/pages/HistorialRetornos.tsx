import { useState, useMemo } from "react";
import { format, subDays, parse } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, DownloadCloud, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Condicion = "OPTIMO" | "DEFECTO_ESTETICO" | "PROXIMO_VENCER" | "VENCIDO" | "DANADO";
type Destino = "REINGRESO" | "STOCK_FLOTANTE" | "POOL_GG" | "MERMA";

interface DetailRow {
  producto: string;
  lote: string;
  cantidad: number;
  condicion: Condicion;
  destino: Destino;
  hora: string;
}

interface DespachoGroup {
  fecha: string; // dd/MM/yyyy
  nDespacho: string;
  productos: DetailRow[];
}

interface VendedorGroup {
  vendedor: string;
  ruta: string;
  despachos: DespachoGroup[];
}

const DATA: VendedorGroup[] = [
  {
    vendedor: "Juan López", ruta: "LIM-01",
    despachos: [
      { fecha: "28/04/2026", nDespacho: "DSP-2026-0018", productos: [
        { producto: "Panetón Clásico 900g", lote: "L-2026-008", cantidad: 12, condicion: "OPTIMO", destino: "REINGRESO", hora: "14:32" },
        { producto: "Panetón Clásico 900g", lote: "L-2026-005", cantidad: 3, condicion: "PROXIMO_VENCER", destino: "POOL_GG", hora: "14:32" },
        { producto: "Pan de Molde 500g", lote: "L-2026-009", cantidad: 4, condicion: "DEFECTO_ESTETICO", destino: "POOL_GG", hora: "14:35" },
      ]},
      { fecha: "25/04/2026", nDespacho: "DSP-2026-0014", productos: [
        { producto: "Croissant x6", lote: "L-2026-003", cantidad: 6, condicion: "DEFECTO_ESTETICO", destino: "POOL_GG", hora: "09:10" },
        { producto: "Empanada Pollo x12", lote: "L-2026-007", cantidad: 2, condicion: "OPTIMO", destino: "STOCK_FLOTANTE", hora: "09:12" },
      ]},
      { fecha: "22/04/2026", nDespacho: "DSP-2026-0011", productos: [
        { producto: "Torta Tres Leches 1kg", lote: "L-2026-010", cantidad: 3, condicion: "VENCIDO", destino: "MERMA", hora: "16:55" },
        { producto: "Panetón Clásico 900g", lote: "L-2026-008", cantidad: 5, condicion: "OPTIMO", destino: "REINGRESO", hora: "16:57" },
      ]},
      { fecha: "18/04/2026", nDespacho: "DSP-2026-0008", productos: [
        { producto: "Pan de Molde 500g", lote: "L-2026-006", cantidad: 4, condicion: "DANADO", destino: "MERMA", hora: "11:20" },
        { producto: "Croissant x6", lote: "L-2026-004", cantidad: 2, condicion: "OPTIMO", destino: "REINGRESO", hora: "11:22" },
      ]},
      { fecha: "14/04/2026", nDespacho: "DSP-2026-0004", productos: [
        { producto: "Empanada Pollo x12", lote: "L-2026-002", cantidad: 1, condicion: "PROXIMO_VENCER", destino: "POOL_GG", hora: "10:05" },
      ]},
    ],
  },
  {
    vendedor: "Carlos Ríos", ruta: "LIM-03",
    despachos: [
      { fecha: "28/04/2026", nDespacho: "DSP-2026-0016", productos: [
        { producto: "Empanada Pollo x12", lote: "L-2026-007", cantidad: 5, condicion: "DEFECTO_ESTETICO", destino: "POOL_GG", hora: "11:15" },
        { producto: "Torta Tres Leches 1kg", lote: "L-2026-010", cantidad: 2, condicion: "VENCIDO", destino: "MERMA", hora: "11:15" },
      ]},
      { fecha: "24/04/2026", nDespacho: "DSP-2026-0013", productos: [
        { producto: "Panetón Clásico 900g", lote: "L-2026-008", cantidad: 6, condicion: "OPTIMO", destino: "STOCK_FLOTANTE", hora: "15:40" },
        { producto: "Pan de Molde 500g", lote: "L-2026-009", cantidad: 3, condicion: "PROXIMO_VENCER", destino: "POOL_GG", hora: "15:42" },
      ]},
      { fecha: "20/04/2026", nDespacho: "DSP-2026-0010", productos: [
        { producto: "Croissant x6", lote: "L-2026-005", cantidad: 4, condicion: "DEFECTO_ESTETICO", destino: "POOL_GG", hora: "08:30" },
        { producto: "Empanada Pollo x12", lote: "L-2026-003", cantidad: 5, condicion: "OPTIMO", destino: "REINGRESO", hora: "08:32" },
      ]},
      { fecha: "15/04/2026", nDespacho: "DSP-2026-0005", productos: [
        { producto: "Torta Tres Leches 1kg", lote: "L-2026-002", cantidad: 3, condicion: "VENCIDO", destino: "MERMA", hora: "17:10" },
        { producto: "Pan de Molde 500g", lote: "L-2026-001", cantidad: 3, condicion: "OPTIMO", destino: "REINGRESO", hora: "17:12" },
      ]},
    ],
  },
  {
    vendedor: "Pedro Soto", ruta: "LIM-02",
    despachos: [
      { fecha: "27/04/2026", nDespacho: "DSP-2026-0017", productos: [
        { producto: "Pan de Molde 500g", lote: "L-2026-009", cantidad: 8, condicion: "OPTIMO", destino: "STOCK_FLOTANTE", hora: "16:45" },
        { producto: "Croissant x6", lote: "L-2026-011", cantidad: 4, condicion: "DANADO", destino: "MERMA", hora: "16:47" },
      ]},
      { fecha: "23/04/2026", nDespacho: "DSP-2026-0012", productos: [
        { producto: "Panetón Clásico 900g", lote: "L-2026-007", cantidad: 5, condicion: "PROXIMO_VENCER", destino: "POOL_GG", hora: "14:20" },
        { producto: "Empanada Pollo x12", lote: "L-2026-006", cantidad: 3, condicion: "OPTIMO", destino: "REINGRESO", hora: "14:22" },
      ]},
      { fecha: "19/04/2026", nDespacho: "DSP-2026-0009", productos: [
        { producto: "Torta Tres Leches 1kg", lote: "L-2026-004", cantidad: 4, condicion: "DEFECTO_ESTETICO", destino: "POOL_GG", hora: "10:50" },
      ]},
      { fecha: "12/04/2026", nDespacho: "DSP-2026-0003", productos: [
        { producto: "Croissant x6", lote: "L-2026-001", cantidad: 4, condicion: "VENCIDO", destino: "MERMA", hora: "09:30" },
      ]},
    ],
  },
  {
    vendedor: "Ana García", ruta: "LIM-04",
    despachos: [
      { fecha: "26/04/2026", nDespacho: "DSP-2026-0015", productos: [
        { producto: "Panetón Clásico 900g", lote: "L-2026-010", cantidad: 6, condicion: "OPTIMO", destino: "REINGRESO", hora: "13:15" },
        { producto: "Pan de Molde 500g", lote: "L-2026-008", cantidad: 2, condicion: "DANADO", destino: "MERMA", hora: "13:17" },
      ]},
      { fecha: "21/04/2026", nDespacho: "DSP-2026-0006", productos: [
        { producto: "Empanada Pollo x12", lote: "L-2026-005", cantidad: 4, condicion: "DEFECTO_ESTETICO", destino: "POOL_GG", hora: "15:00" },
        { producto: "Croissant x6", lote: "L-2026-003", cantidad: 2, condicion: "PROXIMO_VENCER", destino: "POOL_GG", hora: "15:02" },
      ]},
    ],
  },
];

const CONDICION_LABEL: Record<Condicion, string> = {
  OPTIMO: "Óptimo",
  DEFECTO_ESTETICO: "Defecto Estético",
  PROXIMO_VENCER: "Próximo a Vencer",
  VENCIDO: "Vencido",
  DANADO: "Dañado",
};

const CONDICION_BADGE: Record<Condicion, string> = {
  OPTIMO: "bg-green-100 text-green-700",
  DEFECTO_ESTETICO: "bg-orange-100 text-orange-700",
  PROXIMO_VENCER: "bg-amber-100 text-amber-700",
  VENCIDO: "bg-red-100 text-red-700",
  DANADO: "bg-red-100 text-red-700",
};

const DESTINO_LABEL: Record<Destino, string> = {
  REINGRESO: "Reingreso",
  STOCK_FLOTANTE: "Stock Flotante",
  POOL_GG: "Pool GG",
  MERMA: "Merma",
};

const DESTINO_BADGE: Record<Destino, string> = {
  REINGRESO: "bg-blue-100 text-blue-700",
  STOCK_FLOTANTE: "bg-sky-100 text-sky-700",
  POOL_GG: "bg-purple-100 text-purple-700",
  MERMA: "bg-red-100 text-red-700",
};

function parseFecha(s: string): Date {
  return parse(s, "dd/MM/yyyy", new Date());
}

export default function HistorialRetornos() {
  const today = new Date(2026, 3, 28);
  const [dateFrom, setDateFrom] = useState<Date>(subDays(today, 30));
  const [dateTo, setDateTo] = useState<Date>(today);
  const [vendedorFilter, setVendedorFilter] = useState("all");
  const [condicionFilter, setCondicionFilter] = useState("all");
  const [destinoFilter, setDestinoFilter] = useState("all");
  const [collapsedVendedor, setCollapsedVendedor] = useState<Record<string, boolean>>({});
  const [collapsedDespacho, setCollapsedDespacho] = useState<Record<string, boolean>>({});

  const vendedores = useMemo(() => DATA.map((v) => v.vendedor), []);

  const filteredData = useMemo(() => {
    return DATA
      .filter((v) => vendedorFilter === "all" || v.vendedor === vendedorFilter)
      .map((v) => {
        const despachos = v.despachos
          .filter((d) => {
            const f = parseFecha(d.fecha);
            return f >= dateFrom && f <= dateTo;
          })
          .map((d) => ({
            ...d,
            productos: d.productos.filter((p) =>
              (condicionFilter === "all" || p.condicion === condicionFilter) &&
              (destinoFilter === "all" || p.destino === destinoFilter)
            ),
          }))
          .filter((d) => d.productos.length > 0);
        return { ...v, despachos };
      })
      .filter((v) => v.despachos.length > 0);
  }, [dateFrom, dateTo, vendedorFilter, condicionFilter, destinoFilter]);

  const toggleVendedor = (k: string) => setCollapsedVendedor((p) => ({ ...p, [k]: !p[k] }));
  const toggleDespacho = (k: string) => setCollapsedDespacho((p) => ({ ...p, [k]: !p[k] }));

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

      {/* Grouped view */}
      <div className="space-y-3">
        {filteredData.map((v) => {
          const vKey = v.vendedor;
          const vOpen = !collapsedVendedor[vKey];
          const totalUnidades = v.despachos.reduce((s, d) => s + d.productos.reduce((s2, p) => s2 + p.cantidad, 0), 0);
          return (
            <div key={vKey} className="space-y-2">
              {/* Level 1 — Vendedor */}
              <button
                onClick={() => toggleVendedor(vKey)}
                className="w-full bg-slate-100 rounded-lg px-4 py-3 font-semibold flex items-center gap-3 hover:bg-slate-200 transition-colors text-left"
              >
                {vOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span className="text-foreground">{v.vendedor}</span>
                <span className="text-sm text-muted-foreground font-normal">·</span>
                <span className="text-sm text-muted-foreground font-normal">{v.ruta}</span>
                <span className="text-sm text-muted-foreground font-normal">·</span>
                <span className="text-sm text-muted-foreground font-normal">{v.despachos.length} despachos</span>
                <span className="text-sm text-muted-foreground font-normal">·</span>
                <span className="text-sm text-muted-foreground font-normal">{totalUnidades}u retornadas</span>
              </button>

              {vOpen && (
                <div className="space-y-2">
                  {v.despachos.map((d) => {
                    const dKey = `${vKey}-${d.nDespacho}`;
                    const dOpen = !collapsedDespacho[dKey];
                    return (
                      <div key={dKey} className="ml-4 space-y-1">
                        {/* Level 2 — Despacho */}
                        <button
                          onClick={() => toggleDespacho(dKey)}
                          className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors text-left"
                        >
                          {dOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span className="text-foreground">{d.fecha}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded">{d.nDespacho}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground font-normal">{d.productos.length} producto{d.productos.length !== 1 ? "s" : ""}</span>
                        </button>

                        {/* Level 3 — Detail rows */}
                        {dOpen && (
                          <div className="ml-8 bg-white border border-slate-100 rounded overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-[11px] text-muted-foreground uppercase border-b border-slate-100">
                                  <th className="px-3 py-2 text-left font-medium">Producto</th>
                                  <th className="px-3 py-2 text-left font-medium">Lote</th>
                                  <th className="px-3 py-2 text-center font-medium">Cant.</th>
                                  <th className="px-3 py-2 text-left font-medium">Condición</th>
                                  <th className="px-3 py-2 text-left font-medium">Destino</th>
                                  <th className="px-3 py-2 text-left font-medium">Hora</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {d.productos.map((p, idx) => (
                                  <tr key={idx}>
                                    <td className="px-3 py-2 font-medium">{p.producto}</td>
                                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.lote}</td>
                                    <td className="px-3 py-2 text-center">{p.cantidad}u</td>
                                    <td className="px-3 py-2">
                                      <span className={cn("text-xs font-medium px-2 py-1 rounded-full", CONDICION_BADGE[p.condicion])}>
                                        {CONDICION_LABEL[p.condicion]}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className={cn("text-xs font-medium px-2 py-1 rounded-full", DESTINO_BADGE[p.destino])}>
                                        {DESTINO_LABEL[p.destino]}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground">{p.hora}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredData.length === 0 && (
          <div className="bg-card rounded-xl p-12 text-center shadow-sm">
            <p className="text-muted-foreground text-lg">No hay retornos en el período seleccionado</p>
          </div>
        )}
      </div>
    </div>
  );
}
