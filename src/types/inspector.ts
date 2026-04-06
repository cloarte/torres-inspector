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

// --- Lot-level types ---

export interface LoteSalida {
  id: string;
  lote: string;
  cantDespacho: number;
  optimo: number;
  defectoEstetico: number;
  danado: number;
  observacion: string;
}

export interface LoteRetorno {
  id: string;
  lote: string;
  vendido: number;
  optimo: number;
  defectoEstetico: number;
  proximoVencer: number;
  vencido: number;
  observacion: string;
}

// --- Product-level types (parent rows with lot sub-rows) ---

export interface ProductoSalida {
  id: string;
  producto: string;
  sku: string;
  tipo: TipoProducto;
  observacion: string;
  lotes: LoteSalida[];
}

export interface ProductoRetorno {
  id: string;
  producto: string;
  sku: string;
  cantDespacho: number;
  destinoOptimo?: "REINGRESO" | "STOCK_FLOTANTE";
  observacion: string;
  lotes: LoteRetorno[];
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
  productosRetorno: ProductoRetorno[];
  retornos: RetornoItem[];
  observacionesSalida?: string;
}

export function getEstadoRuta(ruta: Ruta): EstadoRuta {
  if (ruta.salida === "PENDIENTE" || (ruta.salida === "CON_OBS" && ruta.retorno === "EN_RUTA")) return "PENDIENTE_SALIDA";
  if (ruta.retorno === "EN_RUTA") return "EN_RUTA";
  if (ruta.retorno === "PENDIENTE") return "PENDIENTE_RETORNO";
  return "COMPLETADA";
}

// Helper to generate unique IDs
let _idCounter = 100;
export function genId(): string {
  return `gen-${++_idCounter}`;
}

// Mock data
export const MOCK_RUTAS: Ruta[] = [
  {
    id: "1", codigo: "LIM-01", canal: "Tradicional", vendedor: "Juan López",
    pedidos: 8, productos: 45, sobrestock: true,
    salida: "PENDIENTE", retorno: "EN_RUTA",
    productosSalida: [
      {
        id: "ps1", producto: "Panetón Clásico 900g", sku: "PAN-CL-900", tipo: "PEDIDO", observacion: "",
        lotes: [
          { id: "ls1", lote: "L-2026-008", cantDespacho: 24, optimo: 24, defectoEstetico: 2, danado: 0, observacion: "" },
          { id: "ls2", lote: "L-2026-012", cantDespacho: 6, optimo: 6, defectoEstetico: 0, danado: 0, observacion: "" },
        ],
      },
      {
        id: "ps2", producto: "Pan de Molde 500g", sku: "PAN-MB-500", tipo: "PEDIDO", observacion: "",
        lotes: [
          { id: "ls3", lote: "L-2026-009", cantDespacho: 12, optimo: 12, defectoEstetico: 0, danado: 0, observacion: "" },
        ],
      },
      {
        id: "ps3", producto: "Torta Tres Leches 1kg", sku: "TOR-TL-1K", tipo: "PEDIDO", observacion: "",
        lotes: [
          { id: "ls4", lote: "L-2026-010", cantDespacho: 4, optimo: 3, defectoEstetico: 0, danado: 0, observacion: "" },
        ],
      },
      {
        id: "ps4", producto: "Empanada Pollo x12", sku: "EMP-PO-12", tipo: "PEDIDO", observacion: "",
        lotes: [
          { id: "ls5", lote: "L-2026-007", cantDespacho: 8, optimo: 8, defectoEstetico: 0, danado: 2, observacion: "" },
        ],
      },
      {
        id: "ps5", producto: "Croissant x6", sku: "CRO-X6", tipo: "SOBRESTOCK", observacion: "",
        lotes: [
          { id: "ls6", lote: "L-2026-011", cantDespacho: 10, optimo: 10, defectoEstetico: 1, danado: 0, observacion: "" },
        ],
      },
    ],
    productosRetorno: [],
    retornos: [],
  },
  {
    id: "2", codigo: "LIM-02", canal: "Moderno", vendedor: "Pedro Soto",
    pedidos: 3, productos: 18, sobrestock: false,
    salida: "VERIFICADA", retorno: "EN_RUTA", horaSalida: "07:30",
    productosSalida: [],
    productosRetorno: [],
    retornos: [],
  },
  {
    id: "3", codigo: "LIM-03", canal: "Directa", vendedor: "Ana García",
    pedidos: 5, productos: 30, sobrestock: true,
    salida: "CON_OBS", retorno: "EN_RUTA", horaSalida: "07:45",
    productosSalida: [],
    productosRetorno: [],
    retornos: [],
  },
  {
    id: "4", codigo: "LIM-04", canal: "Tradicional", vendedor: "Carlos Díaz",
    pedidos: 6, productos: 38, sobrestock: false,
    salida: "VERIFICADA", retorno: "PENDIENTE", horaSalida: "06:30",
    productosSalida: [
      {
        id: "ps7", producto: "Panetón Clásico 900g", sku: "PAN-CL-900", tipo: "PEDIDO", observacion: "",
        lotes: [
          { id: "ls7", lote: "L-2026-008", cantDespacho: 24, optimo: 24, defectoEstetico: 0, danado: 0, observacion: "" },
        ],
      },
      {
        id: "ps8", producto: "Pan de Molde 500g", sku: "PAN-MB-500", tipo: "PEDIDO", observacion: "",
        lotes: [
          { id: "ls8", lote: "L-2026-009", cantDespacho: 12, optimo: 12, defectoEstetico: 0, danado: 0, observacion: "" },
        ],
      },
    ],
    productosRetorno: [
      {
        id: "pr1", producto: "Panetón Clásico 900g", sku: "PAN-CL-900", cantDespacho: 24, destinoOptimo: "REINGRESO", observacion: "",
        lotes: [
          { id: "lr1", lote: "L-2026-008", vendido: 8, optimo: 8, defectoEstetico: 2, proximoVencer: 0, vencido: 0, observacion: "" },
          { id: "lr2", lote: "L-2026-012", vendido: 4, optimo: 2, defectoEstetico: 0, proximoVencer: 0, vencido: 0, observacion: "" },
        ],
      },
      {
        id: "pr2", producto: "Empanada Pollo x12", sku: "EMP-PO-12", cantDespacho: 8, destinoOptimo: "STOCK_FLOTANTE", observacion: "",
        lotes: [
          { id: "lr3", lote: "L-2026-007", vendido: 3, optimo: 2, defectoEstetico: 0, proximoVencer: 0, vencido: 0, observacion: "" },
          { id: "lr4", lote: "L-2026-003", vendido: 0, optimo: 0, defectoEstetico: 0, proximoVencer: 2, vencido: 1, observacion: "" },
        ],
      },
      {
        id: "pr3", producto: "Pan de Molde 500g", sku: "PAN-MB-500", cantDespacho: 12, observacion: "",
        lotes: [
          { id: "lr5", lote: "L-2026-009", vendido: 12, optimo: 0, defectoEstetico: 0, proximoVencer: 0, vencido: 0, observacion: "" },
        ],
      },
      {
        id: "pr4", producto: "Croissant x6", sku: "CRO-X6", cantDespacho: 10, observacion: "",
        lotes: [
          { id: "lr6", lote: "L-2026-011", vendido: 0, optimo: 0, defectoEstetico: 0, proximoVencer: 0, vencido: 0, observacion: "" },
        ],
      },
    ],
    retornos: [],
  },
  {
    id: "5", codigo: "PRV-01", canal: "Tradicional", vendedor: "María Torres",
    pedidos: 12, productos: 80, sobrestock: true,
    salida: "VERIFICADA", retorno: "PENDIENTE", horaSalida: "06:00",
    productosSalida: [],
    productosRetorno: [],
    retornos: [],
  },
];
