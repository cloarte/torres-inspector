import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ChevronDown, ChevronUp, Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MOCK_RUTAS, type ProductoRetorno } from "@/types/inspector";

function getRowSum(p: ProductoRetorno): number {
  return p.vendido + p.optimo + p.defectoEstetico + p.proximoVencer + p.vencido;
}

function getRowBg(p: ProductoRetorno): string {
  const sum = getRowSum(p);
  if (sum !== p.cantDespacho) return "bg-red-50";
  if (p.vencido > 0) return "bg-red-50";
  if (p.proximoVencer > 0) return "bg-amber-50";
  if (p.defectoEstetico > 0) return "bg-orange-50";
  return "bg-green-50";
}

function isRowComplete(p: ProductoRetorno): boolean {
  const sum = getRowSum(p);
  if (sum !== p.cantDespacho) return false;
  if (p.optimo > 0 && !p.destinoOptimo) return false;
  return true;
}

export default function ControlRetorno() {
  const { rutaId } = useParams();
  const navigate = useNavigate();
  const ruta = MOCK_RUTAS.find((r) => r.id === rutaId);

  const [productos, setProductos] = useState<ProductoRetorno[]>(ruta?.productosRetorno ?? []);
  const [despachoOpen, setDespachoOpen] = useState(false);

  const counts = useMemo(() => {
    const total = productos.length;
    const complete = productos.filter(isRowComplete).length;
    const incomplete = total - complete;
    const mermas = productos.filter((p) => p.vencido > 0).length;
    return { total, complete, incomplete, mermas };
  }, [productos]);

  const allComplete = useMemo(() => productos.length > 0 && productos.every(isRowComplete), [productos]);

  if (!ruta) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center">
        <p className="text-muted-foreground text-lg">Ruta no encontrada</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/inspector/rutas")}>← Volver</Button>
      </div>
    );
  }

  const salidaHadObs = ruta.salida === "CON_OBS";
  const salidaObsCount = ruta.productosSalida.filter((p) => p.optimo !== p.cantDespacho).length;

  const updateProducto = (id: string, field: keyof ProductoRetorno, value: number | string | undefined) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = () => {
    const poolGG = productos.filter((p) => p.defectoEstetico > 0 || p.proximoVencer > 0).length;
    const merma = productos.filter((p) => p.vencido > 0).length;
    const stock = productos.filter((p) => p.optimo > 0).length;
    toast(`✓ Retorno ${ruta.codigo} completado — ${stock} al Stock/Almacén · ${poolGG} al Pool GG · ${merma} a Merma`, { duration: 5000 });
    navigate("/inspector/rutas");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-24">
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
                    <th className="px-2 py-2 text-center font-medium">Óptimo Salida</th>
                    <th className="px-2 py-2 text-left font-medium">Estado Salida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ruta.productosSalida.map((p) => (
                    <tr key={p.id}>
                      <td className="px-2 py-1.5">{p.producto}</td>
                      <td className="px-2 py-1.5 text-center">{p.cantDespacho}</td>
                      <td className="px-2 py-1.5 text-center">{p.optimo}</td>
                      <td className="px-2 py-1.5">
                        <span className={cn("text-xs px-2 py-0.5 rounded", p.optimo === p.cantDespacho ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                          {p.optimo === p.cantDespacho ? "OK" : "DIFERENCIA"}
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
          { label: "Productos", value: counts.total, cls: "text-muted-foreground" },
          { label: "Clasificados", value: counts.complete, cls: "text-green-600" },
          { label: "Pendientes", value: counts.incomplete, cls: "text-amber-600" },
          { label: "Con Merma", value: counts.mermas, cls: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="flex-1 text-center px-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Retorno Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-xs text-muted-foreground uppercase">
              <th className="px-3 py-3 font-medium w-[22%]">Producto</th>
              <th className="px-3 py-3 font-medium w-[8%]">Lote</th>
              <th className="px-3 py-3 font-medium w-[8%] text-center">Cant. Desp.</th>
              <th className="px-3 py-3 font-medium w-[8%]">Vendido</th>
              <th className="px-3 py-3 font-medium w-[8%]">Óptimo</th>
              <th className="px-3 py-3 font-medium w-[8%]">Def. Est.</th>
              <th className="px-3 py-3 font-medium w-[8%]">Próx. Venc.</th>
              <th className="px-3 py-3 font-medium w-[8%]">Vencido</th>
              <th className="px-3 py-3 font-medium w-[12%]">Destino Óptimo</th>
              <th className="px-3 py-3 font-medium w-[10%]">Observación</th>
              <th className="px-3 py-3 font-medium w-[4%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {productos.map((p) => {
              const sum = getRowSum(p);
              const diff = p.cantDespacho - sum;
              const complete = isRowComplete(p);
              return (
                <tr key={p.id} className={cn("min-h-[56px]", getRowBg(p))}>
                  <td className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{p.producto}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </td>
                  <td className="px-3 py-2 text-sm">{p.lote}</td>
                  <td className="px-3 py-2 text-sm text-center font-medium">{p.cantDespacho}</td>
                  <td className="px-3 py-2">
                    <Input type="number" min={0} value={p.vendido}
                      onChange={(e) => updateProducto(p.id, "vendido", parseInt(e.target.value) || 0)}
                      className="w-16 min-h-[48px] text-center" />
                  </td>
                  <td className="px-3 py-2">
                    <Input type="number" min={0} value={p.optimo}
                      onChange={(e) => updateProducto(p.id, "optimo", parseInt(e.target.value) || 0)}
                      className="w-16 min-h-[48px] text-center" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <Input type="number" min={0} value={p.defectoEstetico}
                        onChange={(e) => updateProducto(p.id, "defectoEstetico", parseInt(e.target.value) || 0)}
                        className="w-16 min-h-[48px] text-center" />
                      {p.defectoEstetico > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 block text-center">Pool GG</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <Input type="number" min={0} value={p.proximoVencer}
                        onChange={(e) => updateProducto(p.id, "proximoVencer", parseInt(e.target.value) || 0)}
                        className="w-16 min-h-[48px] text-center" />
                      {p.proximoVencer > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 block text-center">Pool GG</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <Input type="number" min={0} value={p.vencido}
                        onChange={(e) => updateProducto(p.id, "vencido", parseInt(e.target.value) || 0)}
                        className="w-16 min-h-[48px] text-center" />
                      {p.vencido > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 block text-center">Merma</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {p.optimo > 0 ? (
                      <Select
                        value={p.destinoOptimo ?? ""}
                        onValueChange={(v) => updateProducto(p.id, "destinoOptimo", v as "REINGRESO" | "STOCK_FLOTANTE")}
                      >
                        <SelectTrigger className="w-[140px] min-h-[48px] text-sm">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REINGRESO">REINGRESO</SelectItem>
                          <SelectItem value="STOCK_FLOTANTE">STOCK FLOTANTE</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Input value={p.observacion}
                      onChange={(e) => updateProducto(p.id, "observacion", e.target.value)}
                      placeholder="—" className="w-full min-h-[48px] text-sm" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {complete ? (
                      <Check size={18} className="text-green-600 mx-auto" />
                    ) : (
                      <div className="text-center">
                        <XCircle size={18} className="text-red-500 mx-auto" />
                        {diff !== 0 && <p className="text-[10px] text-red-600 mt-0.5">Faltan {diff}u</p>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {productos.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-12 text-center text-muted-foreground">
                  No hay productos de retorno para esta ruta
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg p-4 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" className="min-h-[48px]" onClick={() => navigate("/inspector/rutas")}>
            Cancelar
          </Button>
          {allComplete ? (
            <Button className="min-h-[48px] bg-green-600 hover:bg-green-700 text-white" onClick={handleSubmit}>
              ✓ Completar Inspección de Retorno
            </Button>
          ) : (
            <Button className="min-h-[48px]" disabled>
              Clasifica todos los productos para continuar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
