import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Check, XCircle, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MOCK_RUTAS, genId, type ProductoRetorno, type LoteRetorno } from "@/types/inspector";

function sumLoteField(lotes: LoteRetorno[], field: keyof LoteRetorno): number {
  return lotes.reduce((s, l) => s + (typeof l[field] === "number" ? (l[field] as number) : 0), 0);
}

function getLoteSum(l: LoteRetorno): number {
  return l.vendido + l.optimo + l.defectoEstetico + l.proximoVencer + l.vencido;
}

function getProductSum(p: ProductoRetorno): number {
  return p.lotes.reduce((s, l) => s + getLoteSum(l), 0);
}

function isProductComplete(p: ProductoRetorno): boolean {
  const sum = getProductSum(p);
  if (sum !== p.cantDespacho) return false;
  const totalOptimo = sumLoteField(p.lotes, "optimo");
  if (totalOptimo > 0 && !p.destinoOptimo) return false;
  return true;
}

type ParentStatus = "green" | "red" | "amber" | "orange";

function getParentStatus(p: ProductoRetorno): ParentStatus {
  const sum = getProductSum(p);
  if (sum !== p.cantDespacho) return "red";
  const totalVencido = sumLoteField(p.lotes, "vencido");
  if (totalVencido > 0) return "red";
  const totalProx = sumLoteField(p.lotes, "proximoVencer");
  if (totalProx > 0) return "amber";
  const totalDef = sumLoteField(p.lotes, "defectoEstetico");
  if (totalDef > 0) return "orange";
  return "green";
}

function getParentBg(status: ParentStatus): string {
  if (status === "red") return "bg-red-50";
  if (status === "amber") return "bg-amber-50";
  if (status === "orange") return "bg-orange-50";
  return "bg-green-50";
}

export default function ControlRetorno() {
  const { rutaId } = useParams();
  const navigate = useNavigate();
  const ruta = MOCK_RUTAS.find((r) => r.id === rutaId);

  const [productos, setProductos] = useState<ProductoRetorno[]>(ruta?.productosRetorno ?? []);
  const [despachoOpen, setDespachoOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const counts = useMemo(() => {
    const total = productos.length;
    const complete = productos.filter(isProductComplete).length;
    const incomplete = total - complete;
    const mermas = productos.filter((p) => sumLoteField(p.lotes, "vencido") > 0).length;
    return { total, complete, incomplete, mermas };
  }, [productos]);

  const allComplete = useMemo(() => productos.length > 0 && productos.every(isProductComplete), [productos]);

  if (!ruta) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center">
        <p className="text-muted-foreground text-lg">Ruta no encontrada</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/inspector/rutas")}>← Volver</Button>
      </div>
    );
  }

  const salidaHadObs = ruta.salida === "CON_OBS";

  const updateLote = (prodId: string, loteId: string, field: keyof LoteRetorno, value: number | string) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.id === prodId
          ? { ...p, lotes: p.lotes.map((l) => (l.id === loteId ? { ...l, [field]: value } : l)) }
          : p
      )
    );
  };

  const addLote = (prodId: string) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.id === prodId
          ? { ...p, lotes: [...p.lotes, { id: genId(), lote: "", vendido: 0, optimo: 0, defectoEstetico: 0, proximoVencer: 0, vencido: 0, observacion: "" }] }
          : p
      )
    );
  };

  const removeLote = (prodId: string, loteId: string) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.id === prodId
          ? { ...p, lotes: p.lotes.filter((l) => l.id !== loteId) }
          : p
      )
    );
  };

  const updateDestinoOptimo = (prodId: string, value: "REINGRESO" | "STOCK_FLOTANTE") => {
    setProductos((prev) => prev.map((p) => (p.id === prodId ? { ...p, destinoOptimo: value } : p)));
  };

  const handleSubmit = () => {
    const poolGG = productos.filter((p) => sumLoteField(p.lotes, "defectoEstetico") > 0 || sumLoteField(p.lotes, "proximoVencer") > 0).length;
    const merma = productos.filter((p) => sumLoteField(p.lotes, "vencido") > 0).length;
    const stock = productos.filter((p) => sumLoteField(p.lotes, "optimo") > 0).length;
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
                    <th className="px-2 py-2 text-left font-medium">Lotes</th>
                    <th className="px-2 py-2 text-left font-medium">Estado Salida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ruta.productosSalida.map((p) => {
                    const totalDesp = p.lotes.reduce((s, l) => s + l.cantDespacho, 0);
                    const allMatch = p.lotes.every((l) => l.optimo === l.cantDespacho);
                    return (
                      <tr key={p.id}>
                        <td className="px-2 py-1.5">{p.producto}</td>
                        <td className="px-2 py-1.5 text-center">{totalDesp}</td>
                        <td className="px-2 py-1.5 text-xs text-muted-foreground">{p.lotes.map((l) => l.lote).join(", ")}</td>
                        <td className="px-2 py-1.5">
                          <span className={cn("text-xs px-2 py-0.5 rounded", allMatch ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                            {allMatch ? "OK" : "DIFERENCIA"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos de despacho disponibles.</p>
            )}
            {salidaHadObs && (
              <div className="bg-orange-50 border border-orange-200 p-2 rounded text-sm text-orange-700">
                ⚠ Esta ruta tuvo observaciones en la salida.
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
              <th className="px-3 py-3 font-medium w-[3%]"></th>
              <th className="px-3 py-3 font-medium w-[18%]">Producto</th>
              <th className="px-3 py-3 font-medium w-[7%] text-center">Cant. Desp.</th>
              <th className="px-3 py-3 font-medium w-[7%] text-center">Vendido</th>
              <th className="px-3 py-3 font-medium w-[7%] text-center">Óptimo</th>
              <th className="px-3 py-3 font-medium w-[7%] text-center">Def. Est.</th>
              <th className="px-3 py-3 font-medium w-[7%] text-center">Próx. Venc.</th>
              <th className="px-3 py-3 font-medium w-[7%] text-center">Vencido</th>
              <th className="px-3 py-3 font-medium w-[12%]">Destino Óptimo</th>
              <th className="px-3 py-3 font-medium w-[10%]">Observación</th>
              <th className="px-3 py-3 font-medium w-[4%]"></th>
            </tr>
          </thead>
          {productos.map((p) => {
            const isOpen = expanded[p.id] ?? false;
            const status = getParentStatus(p);
            const complete = isProductComplete(p);
            const totalVendido = sumLoteField(p.lotes, "vendido");
            const totalOptimo = sumLoteField(p.lotes, "optimo");
            const totalDefEst = sumLoteField(p.lotes, "defectoEstetico");
            const totalProx = sumLoteField(p.lotes, "proximoVencer");
            const totalVencido = sumLoteField(p.lotes, "vencido");
            const totalSum = getProductSum(p);
            const diff = p.cantDespacho - totalSum;

            return (
              <tbody key={p.id} className="border-b border-border">
                {/* Parent Row */}
                <tr
                  className={cn("min-h-[56px] cursor-pointer hover:bg-muted/30 transition-colors", getParentBg(status))}
                  onClick={() => toggleExpand(p.id)}
                >
                  <td className="px-3 py-2">
                    {isOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{p.producto}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </td>
                  <td className="px-3 py-2 text-sm text-center font-medium">{p.cantDespacho}</td>
                  <td className="px-3 py-2 text-sm text-center">{totalVendido}</td>
                  <td className="px-3 py-2 text-sm text-center font-bold">{totalOptimo}</td>
                  <td className="px-3 py-2 text-sm text-center">
                    {totalDefEst}
                    {totalDefEst > 0 && <span className="block text-[9px] font-medium px-1 py-0.5 rounded bg-purple-100 text-purple-700 mt-0.5">Pool GG</span>}
                  </td>
                  <td className="px-3 py-2 text-sm text-center">
                    {totalProx}
                    {totalProx > 0 && <span className="block text-[9px] font-medium px-1 py-0.5 rounded bg-purple-100 text-purple-700 mt-0.5">Pool GG</span>}
                  </td>
                  <td className="px-3 py-2 text-sm text-center">
                    {totalVencido}
                    {totalVencido > 0 && <span className="block text-[9px] font-medium px-1 py-0.5 rounded bg-red-100 text-red-700 mt-0.5">Merma</span>}
                  </td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    {totalOptimo > 0 ? (
                      <Select
                        value={p.destinoOptimo ?? ""}
                        onValueChange={(v) => updateDestinoOptimo(p.id, v as "REINGRESO" | "STOCK_FLOTANTE")}
                      >
                        <SelectTrigger className="w-[130px] min-h-[40px] text-sm">
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
                  <td className="px-3 py-2 text-sm text-muted-foreground">—</td>
                  <td className="px-3 py-2 text-center">
                    {complete ? (
                      <Check size={18} className="text-green-600 mx-auto" />
                    ) : (
                      <div className="text-center">
                        <XCircle size={18} className="text-red-500 mx-auto" />
                        {diff !== 0 && <p className="text-[9px] text-red-600">Faltan {diff}u</p>}
                      </div>
                    )}
                  </td>
                </tr>

                {/* Lot Sub-Rows */}
                {isOpen && p.lotes.map((l) => {
                  const lSum = getLoteSum(l);
                  return (
                    <tr key={l.id} className="bg-slate-50 min-h-[48px]">
                      <td className="px-3 py-2 text-right text-muted-foreground text-xs">└</td>
                      <td className="px-3 py-2">
                        <Input
                          value={l.lote}
                          onChange={(e) => updateLote(p.id, l.id, "lote", e.target.value)}
                          placeholder="Lote"
                          className="w-28 min-h-[40px] text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground">—</td>
                      <td className="px-3 py-2">
                        <Input type="number" min={0} value={l.vendido}
                          onChange={(e) => updateLote(p.id, l.id, "vendido", parseInt(e.target.value) || 0)}
                          className="w-14 min-h-[40px] text-center" />
                      </td>
                      <td className="px-3 py-2">
                        <Input type="number" min={0} value={l.optimo}
                          onChange={(e) => updateLote(p.id, l.id, "optimo", parseInt(e.target.value) || 0)}
                          className="w-14 min-h-[40px] text-center" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-0.5">
                          <Input type="number" min={0} value={l.defectoEstetico}
                            onChange={(e) => updateLote(p.id, l.id, "defectoEstetico", parseInt(e.target.value) || 0)}
                            className="w-14 min-h-[40px] text-center" />
                          {l.defectoEstetico > 0 && <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-purple-100 text-purple-700 block text-center">Pool GG</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-0.5">
                          <Input type="number" min={0} value={l.proximoVencer}
                            onChange={(e) => updateLote(p.id, l.id, "proximoVencer", parseInt(e.target.value) || 0)}
                            className="w-14 min-h-[40px] text-center" />
                          {l.proximoVencer > 0 && <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-purple-100 text-purple-700 block text-center">Pool GG</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-0.5">
                          <Input type="number" min={0} value={l.vencido}
                            onChange={(e) => updateLote(p.id, l.id, "vencido", parseInt(e.target.value) || 0)}
                            className="w-14 min-h-[40px] text-center" />
                          {l.vencido > 0 && <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-red-100 text-red-700 block text-center">Merma</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">—</td>
                      <td className="px-3 py-2">
                        <Input
                          value={l.observacion}
                          onChange={(e) => updateLote(p.id, l.id, "observacion", e.target.value)}
                          placeholder="—"
                          className="w-full min-h-[40px] text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          disabled={p.lotes.length <= 1}
                          onClick={() => removeLote(p.id, l.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {/* Add lot button */}
                {isOpen && (
                  <tr className="bg-slate-50">
                    <td className="px-3 py-2 text-right text-muted-foreground text-xs">└</td>
                    <td colSpan={10} className="px-3 py-2">
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => addLote(p.id)}>
                        <Plus size={14} className="mr-1" /> Agregar lote
                      </Button>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Agrega un lote si identificas productos vencidos o por vencer de un lote diferente
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            );
          })}
          {productos.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={11} className="px-3 py-12 text-center text-muted-foreground">
                  No hay productos de retorno para esta ruta
                </td>
              </tr>
            </tbody>
          )}
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
