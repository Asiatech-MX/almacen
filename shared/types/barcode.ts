// Tipos para el sistema de códigos de barras

export type BarcodeFormat = 'EAN13' | 'EAN8' | 'UPC' | 'UPCE' | 'CODE128' | 'CODE128A' | 'CODE128B' | 'CODE128C' | 'CODE39' | 'CODE39EXT' | 'ITF14' | 'SKU' | 'QR' | 'PHARMACODE'

// Tipos de etiquetas soportados con dimensiones específicas
export type LabelSize = '29x90' | '62x40' | '62x100'

// Configuración específica para cada tamaño de etiqueta
export interface LabelSizeConfig {
  size: LabelSize
  width: number // en milímetros
  height: number // en milímetros
  rotation: number // grados de rotación (0, 90, -90)
  transformOrigin: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  layout: {
    // Visual hierarchy: Barcode > Numeric Code > Product Name
    barcodeScale: number // escala relativa del código de barras (1.0 = base)
    codeScale: number // escala relativa del código numérico
    nameScale: number // escala relativa del nombre (menor prioridad)
    spacing: {
      barcodeToCode: number // espacio entre barcode y código numérico (mm)
      codeToName: number // espacio entre código y nombre (mm)
      columnGap?: number // espacio entre columnas de texto y barcode (mm)
      textLineHeight?: number // espaciado entre líneas de texto (ratio)
    }
  }
}

export interface BarcodeOptions {
  format: BarcodeFormat
  value: string
  width?: number
  height?: number
  displayValue?: boolean
  fontSize?: number
  textMargin?: number
  margin?: number
  background?: string
  lineColor?: string
  valid?: (valid: boolean) => void
  font?: string
  fontOptions?: string
  textAlign?: 'left' | 'center' | 'right'
  textPosition?: 'top' | 'bottom'
  flat?: boolean
  lastChar?: string
  mod43?: boolean // Para CODE39
  ean128?: boolean // Para CODE128
  materialData?: MaterialLabelData // Datos del material para layout enriquecido
}

export interface LabelTemplate {
  id: string
  name: string
  width: number // en milímetros
  height: number // en milímetros
  dpi: number // puntos por pulgada
  layout: LabelLayout
  default?: boolean
}

export interface LabelLayout {
  barcode: {
    x: number // posición x en mm
    y: number // posición y en mm
    width: number // ancho en mm
    height: number // alto en mm
  }
  text: {
    x: number // posición x en mm
    y: number // posición y en mm
    width: number // ancho en mm
    height: number // alto en mm
    fontSize: number // tamaño de fuente
    align: 'left' | 'center' | 'right'
  }[]
  logo?: {
    x: number // posición x en mm
    y: number // posición y en mm
    width: number // ancho en mm
    height: number // alto en mm
  }
}

export interface PrintJob {
  id: string
  barcodeData: BarcodeOptions
  labelTemplate: LabelTemplate
  materialData: MaterialLabelData
  imageData?: Buffer | string // Datos de imagen para impresión (opcional)
  copies: number
  status: 'pending' | 'printing' | 'completed' | 'error'
  error?: string
  createdAt: Date
  completedAt?: Date
}

export interface MaterialLabelData {
  id: string
  codigo: string // código interno
  nombre: string // nombre del material
  descripcion?: string // descripción corta
  stock?: number // stock actual
  ubicacion?: string // ubicación en almacén
  institucion: string // para multi-tenant
  categoria?: string // categoría del material
  presentacion?: string // presentación
  precio?: string | number // precio del material
}

export interface PrinterConfig {
  id: string
  name: string
  displayName?: string // Nombre visible para el usuario
  model: string // ej: 'QL-810W'
  vendorId?: number // VID (para conexión USB directa)
  productId?: number // PID (para conexión USB directa)
  connection: 'usb' | 'network' | 'printer' | 'directUsb'
  interface?: string // Interface string para node-thermal-printer
  address?: string // dirección IP si es red
  port?: number // puerto si es red
  supportedSizes: string[] // tamaños de etiqueta soportados
  resolution: { dpi: number }
  speed: number // etiquetas por minuto
  default?: boolean
  driverType?: 'star' | 'epson' | 'auto' // Para node-thermal-printer
  priority?: number // Prioridad para método de impresión (1 = más alta)
  connected?: boolean // Estado de conexión
  status?: string // Estado detallado
  error?: string // Error si está desconectado
}

export interface PrintOptions {
  printerId: string
  labelTemplateId: string
  copies?: number
  landscape?: boolean
  density?: number // densidad de impresión
  compression?: boolean
  autoCut?: boolean
}

// Validación de formatos específicos
export interface BarcodeValidation {
  format: BarcodeFormat
  pattern: RegExp
  length: number | { min: number; max: number }
  checkDigit?: boolean
  examples: string[]
  description: string
}

// Exportar todas las validaciones predefinidas
export const BARCODE_VALIDATIONS: Record<Exclude<BarcodeFormat, 'SKU' | 'QR'>, BarcodeValidation> = {
  EAN13: {
    format: 'EAN13',
    pattern: /^[0-9]{12,13}$/,
    length: 13,
    checkDigit: true,
    examples: ['5901234123457', '9780199532179'],
    description: 'Código europeo de 13 dígitos para productos de consumo'
  },
  EAN8: {
    format: 'EAN8',
    pattern: /^[0-9]{7,8}$/,
    length: 8,
    checkDigit: true,
    examples: ['96385074', '42526190'],
    description: 'Código europeo de 8 dígitos para productos pequeños'
  },
  UPC: {
    format: 'UPC',
    pattern: /^[0-9]{11,12}$/,
    length: 12,
    checkDigit: true,
    examples: ['123456789999', '042100005264'],
    description: 'Código universal de 12 dígitos para productos en EE.UU. y Canadá'
  },
  UPCE: {
    format: 'UPCE',
    pattern: /^[0-9]{6,8}$/,
    length: { min: 6, max: 8 },
    checkDigit: true,
    examples: ['0123456', '123456'],
    description: 'Versión comprimida de UPC para empaquetado pequeño'
  },
  CODE128: {
    format: 'CODE128',
    pattern: /^[\x00-\x7F\xC8-\xD3]+$/,
    length: { min: 1, max: 80 },
    checkDigit: true,
    examples: ['EXAMPLE1234', '12345678'],
    description: 'Código de alta densidad con soporte ASCII completo'
  },
  CODE128A: {
    format: 'CODE128A',
    pattern: /^[\x00-\x5F\xC8-\xD3]+$/,
    length: { min: 1, max: 80 },
    checkDigit: true,
    examples: ['EXAMPLE', '123456'],
    description: 'CODE128 Subset A - caracteres de control y mayúsculas'
  },
  CODE128B: {
    format: 'CODE128B',
    pattern: /^[\x20-\x7E\xC8-\xD3]+$/,
    length: { min: 1, max: 80 },
    checkDigit: true,
    examples: ['Example1234', 'abc-123'],
    description: 'CODE128 Subset B - caracteres ASCII estándar'
  },
  CODE128C: {
    format: 'CODE128C',
    pattern: /^[0-9\xC8-\xD3]+$/,
    length: { min: 2, max: 80 },
    checkDigit: true,
    examples: ['12345678', '0123456789'],
    description: 'CODE128 Subset C - datos numéricos comprimidos'
  },
  CODE39: {
    format: 'CODE39',
    pattern: /^[0-9A-Z\-\.\ \$\/\+\%]+$/,
    length: { min: 1, max: 43 },
    checkDigit: false,
    examples: ['ABC123', 'PART-001'],
    description: 'Código industrial alfanumérico de 39 caracteres'
  },
  CODE39EXT: {
    format: 'CODE39EXT',
    pattern: /^[0-9A-Z\-\.\ \$\/\+\%]+$/,
    length: { min: 1, max: 43 },
    checkDigit: false,
    examples: ['ABC123', 'PART-001'],
    description: 'CODE39 extendido con soporte ASCII completo'
  },
  ITF14: {
    format: 'ITF14',
    pattern: /^[0-9]{13,14}$/,
    length: 14,
    checkDigit: true,
    examples: ['15400141425432', '12345678901231'],
    description: 'Código intercalado de 2 de 5 para empaquetado'
  },
  PHARMACODE: {
    format: 'PHARMACODE',
    pattern: /^[0-9]+$/,
    length: { min: 3, max: 131070 },
    checkDigit: false,
    examples: ['1234', '56789'],
    description: 'Código especializado para la industria farmacéutica'
  }
}

// Configuraciones predefinidas para tamaños de etiqueta - MEJORADAS
export const LABEL_SIZE_CONFIGS: Record<LabelSize, LabelSizeConfig> = {
  '29x90': {
    size: '29x90',
    width: 90, // DK-1201 es 90mm de ancho
    height: 29, // DK-1201 es 29mm de alto
    rotation: 0, // Sin rotación - orientación horizontal estándar
    transformOrigin: 'center',
    layout: {
      barcodeScale: 1.2, // Aumentado para mejor escaneabilidad en layout horizontal
      codeScale: 1.1,   // Escala para legibilidad del SKU
      nameScale: 1.0,   // Escala base para el nombre
      spacing: {
        barcodeToCode: 2, // 2mm entre barcode y código (vertical, si se necesitara)
        codeToName: 1.5, // 1.5mm entre código y nombre (vertical, si se necesitara)
        columnGap: 4,    // 4mm entre columnas de texto y barcode
        textLineHeight: 1.4 // Espaciado entre líneas de texto
      }
    }
  },
  '62x40': {
    size: '62x40',
    width: 62,
    height: 40,
    rotation: 0, // Sin rotación - landscape estándar
    transformOrigin: 'center',
    layout: {
      barcodeScale: 1.4, // Aumentado para máximo aprovechamiento
      codeScale: 1.3,   // Alta visibilidad
      nameScale: 1.1,   // Legible pero más pequeño que el código
      spacing: {
        barcodeToCode: 4, // Más espacio en etiqueta más ancha
        codeToName: 3
      }
    }
  },
  '62x100': {
    size: '62x100',
    width: 62,
    height: 100,
    rotation: 0, // Sin rotación - portrait/landscape según uso
    transformOrigin: 'center',
    layout: {
      barcodeScale: 1.6, // Máximo tamaño posible en etiqueta grande
      codeScale: 1.4,   // Grande y legible
      nameScale: 1.2,   // Proporcionado y legible
      spacing: {
        barcodeToCode: 5, // Más espacio para etiqueta grande
        codeToName: 4
      }
    }
  }
}

// Función auxiliar para obtener el tamaño de etiqueta desde una plantilla
export const getLabelSizeFromTemplate = (templateId: string): LabelSize => {
  switch (templateId) {
    case 'dk-11201':
      return '29x90'
    case 'dk-11202':
      return '62x100'
    case 'continuous-62mm':
      return '62x40'
    default:
      return '29x90' // Valor por defecto
  }
}

// Plantillas de etiquetas predefinidas para Brother QL-810W - ACTUALIZADAS PARA LAYOUT HORIZONTAL
export const BROTHER_QL810W_TEMPLATES: LabelTemplate[] = [
  {
    id: 'dk-11201',
    name: 'DK-11201 (90x29mm) - Horizontal',
    width: 90, // 90mm de ancho
    height: 29, // 29mm de alto
    dpi: 300,
    default: true,
    layout: {
      barcode: {
        // Columna derecha (40% del área imprimible)
        x: 56, // 60% del ancho imprimible
        y: 3,  // 3mm margen superior
        width: 31, // 40% del área imprimible (90 - 6mm márgenes = 84mm imprimible)
        height: 23 // 80% del alto (29 - 6mm márgenes = 23mm imprimible)
      },
      text: [
        // Nombre del producto (línea 1) - columna izquierda
        {
          x: 3, // 3mm margen izquierdo
          y: 3, // 3mm margen superior
          width: 50, // 60% del área imprimible menos gap
          height: 8, // 25% del alto total
          fontSize: 12, // ~4.2mm a 300 DPI
          align: 'left'
        },
        // SKU/Código (línea 2) - columna izquierda
        {
          x: 3,
          y: 12, // Debajo del nombre
          width: 50,
          height: 6, // 20% del alto total
          fontSize: 9, // ~3.2mm a 300 DPI
          align: 'left'
        },
        // Precio/Stock (línea 3) - columna izquierda
        {
          x: 3,
          y: 19, // Debajo del SKU
          width: 50,
          height: 7, // 25% del alto total
          fontSize: 10, // ~3.5mm a 300 DPI
          align: 'left'
        }
      ]
    }
  },
  {
    id: 'dk-11202',
    name: 'DK-11202 (62x100mm) - Horizontal',
    width: 62,
    height: 100,
    dpi: 300,
    layout: {
      barcode: {
        // Columna derecha (40% del área imprimible)
        x: 37, // 60% del ancho imprimible (62 - 6 = 56mm imprimible)
        y: 10, // 10mm margen superior para mejor centrado
        width: 21, // 40% del área imprimible
        height: 60 // 60% del altura imprimible para mejor escaneabilidad
      },
      text: [
        // Nombre del producto (línea 1)
        {
          x: 3,
          y: 10,
          width: 31,
          height: 20,
          fontSize: 16,
          align: 'left'
        },
        // SKU/Código (línea 2)
        {
          x: 3,
          y: 32,
          width: 31,
          height: 15,
          fontSize: 12,
          align: 'left'
        },
        // Descripción/Categoría (línea 3)
        {
          x: 3,
          y: 49,
          width: 31,
          height: 12,
          fontSize: 10,
          align: 'left'
        },
        // Stock/Precio (línea 4)
        {
          x: 3,
          y: 63,
          width: 31,
          height: 12,
          fontSize: 11,
          align: 'left'
        }
      ]
    }
  },
  {
    id: 'continuous-62mm',
    name: 'Continuous 62mm (40mm) - Horizontal',
    width: 62,
    height: 40,
    dpi: 300,
    layout: {
      barcode: {
        // Columna derecha (40% del área imprimible)
        x: 37, // 60% del ancho imprimible (62 - 6 = 56mm imprimible)
        y: 5,  // 5mm margen superior
        width: 21, // 40% del área imprimible
        height: 30 // 75% del altura imprimible (40 - 6 = 34mm imprimible)
      },
      text: [
        // Nombre del producto (línea 1)
        {
          x: 3,
          y: 5,
          width: 31,
          height: 10,
          fontSize: 10,
          align: 'left'
        },
        // SKU/Código (línea 2)
        {
          x: 3,
          y: 16,
          width: 31,
          height: 8,
          fontSize: 8,
          align: 'left'
        },
        // Precio/Stock (línea 3)
        {
          x: 3,
          y: 25,
          width: 31,
          height: 10,
          fontSize: 9,
          align: 'left'
        }
      ]
    }
  }
]

// Configuraciones de impresora predefinidas
export const BROTHER_PRINTER_CONFIGS: PrinterConfig[] = [
  {
    id: 'ql-810w-direct-usb',
    name: 'Brother QL-810W Direct',
    displayName: 'Brother QL-810W (Direct USB)',
    model: 'QL-810W',
    vendorId: 0x04f9,
    productId: 0x209c,
    connection: 'directUsb',
    supportedSizes: ['DK-11201', 'DK-11202', 'Continuous 62mm'],
    resolution: { dpi: 300 },
    speed: 110,
    default: true,
    priority: 1
  },
  {
    id: 'ql-810w-usb',
    name: 'BRW4CD577EBB8F3',
    displayName: 'Brother QL-810W', // Nombre real en Windows para USB
    model: 'QL-810W',
    connection: 'printer',
    interface: 'printer:BRW4CD577EBB8F3',
    driverType: 'auto', // node-thermal-printer detectará automáticamente
    supportedSizes: ['DK-11201', 'DK-11202', 'Continuous 62mm'],
    resolution: { dpi: 300 },
    speed: 110,
    priority: 2
  },
  {
    id: 'ql-810w-wifi',
    name: 'BRW4CD577EBB8F3',
    displayName: 'Brother QL-810W Red', // Nombre real en Windows para WiFi
    model: 'QL-810W',
    connection: 'network',
    interface: 'tcp://192.168.0.86:9100',
    address: '192.168.0.86',
    port: 9100,
    driverType: 'auto', // node-thermal-printer detectará automáticamente
    supportedSizes: ['DK-11201', 'DK-11202', 'Continuous 62mm'],
    resolution: { dpi: 300 },
    speed: 110,
    priority: 3
  }
]

// Eventos IPC para impresión
export interface BarcodeIPCEevents {
  'barcode:generate': (options: BarcodeOptions) => Promise<string>
  'barcode:validate': (format: BarcodeFormat, value: string) => Promise<{ valid: boolean; error?: string }>
  'barcode:print': (job: PrintJob) => Promise<{ success: boolean; message?: string }>
  'barcode:printBatch': (jobs: PrintJob[]) => Promise<{ success: boolean; message?: string; results?: any[] }>
  'printer:discover': () => Promise<PrinterConfig[]>
  'printer:discoverDirect': () => Promise<PrinterConfig[]>
  'printer:status': (printerId: string) => Promise<{ connected: boolean; status: string; error?: string }>
  'printer:getConfig': (printerId: string) => Promise<PrinterConfig>
  'printer:setConfig': (config: PrinterConfig) => Promise<boolean>
  'printer:getDefault': () => Promise<{ success: boolean; printer?: PrinterConfig }>
  'printer:isAvailable': (printerName: string) => Promise<{ success: boolean; available: boolean; error?: string }>
  'printer:listNative': () => Promise<any>
  'print:testNative': (options: { printerName?: string; pdfPath?: string }) => Promise<any>
  'print:testDirect': (printerId: string) => Promise<{ success: boolean; message?: string; error?: string }>
  'print:getHistory': () => Promise<PrintJob[]>
  'print:clearHistory': () => Promise<boolean>
}
