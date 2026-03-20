import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { RetornoCard } from "@/components/RetornoCard";
import { DecisionGuide } from "@/components/DecisionGuide";

export type Condicion = "OPTIMO" | "DEFECTO_ESTETICO" | "PROXIMO_VENCER" | "VENCIDO";
export type Destino = "REINGRESO" | "STOCK_FLOTANTE" | "MERMA" | "POOL_GG";
export type EstadoRetorno = "PENDIENTE" | "PROCESADO";
export type TipoRetorno = "RECHAZO_CLIENTE" | "DAÑADO" | "VENCIDO_RETORNO" | "NO_ENTREGADO" | "SOBRANTE";

export interface Retorno {
  id: string;
  producto: string;
  sku: string;
  lote: string;
  vendedor: string;
  ruta: string;
  cantidad: number;
  unidad: string;
  tipoRetorno: TipoRetorno;
  estado: EstadoRetorno;
  condicion?: Condicion;
  destino?: Destino;
  observaciones?: string;
  horaProcesado?: string;
}

const MOCK_RETORNOS: Retorno[] = [
  { id: "RET-001", producto: "Panetón Clásico 900g", sku: "PAN-CL-900", lote: "L-2026-008", vendedor: "Juan López", ruta: "LIM-01", cantidad: 12, unidad: "u", tipoRetorno: "RECHAZO_CLIENTE", estado: "PENDIENTE" },
  { id: "RET-002", producto: "Pan de Molde Blanco 500g", sku: "PAN-MB-500", lote: "L-2026-009", vendedor: "Juan López", ruta: "LIM-01", cantidad: 8, unidad: "u", tipoRetorno: "SOBRANTE", estado: "PENDIENTE" },
  { id: "RET-003", producto: "Empanada Pollo x12", sku: "EMP-PO-12", lote: "L-2026-007", vendedor: "Pedro Soto", ruta: "LIM-02", cantidad: 5, unidad: "u", tipoRetorno: "DAÑADO", estado: "PENDIENTE" },
  { id: "RET-004", producto: "Panetón Chocolate 900g", sku: "PAN-CH-900", lote: "L-2026-006", vendedor: "María Torres", ruta: "PRV-01", cantidad: 20, unidad: "u", tipoRetorno: "RECHAZO_CLIENTE", estado: "PROCESADO", condicion: "PROXIMO_VENCER", destino: "POOL_GG", horaProcesado: "16:45" },
  { id: "RET-005", producto: "Torta Tres Leches 1kg", sku: "TOR-TL-1K", lote: "L-2026-010", vendedor: "María Torres", ruta: "PRV-01", cantidad: 3, unidad: "u", tipoRetorno: "VENCIDO_RETORNO", estado: "PROCESADO", condicion: "VENCIDO", destino: "MERMA", horaProcesado: "16:50" },
];

type TabFilter = "TODOS" | "PENDIENTES" | "PROCESADOS" | "POOL_GG";

export default function RetornosPendientes() {
  const [retornos, setRetornos] = useState<Retorno[]>(MOCK_RETORNOS);
  const [date, setDate] = useState<Date>(new Date());
  const [tab, setTab] = useState<TabFilter>("TODOS");
  const [vendedorFilter, setVendedorFilter] = useState<string>("all");
  const [guideOpen, setGuideOpen] = useState(false);

  const pendientes = retornos.filter((r) => r.estado === "PENDIENTE").length;
  const procesados = retornos.filter((r) => r.estado === "PROCESADO").length;
  const enPool = retornos.filter((r) => r.destino === "POOL_GG").length;
  const mermas = retornos.filter((r) => r.destino === "MERMA").length;

  const vendedores = [...new Set(retornos.map((r) => r.vendedor))];

  const filtered = retornos.filter((r) => {
    if (tab === "PENDIENTES" && r.estado !== "PENDIENTE") return false;
    if (tab === "PROCESADOS" && r.estado !== "PROCESADO") return false;
    if (tab === "POOL_GG" && r.destino !== "POOL_GG") return false;
    if (vendedorFilter !== "all" && r.vendedor !== vendedorFilter) return false;
    return true;
  });

  const handleInspect = (id: string, condicion: Condicion, destino: Destino, observaciones: string) => {
    setRetornos((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              estado: "PROCESADO" as EstadoRetorno,
              condicion,
              destino,
              observaciones,
              horaProcesado: format(new Date(), "HH:mm"),
            }
          : r
      )
    );
  };

  const tabs: { key: TabFilter; label: string; count?: number }[] = [
    { key: "TODOS", label: "Todos" },
    { key: "PENDIENTES", label: "Pendientes", count: pendientes },
    { key: "PROCESADOS", label: "Procesados", count: procesados },
    { key: "POOL_GG", label: "En Pool GG", count: enPool },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Retornos Pendientes
          </h1>
          <p className="text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">{pendientes}</span>{" "}
            productos por inspeccionar —{" "}
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-h-[48px] gap-2">
                <CalendarIcon size={16} />
                {format(date, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            className="min-h-[48px] text-muted-foreground gap-1.5"
            onClick={() => setGuideOpen(true)}
          >
            <HelpCircle size={16} />
            Guía
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-card rounded-xl p-4 shadow-sm flex items-center divide-x divide-border">
        {[
          { label: "Pendientes", value: pendientes, cls: "text-amber-600" },
          { label: "Procesados hoy", value: procesados, cls: "text-green-600" },
          { label: "En Pool GG", value: enPool, cls: "text-purple-600" },
          { label: "Mermas", value: mermas, cls: "text-red-600" },
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
              {t.count != null && (
                <span className="ml-1.5 text-xs opacity-80">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
          <SelectTrigger className="w-[200px] min-h-[48px]">
            <SelectValue placeholder="Todos los vendedores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los vendedores</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Retorno Cards */}
      <div className="space-y-3">
        {filtered.map((retorno, i) => (
          <div
            key={retorno.id}
            className="animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <RetornoCard retorno={retorno} onInspect={handleInspect} />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-card rounded-xl p-12 text-center shadow-sm">
            <p className="text-muted-foreground text-lg">
              No hay retornos en esta categoría
            </p>
          </div>
        )}
      </div>

      {/* Decision Guide Sheet */}
      <Sheet open={guideOpen} onOpenChange={setGuideOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Guía de Decisión</SheetTitle>
            <SheetDescription>
              Referencia rápida: condición → destino recomendado
            </SheetDescription>
          </SheetHeader>
          <DecisionGuide />
        </SheetContent>
      </Sheet>
    </div>
  );
}
