import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Check, AlertTriangle, XCircle, ChevronRight, ChevronDown, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MOCK_RUTAS, genId, type ProductoSalida, type LoteSalida } from "@/types/inspector";

type RowStatus = "green" | "orange" | "red";

function getLoteStatus(l: LoteSalida): RowStatus {
  if (l.optimo !== l.cantDespacho) return "red";
  if (l.defectoEstetico > 0 || l.danado > 0) return "orange";
  return "green";
}

function getProductStatus(p: ProductoSalida): RowStatus {
  const statuses = p.lotes.map(getLoteStatus);
  if (statuses.includes("red")) return "red";
  if (statuses.includes("orange")) return "orange";
  return "green";
}

function sumField(lotes: LoteSalida[], field: keyof LoteSalida): number {
  return lotes.reduce((s, l) => s + (typeof l[field] === "number" ? (l[field] as number) : 0), 0);
}

export default function ControlSalida() {
  const { rutaId } = useParams();
  const navigate = useNavigate();
  const ruta = MOCK_RUTAS.find((r) => r.id === rutaId);

  const [productos, setProductos] = useState<ProductoSalida[]>(ruta?.productosSalida ?? []);
  const [obsGenerales, setObsGenerales] = useState(ruta?.observacionesSalida ?? "");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (!ruta) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center">
        <p className="text-muted-foreground text-lg">Ruta no encontrada</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/inspector/rutas")}>← Volver</Button>
      </div>
    );
  }

  const pedidos = productos.filter((p) => p.tipo === "PEDIDO");
  const sobrestock = productos.filter((p) => p.tipo === "SOBRESTOCK");

  const hasDefects = productos.some((p) => p.lotes.some((l) => l.defectoEstetico > 0 || l.danado > 0));
  const allOptimoMatch = productos.every((p) => p.lotes.every((l) => l.optimo === l.cantDespacho));
  const defectProducts = productos.filter((p) => p.lotes.some((l) => l.defectoEstetico > 0 || l.danado > 0));

  const updateLote = (prodId: string, loteId: string, field: keyof LoteSalida, value: number | string) => {
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
          ? { ...p, lotes: [...p.lotes, { id: genId(), lote: "", cantDespacho: 0, optimo: 0, defectoEstetico: 0, danado: 0, observacion: "" }] }
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

  const updateProductObs = (prodId: string, value: string) => {
    setProductos((prev) => prev.map((p) => (p.id === prodId ? { ...p, observacion: value } : p)));
  };

  const handleSubmit = (conObs: boolean) => {
    if (conObs) {
      toast("⚠ Observaciones registradas. Notificando a Rosnelli...", { duration: 4000 });
    } else {
      toast(`✓ Salida verificada — ${ruta.codigo} lista para partir`, { duration: 4000 });
    }
    navigate("/inspector/rutas");
  };

  const statusBadge = ruta.salida === "PENDIENTE"
    ? "bg-amber-100 text-amber-700"
    : ruta.salida === "CON_OBS"
    ? "bg-orange-100 text-orange-700"
    : "bg-green-100 text-green-700";

  const footerState: "green" | "orange" | "disabled" = !allOptimoMatch
    ? "disabled"
    : hasDefects
    ? "orange"
    : "green";

  const totalProducts = productos.reduce((s, p) => s + p.lotes.length, 0);

  function renderProductGroup(items: ProductoSalida[]) {
    return items.map((p) => {
      const status = getProductStatus(p);
      const isOpen = expanded[p.id] ?? false;
      const totalDespacho = sumField(p.lotes, "cantDespacho");
      const totalOptimo = sumField(p.lotes, "optimo");
      const totalDefEst = sumField(p.lotes, "defectoEstetico");
      const totalDanado = sumField(p.lotes, "danado");

      return (
        <tbody key={p.id} className="border-b border-border">
          {/* Parent Row */}
          <tr
            className={cn(
              "min-h-[56px] cursor-pointer hover:bg-muted/30 transition-colors",
              status === "red" && "bg-red-50",
              status === "orange" && "bg-orange-50",
              p.tipo === "SOBRESTOCK" && "border-l-2 border-blue-300"
            )}
            onClick={() => toggleExpand(p.id)}
          >
            <td className="px-3 py-2 w-[4%]">
              {isOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
            </td>
            <td className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">{p.producto}</p>
              <p className="text-xs text-muted-foreground">{p.sku}</p>
            </td>
            <td className="px-3 py-2">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded", p.tipo === "PEDIDO" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground")}>
                {p.tipo}
              </span>
            </td>
            <td className="px-3 py-2 text-sm text-center font-medium">{totalDespacho}</td>
            <td className="px-3 py-2 text-sm text-center font-bold">{totalOptimo}</td>
            <td className="px-3 py-2 text-sm text-center">{totalDefEst}</td>
            <td className="px-3 py-2 text-sm text-center">{totalDanado}</td>
            <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={p.observacion}
                onChange={(e) => updateProductObs(p.id, e.target.value)}
                placeholder="—"
                className="w-full min-h-[40px] text-sm"
              />
            </td>
            <td className="px-3 py-2 text-center">
              {status === "green" && <Check size={18} className="text-green-600 mx-auto" />}
              {status === "orange" && <AlertTriangle size={18} className="text-orange-500 mx-auto" />}
              {status === "red" && <XCircle size={18} className="text-red-500 mx-auto" />}
            </td>
          </tr>

          {/* Lot Sub-Rows */}
          {isOpen && p.lotes.map((l) => {
            const lStatus = getLoteStatus(l);
            return (
              <tr key={l.id} className="bg-slate-50 min-h-[48px]">
                <td className="px-3 py-2 text-right text-muted-foreground text-xs">└</td>
                <td className="px-3 py-2" colSpan={1}>
                  <Input
                    value={l.lote}
                    onChange={(e) => updateLote(p.id, l.id, "lote", e.target.value)}
                    placeholder="Lote"
                    className="w-32 min-h-[40px] text-sm"
                  />
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">
                  <Input
                    type="number" min={0} value={l.cantDespacho}
                    onChange={(e) => updateLote(p.id, l.id, "cantDespacho", parseInt(e.target.value) || 0)}
                    className={cn("w-16 min-h-[40px] text-center")}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number" min={0} value={l.optimo}
                    onChange={(e) => updateLote(p.id, l.id, "optimo", parseInt(e.target.value) || 0)}
                    className={cn("w-16 min-h-[40px] text-center", l.optimo !== l.cantDespacho && "border-red-300 bg-red-50")}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number" min={0} value={l.defectoEstetico}
                    onChange={(e) => updateLote(p.id, l.id, "defectoEstetico", parseInt(e.target.value) || 0)}
                    className="w-16 min-h-[40px] text-center"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number" min={0} value={l.danado}
                    onChange={(e) => updateLote(p.id, l.id, "danado", parseInt(e.target.value) || 0)}
                    className="w-16 min-h-[40px] text-center"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={l.observacion}
                    onChange={(e) => updateLote(p.id, l.id, "observacion", e.target.value)}
                    placeholder="—"
                    className="w-full min-h-[40px] text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1 justify-center">
                    {lStatus === "green" && <Check size={14} className="text-green-600" />}
                    {lStatus === "orange" && <AlertTriangle size={14} className="text-orange-500" />}
                    {lStatus === "red" && (
                      <div className="text-center">
                        <XCircle size={14} className="text-red-500 mx-auto" />
                        <p className="text-[9px] text-red-600">≠{l.cantDespacho}u</p>
                      </div>
                    )}
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      disabled={p.lotes.length <= 1}
                      onClick={() => removeLote(p.id, l.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}

          {/* Add lot button */}
          {isOpen && (
            <tr className="bg-slate-50">
              <td className="px-3 py-2 text-right text-muted-foreground text-xs">└</td>
              <td colSpan={8} className="px-3 py-2">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => addLote(p.id)}>
                  <Plus size={14} className="mr-1" /> Agregar lote
                </Button>
              </td>
            </tr>
          )}
        </tbody>
      );
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" onClick={() => navigate("/inspector/rutas")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Control de Salida — Ruta {ruta.codigo}</h1>
            <p className="text-muted-foreground mt-0.5">
              {ruta.vendedor} · {format(new Date(), "dd/MM/yyyy", { locale: es })} · {totalProducts} lotes a verificar
            </p>
          </div>
        </div>
        <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-full", statusBadge)}>
          {ruta.salida}
        </span>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          ⚠ Verifica que el camión lleva exactamente lo indicado. Si hay diferencias, anótalas — Rosnelli recibirá notificación para corregir antes de la salida.
        </p>
      </div>

      {/* Verification Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-xs text-muted-foreground uppercase">
              <th className="px-3 py-3 font-medium w-[4%]"></th>
              <th className="px-3 py-3 font-medium w-[22%]">Producto</th>
              <th className="px-3 py-3 font-medium w-[9%]">Tipo</th>
              <th className="px-3 py-3 font-medium w-[10%] text-center">Cant. Desp.</th>
              <th className="px-3 py-3 font-medium w-[10%] text-center">Óptimo</th>
              <th className="px-3 py-3 font-medium w-[10%] text-center">Def. Est.</th>
              <th className="px-3 py-3 font-medium w-[10%] text-center">Dañado</th>
              <th className="px-3 py-3 font-medium w-[15%]">Observación</th>
              <th className="px-3 py-3 font-medium w-[5%]"></th>
            </tr>
          </thead>
          {renderProductGroup(pedidos)}
          {sobrestock.length > 0 && (
            <tbody>
              <tr>
                <td colSpan={9} className="px-3 py-2 text-center text-xs text-muted-foreground font-medium">
                  ── Sobrestock ──
                </td>
              </tr>
            </tbody>
          )}
          {renderProductGroup(sobrestock)}
        </table>
      </div>

      {/* Observations Panel */}
      {defectProducts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-800 mb-2">
            Productos con observaciones de calidad:
          </p>
          <ul className="space-y-1">
            {defectProducts.map((d) => {
              const de = sumField(d.lotes, "defectoEstetico");
              const da = sumField(d.lotes, "danado");
              return (
                <li key={d.id} className="text-sm text-orange-700">
                  • {d.producto} — Defecto Estético: {de}u · Dañado: {da}u
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-orange-600 mt-2">⚠ Rosnelli será notificada.</p>
        </div>
      )}

      {/* Observaciones Generales */}
      <div>
        <Textarea
          value={obsGenerales}
          onChange={(e) => setObsGenerales(e.target.value)}
          placeholder="Observaciones generales..."
          className="min-h-[80px]"
        />
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg p-4 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" className="min-h-[48px]" onClick={() => navigate("/inspector/rutas")}>
            Cancelar
          </Button>
          {footerState === "disabled" ? (
            <Button className="min-h-[48px]" disabled>
              Completa el campo Óptimo en todos los productos
            </Button>
          ) : footerState === "orange" ? (
            <Button className="min-h-[48px] bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleSubmit(true)}>
              Registrar con Observaciones
            </Button>
          ) : (
            <Button className="min-h-[48px] bg-green-600 hover:bg-green-700 text-white" onClick={() => handleSubmit(false)}>
              ✓ Marcar Salida Verificada
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
