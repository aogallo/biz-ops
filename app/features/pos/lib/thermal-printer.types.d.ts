// Type declarations for @point-of-sale/receipt-printer-encoder (no official types)
declare module '@point-of-sale/receipt-printer-encoder' {
  interface EncoderOptions {
    language?: 'esc-pos' | 'star-prnt' | 'star-line'
    columns?: number
    codepageMapping?: string
  }

  type Alignment = 'left' | 'center' | 'right'
  type CutMode = 'full' | 'partial'
  type FontType = 'A' | 'B'

  class ReceiptPrinterEncoder {
    constructor(options?: EncoderOptions)
    initialize(): this
    align(alignment: Alignment): this
    bold(enabled?: boolean): this
    underline(enabled?: boolean): this
    invert(enabled?: boolean): this
    font(font: FontType): this
    width(multiplier: number): this
    height(multiplier: number): this
    size(width: number, height?: number): this
    text(value: string): this
    line(value: string): this
    newline(count?: number): this
    rule(options?: { style?: 'single' | 'double'; width?: number }): this
    table(
      columns: Array<{
        width: number
        marginRight?: number
        align?: Alignment
      }>,
      data: Array<Array<string | ((encoder: ReceiptPrinterEncoder) => void)>>
    ): this
    cut(mode?: CutMode): this
    raw(data: Uint8Array | number[]): this
    encode(): Uint8Array
  }

  export default ReceiptPrinterEncoder
}

// Web Serial API types (browser API, not in standard lib)
interface SerialPort {
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
  readonly readable: ReadableStream | null
  readonly writable: WritableStream | null
}

interface SerialOptions {
  baudRate: number
  dataBits?: number
  stopBits?: number
  parity?: 'none' | 'even' | 'odd'
  bufferSize?: number
  flowControl?: 'none' | 'hardware'
}

interface Serial extends EventTarget {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
  getPorts(): Promise<SerialPort[]>
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[]
}

interface SerialPortFilter {
  usbVendorId?: number
  usbProductId?: number
}

interface Navigator {
  readonly serial?: Serial
}
