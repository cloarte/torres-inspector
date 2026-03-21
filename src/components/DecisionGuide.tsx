export function DecisionGuide({ onClose }: { onClose?: () => void }) {
  const cards = [
    {
      title: "✅ ÓPTIMO — Producto en perfectas condiciones",
      borderColor: "border-l-success",
      recommended: "REINGRESO (vuelve al stock disponible)",
      others: "STOCK_FLOTANTE",
      note: null,
    },
    {
      title: "🟠 DEFECTO ESTÉTICO — Daño visual, apto para consumo",
      borderColor: "border-l-warning",
      recommended: "POOL GG",
      others: "REINGRESO (si el defecto es mínimo), MERMA",
      note: "→ El Gerente puede venderlo con descuento o donarlo.",
    },
    {
      title: "🟡 PRÓXIMO A VENCER — Menos de 7 días para vencer",
      borderColor: "border-l-amber-500",
      recommended: "Si quedan ≤5 días: POOL GG (apto para donación). Si quedan >5 días: MERMA o POOL GG",
      others: "MERMA, POOL GG",
      note: "→ El Gerente puede autorizar donación si faltan ≤5 días.",
    },
    {
      title: "🔴 VENCIDO — No apto para consumo ni venta",
      borderColor: "border-l-danger",
      recommended: "MERMA",
      others: "POOL GG (solo si el GG quiere registrar donación tardía)",
      note: "⚠ REINGRESO y STOCK_FLOTANTE están DESHABILITADOS.",
    },
  ];

  return (
    <div className="space-y-4 mt-6">
      {cards.map((c) => (
        <div
          key={c.title}
          className={`border-l-4 ${c.borderColor} bg-muted/30 rounded-r-lg p-4 space-y-2`}
        >
          <p className="font-semibold text-sm">{c.title}</p>
          <p className="text-sm">
            <span className="font-medium">Destino recomendado:</span>{" "}
            {c.recommended}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Otros permitidos:</span> {c.others}
          </p>
          {c.note && (
            <p className="text-xs text-muted-foreground italic">{c.note}</p>
          )}
        </div>
      ))}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm">
        <p className="font-semibold text-purple-800">💡 POOL GG</p>
        <p className="text-purple-700 mt-1">
          Significa que el Gerente General tomará la decisión final: donar,
          vender con descuento, o merma.
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full min-h-[48px] rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Cerrar
        </button>
      )}
    </div>
  );
}