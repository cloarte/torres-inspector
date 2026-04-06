// Shared types for Inspector module

export type EstadoSalida = "PENDIENTE" | "VERIFICADA" | "CON_OBS";
export type EstadoRetorno = "EN_RUTA" | "PENDIENTE" | "COMPLETADO";
export type EstadoRuta = "PENDIENTE_SALIDA" | "EN_RUTA" | "PENDIENTE_RETORNO" | "COMPLETADA";

export type Condicion = "OPTIMO" | "DEFECTO_ESTETICO" | "PROXIMO_VENCER" | "VENCIDO";
export type Destino = "REINGRESO" | "STOCK_FLOTANTE" | "MERMA" | "POOL_GG";
export type TipoRetorno = "RECHAZO_CLIENTE" | "DAÑADO" | "VENCIDO_RETORNO" | "NO_ENTREGADO" | "SOBRANTE";
export type EstadoInspeccion = "PENDIENTE" | "PROCESADO";
export type CondicionVisual = "OPTIMO" | "DEFECTO_ESTETICO" | "DAÑADO";
export type TipoProducto = "PEDIDO" | "SOBRESTOCK";

export interface ProductoSalida {
  id: string;
  producto: string;
  sku: string;
  lote: string;
  tipo: TipoProducto;
  cantDespacho: number;
  cantVerificada: number;
  condicionVisual: CondicionVisual;
  observacion: string;
}

export interface RetornoItem {
  id: string;
  producto: string;
  sku: string;
  lote: string;
  cantidad: number;
  unidad: string;
  tipoRetorno: TipoRetorno;
  estado: EstadoInspeccion;
  condicion?: Condicion;
  destino?: Destino;
  observaciones?: string;
  horaProcesado?: string;
}

export interface Ruta {
  id: string;
  codigo: string;
  canal: string;
  vendedor: string;
  pedidos: number;
  productos: number;
  sobrestock: boolean;
  salida: EstadoSalida;
  retorno: EstadoRetorno;
  horaSalida?: string;
  productosSalida: ProductoSalida[];
  retornos: RetornoItem[];
  observacionesSalida?: string;
}

export function getEstadoRuta(ruta: Ruta): EstadoRuta {
  if (ruta.salida === "PENDIENTE" || ruta.salida === "CON_OBS" && ruta.retorno === "EN_RUTA") return "PENDIENTE_SALIDA";
  if (ruta.retorno === "EN_RUTA") return "EN_RUTA";
  if (ruta.retorno === "PENDIENTE") return "PENDIENTE_RETORNO";
  return "COMPLETADA";
}

// Mock data
export const MOCK_RUTAS: Ruta[] = [
  {
    id: "1", codigo: "LIM-01", canal: "Tradicional", vendedor: "Juan López",
    pedidos: 8, productos: 45, sobrestock: true,
    salida: "PENDIENTE", retorno: "EN_RUTA",
    productosSalida: [
      { id: "ps1", producto: "Panetón Clásico 900g", sku: "PAN-CL-900", lote: "L-2026-008", tipo: "PEDIDO", cantDespacho: 24, cantVerificada: 24, condicionVisual: "OPTIMO", observacion: "" },
      { id: "ps2", producto: "Pan de Molde 500g", sku: "PAN-MB-500", lote: "L-2026-009", tipo: "PEDIDO", cantDespacho: 12, cantVerificada: 10, condicionVisual: "OPTIMO", observacion: "" },
      { id: "ps3", producto: "Torta Tres Leches 1kg", sku: "TOR-TL-1K", lote: "L-2026-010", tipo: "PEDIDO", cantDespacho: 4, cantVerificada: 4, condicionVisual: "DAÑADO", observacion: "" },
      { id: "ps4", producto: "Empanada Pollo x12", sku: "EMP-PO-12", lote: "L-2026-007", tipo: "PEDIDO", cantDespacho: 8, cantVerificada: 8, condicionVisual: "OPTIMO", observacion: "" },
      { id: "ps5", producto: "Panetón Clásico 900g", sku: "PAN-CL-900", lote: "L-2026-008", tipo: "SOBRESTOCK", cantDespacho: 6, cantVerificada: 6, condicionVisual: "OPTIMO", observacion: "" },
      { id: "ps6", producto: "Croissant x6", sku: "CRO-X6", lote: "L-2026-011", tipo: "SOBRESTOCK", cantDespacho: 10, cantVerificada: 9, condicionVisual: "OPTIMO", observacion: "" },
    ],
    retornos: [],
  },
  {
    id: "2", codigo: "LIM-02", canal: "Moderno", vendedor: "Pedro Soto",
    pedidos: 3, productos: 18, sobrestock: false,
    salida: "VERIFICADA", retorno: "EN_RUTA", horaSalida: "07:30",
    productosSalida: [],
    retornos: [],
  },
  {
    id: "3", codigo: "LIM-03", canal: "Directa", vendedor: "Ana García",
    pedidos: 5, productos: 30, sobrestock: true,
    salida: "CON_OBS", retorno: "EN_RUTA", horaSalida: "07:45",
    productosSalida: [],
    retornos: [],
  },
  {
    id: "4", codigo: "LIM-04", canal: "Tradicional", vendedor: "Carlos Díaz",
    pedidos: 6, productos: 38, sobrestock: false,
    salida: "VERIFICADA", retorno: "PENDIENTE", horaSalida: "06:30",
    productosSalida: [
      { id: "ps7", producto: "Panetón Clásico 900g", sku: "PAN-CL-900", lote: "L-2026-008", tipo: "PEDIDO", cantDespacho: 20, cantVerificada: 20, condicionVisual: "OPTIMO", observacion: "" },
      { id: "ps8", producto: "Pan de Molde 500g", sku: "PAN-MB-500", lote: "L-2026-009", tipo: "PEDIDO", cantDespacho: 10, cantVerificada: 10, condicionVisual: "OPTIMO", observacion: "" },
      { id: "ps9", producto: "Empanada Pollo x12", sku: "EMP-PO-12", lote: "L-2026-007", tipo: "PEDIDO", cantDespacho: 8, cantVerificada: 8, condicionVisual: "OPTIMO", observacion: "" },
    ],
    retornos: [
      { id: "RET-001", producto: "Panetón Clásico 900g", sku: "PAN-CL-900", lote: "L-2026-008", cantidad: 12, unidad: "u", tipoRetorno: "RECHAZO_CLIENTE", estado: "PENDIENTE" },
      { id: "RET-002", producto: "Pan de Molde 500g", sku: "PAN-MB-500", lote: "L-2026-009", cantidad: 8, unidad: "u", tipoRetorno: "SOBRANTE", estado: "PENDIENTE" },
      { id: "RET-003", producto: "Empanada Pollo x12", sku: "EMP-PO-12", lote: "L-2026-007", cantidad: 5, unidad: "u", tipoRetorno: "DAÑADO", estado: "PROCESADO", condicion: "DEFECTO_ESTETICO", destino: "POOL_GG", horaProcesado: "16:45" },
    ],
  },
  {
    id: "5", codigo: "PRV-01", canal: "Tradicional", vendedor: "María Torres",
    pedidos: 12, productos: 80, sobrestock: true,
    salida: "VERIFICADA", retorno: "PENDIENTE", horaSalida: "06:00",
    productosSalida: [],
    retornos: [
      { id: "RET-004", producto: "Panetón Chocolate 900g", sku: "PAN-CH-900", lote: "L-2026-006", cantidad: 20, unidad: "u", tipoRetorno: "RECHAZO_CLIENTE", estado: "PENDIENTE" },
      { id: "RET-005", producto: "Torta Tres Leches 1kg", sku: "TOR-TL-1K", lote: "L-2026-010", cantidad: 3, unidad: "u", tipoRetorno: "VENCIDO_RETORNO", estado: "PENDIENTE" },
    ],
  },
];
