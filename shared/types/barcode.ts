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
}

export interface PrinterConfig {
  id: string
  name: string
  model: string // ej: 'QL-810W'
  vendorId: number // VID
  productId: number // PID
  connection: 'usb' | 'network'
  address?: string // dirección IP si es red
  port?: number // puerto si es red
  supportedSizes: string[] // tamaños de etiqueta soportados
  resolution: { dpi: number }
  speed: number // etiquetas por minuto
  default?: boolean
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

// Configuraciones predefinidas para tamaños de etiqueta
export const LABEL_SIZE_CONFIGS: Record<LabelSize, LabelSizeConfig> = {
  '29x90': {
    size: '29x90',
    width: 29,
    height: 90,
    rotation: 90, // Rotar 90 grados para que el barcode vaya a lo largo del lado corto
    transformOrigin: 'center',
    layout: {
      barcodeScale: 1.0, // Máxima prioridad - el barcode debe ser lo más grande posible
      codeScale: 0.8,   // Segunda prioridad - visible pero más pequeño
      nameScale: 0.6,   // Última prioridad - texto pequeño
      spacing: {
        barcodeToCode: 2, // 2mm entre barcode y código
        codeToName: 1     // 1mm entre código y nombre
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
      barcodeScale: 1.0, // Máxima prioridad
      codeScale: 0.9,   // Alta visibilidad
      nameScale: 0.7,   // Más pequeño pero legible
      spacing: {
        barcodeToCode: 3, // Más espacio en etiqueta más ancha
        codeToName: 2
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
      barcodeScale: 1.2, // Más grande en etiqueta grande
      codeScale: 1.0,   // Tamaño estándar
      nameScale: 0.8,   // Proporcionado al tamaño
      spacing: {
        barcodeToCode: 4, // Más espacio para etiqueta grande
        codeToName: 3
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

// Plantillas de etiquetas predefinidas para Brother QL-810W
export const BROTHER_QL810W_TEMPLATES: LabelTemplate[] = [
  {
    id: 'dk-11201',
    name: 'DK-11201 (29x90mm)',
    width: 29,
    height: 90,
    dpi: 300,
    default: true,
    layout: {
      barcode: {
        x: 5,
        y: 10,
        width: 19,
        height: 5
      },
      text: [
        {
          x: 5,
          y: 16,
          width: 19,
          height: 8,
          fontSize: 8,
          align: 'center'
        },
        {
          x: 5,
          y: 25,
          width: 19,
          height: 6,
          fontSize: 6,
          align: 'center'
        }
      ]
    }
  },
  {
    id: 'dk-11202',
    name: 'DK-11202 (62x100mm)',
    width: 62,
    height: 100,
    dpi: 300,
    layout: {
      barcode: {
        x: 10,
        y: 15,
        width: 42,
        height: 10
      },
      text: [
        {
          x: 10,
          y: 27,
          width: 42,
          height: 12,
          fontSize: 10,
          align: 'center'
        },
        {
          x: 10,
          y: 42,
          width: 42,
          height: 8,
          fontSize: 7,
          align: 'center'
        },
        {
          x: 10,
          y: 52,
          width: 42,
          height: 6,
          fontSize: 6,
          align: 'center'
        }
      ]
    }
  },
  {
    id: 'continuous-62mm',
    name: 'Continuous 62mm',
    width: 62,
    height: 40,
    dpi: 300,
    layout: {
      barcode: {
        x: 8,
        y: 8,
        width: 46,
        height: 8
      },
      text: [
        {
          x: 8,
          y: 18,
          width: 46,
          height: 10,
          fontSize: 9,
          align: 'center'
        },
        {
          x: 8,
          y: 29,
          width: 46,
          height: 6,
          fontSize: 6,
          align: 'center'
        }
      ]
    }
  }
]

// Configuraciones de impresora predefinidas
export const BROTHER_PRINTER_CONFIGS: PrinterConfig[] = [
  {
    id: 'ql-810w-usb',
    name: 'Brother QL-810W (USB)',
    model: 'QL-810W',
    vendorId: 0x04f9,
    productId: 0x209d,
    connection: 'usb',
    supportedSizes: ['DK-11201', 'DK-11202', 'Continuous 62mm'],
    resolution: { dpi: 300 },
    speed: 110,
    default: true
  },
  {
    id: 'ql-810w-network',
    name: 'Brother QL-810W (Network)',
    model: 'QL-810W',
    vendorId: 0x04f9,
    productId: 0x209d,
    connection: 'network',
    address: '192.168.1.100', // Default - configurable
    port: 9100,
    supportedSizes: ['DK-11201', 'DK-11202', 'Continuous 62mm'],
    resolution: { dpi: 300 },
    speed: 110
  }
]

// Eventos IPC para impresión
export interface BarcodeIPCEevents {
  'barcode:generate': (options: BarcodeOptions) => Promise<string>
  'barcode:validate': (format: BarcodeFormat, value: string) => Promise<{ valid: boolean; error?: string }>
  'barcode:print': (job: PrintJob) => Promise<{ success: boolean; message?: string }>
  'barcode:printBatch': (jobs: PrintJob[]) => Promise<{ success: boolean; message?: string; results?: any[] }>
  'printer:discover': () => Promise<PrinterConfig[]>
  'printer:status': (printerId: string) => Promise<{ connected: boolean; status: string; error?: string }>
  'printer:getConfig': (printerId: string) => Promise<PrinterConfig>
  'printer:setConfig': (config: PrinterConfig) => Promise<boolean>
  'print:getHistory': () => Promise<PrintJob[]>
  'print:clearHistory': () => Promise<boolean>
}
