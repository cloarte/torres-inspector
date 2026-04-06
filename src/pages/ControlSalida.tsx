import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MOCK_RUTAS, type ProductoSalida, type CondicionVisual } from "@/types/inspector";

export default function ControlSalida() {
  const { rutaId } = useParams();
  const navigate = useNavigate();
  const ruta = MOCK_RUTAS.find((r) => r.id === rutaId);

  const [productos, setProductos] = useState<ProductoSalida[]>(ruta?.productosSalida ?? []);
  const [obsGenerales, setObsGenerales] = useState(ruta?.observacionesSalida ?? "");

  if (!ruta) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <p className="text-muted-foreground text-lg">Ruta no encontrada</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/inspector/rutas")}>← Volver</Button>
      </div>
    );
  }

  const pedidos = productos.filter((p) => p.tipo === "PEDIDO");
  const sobrestock = productos.filter((p) => p.tipo === "SOBRESTOCK");

  const diferencias = useMemo(() => {
    return productos.filter((p) => p.cantVerificada !== p.cantDespacho);
  }, [productos]);

  const updateProducto = (id: string, field: keyof ProductoSalida, value: any) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
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

  function renderTable(items: ProductoSalida[]) {
    return items.map((p) => {
      const hasDiff = p.cantVerificada !== p.cantDespacho;
      const isDamaged = p.condicionVisual === "DAÑADO";
      const isSobrestock = p.tipo === "SOBRESTOCK";
      return (
        <tr
          key={p.id}
          className={cn(
            "min-h-[56px]",
            isDamaged && "bg-red-50",
            hasDiff && !isDamaged && "bg-amber-50",
            isSobrestock && "border-l-2 border-blue-300"
          )}
        >
          <td className="px-3 py-2">
            <p className="text-sm font-medium text-foreground">{p.producto}</p>
            <p className="text-xs text-muted-foreground">{p.sku}</p>
          </td>
          <td className="px-3 py-2 text-sm">{p.lote}</td>
          <td className="px-3 py-2">
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded", p.tipo === "PEDIDO" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground")}>
              {p.tipo}
            </span>
          </td>
          <td className="px-3 py-2 text-sm text-center">{p.cantDespacho}</td>
          <td className="px-3 py-2">
            <Input
              type="number"
              min={0}
              value={p.cantVerificada}
              onChange={(e) => updateProducto(p.id, "cantVerificada", parseInt(e.target.value) || 0)}
              className="w-20 min-h-[48px] text-center"
            />
          </td>
          <td className="px-3 py-2">
            <Select
              value={p.condicionVisual}
              onValueChange={(v) => updateProducto(p.id, "condicionVisual", v as CondicionVisual)}
            >
              <SelectTrigger className="w-[160px] min-h-[48px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPTIMO">ÓPTIMO</SelectItem>
                <SelectItem value="DEFECTO_ESTETICO">DEFECTO ESTÉTICO</SelectItem>
                <SelectItem value="DAÑADO">DAÑADO</SelectItem>
              </SelectContent>
            </Select>
          </td>
          <td className="px-3 py-2">
            <Input
              value={p.observacion}
              onChange={(e) => updateProducto(p.id, "observacion", e.target.value)}
              placeholder="—"
              className="w-full min-h-[48px] text-sm"
            />
          </td>
        </tr>
      );
    });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" onClick={() => navigate("/inspector/rutas")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Control de Salida — Ruta {ruta.codigo}</h1>
            <p className="text-muted-foreground mt-0.5">
              {ruta.vendedor} · {format(new Date(), "dd/MM/yyyy", { locale: es })} · {productos.length} productos a verificar
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
              <th className="px-3 py-3 font-medium w-[30%]">Producto</th>
              <th className="px-3 py-3 font-medium w-[12%]">Lote</th>
              <th className="px-3 py-3 font-medium w-[10%]">Tipo</th>
              <th className="px-3 py-3 font-medium w-[12%] text-center">Cant. Despacho</th>
              <th className="px-3 py-3 font-medium w-[14%]">Cant. Verificada</th>
              <th className="px-3 py-3 font-medium w-[14%]">Cond. Visual</th>
              <th className="px-3 py-3 font-medium w-[8%]">Observación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {renderTable(pedidos)}
            {sobrestock.length > 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-2 text-center text-xs text-muted-foreground font-medium">
                  ── Sobrestock ──
                </td>
              </tr>
            )}
            {renderTable(sobrestock)}
          </tbody>
        </table>
      </div>

      {/* Diferencias Panel */}
      {diferencias.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-800 mb-2">
            Se encontraron {diferencias.length} diferencias:
          </p>
          <ul className="space-y-1">
            {diferencias.map((d) => (
              <li key={d.id} className="text-sm text-orange-700">
                • {d.producto} — Despacho: {d.cantDespacho}u → Físico: {d.cantVerificada}u
              </li>
            ))}
          </ul>
          <p className="text-sm text-orange-600 mt-2">⚠ Rosnelli será notificada para corregir antes de la salida.</p>
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button variant="ghost" className="min-h-[48px]" onClick={() => navigate("/inspector/rutas")}>
            Cancelar
          </Button>
          {diferencias.length > 0 ? (
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
