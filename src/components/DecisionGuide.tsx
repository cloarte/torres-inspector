export function DecisionGuide() {
  const cards = [
    {
      title: "✅ ÓPTIMO — Producto en perfectas condiciones",
      borderColor: "border-l-green-500",
      recommended: "REINGRESO (vuelve al stock disponible)",
      others: "STOCK_FLOTANTE",
      note: null,
    },
    {
      title: "🟠 DEFECTO ESTÉTICO — Daño visual, apto para consumo",
      borderColor: "border-l-orange-500",
      recommended: "POOL GG",
      others: "REINGRESO (si el defecto es mínimo), MERMA",
      note: "→ El Gerente puede venderlo con descuento o donarlo.",
    },
    {
      title: "🟡 PRÓXIMO A VENCER — Menos de 7 días para vencer",
      borderColor: "border-l-amber-500",
      recommended: "POOL GG (si ≤5 días, apto para donación)",
      others: "MERMA, POOL GG",
      note: "→ El Gerente puede autorizar donación si faltan ≤5 días.",
    },
    {
      title: "🔴 VENCIDO — No apto para consumo ni venta",
      borderColor: "border-l-red-500",
      recommended: "MERMA",
      others: "POOL GG (solo si el GG quiere registrar donación tardía)",
      note: "REINGRESO y STOCK_FLOTANTE están DESHABILITADOS.",
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

      <div className="bg-accent/10 rounded-lg p-4 text-sm">
        <p className="font-semibold text-foreground">💡 POOL GG</p>
        <p className="text-muted-foreground mt-1">
          Significa que el Gerente General tomará la decisión final: donar,
          vender con descuento, o merma.
        </p>
      </div>
    </div>
  );
}
