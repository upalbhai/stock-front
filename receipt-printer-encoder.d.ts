/**
 * Type declarations for @point-of-sale/receipt-printer-encoder
 */

declare module "@point-of-sale/receipt-printer-encoder" {
  type Alignment = "left" | "center" | "right";

  interface ColumnDefinition {
    width: number;
    align?: Alignment;
  }

  interface EncoderOptions {
    /** Number of columns (characters per line). 32 = 58 mm, 48 = 80 mm */
    columns?: number;
    /** Optional printer model for capability hints */
    printerModel?: string;
    /** ESC/POS language (default: "esc-pos") */
    language?: string;
  }

  class ReceiptPrinterEncoder {
    constructor(options?: EncoderOptions);

    /** Reset the printer to its default state */
    initialize(): this;

    /** Set character codepage */
    codepage(value: string): this;

    /** Print text without a trailing newline */
    text(value: string): this;

    /** Print a newline */
    newline(): this;

    /** Print a line of text followed by a newline */
    line(value: string): this;

    /** Toggle underline */
    underline(value?: boolean): this;

    /** Toggle italic */
    italic(value?: boolean): this;

    /** Toggle bold */
    bold(value?: boolean): this;

    /** Toggle inverted (white on black) text */
    invert(value?: boolean): this;

    /** Set character width multiplier (1 = normal, 2 = double, etc.) */
    width(value: number): this;

    /** Set character height multiplier (1 = normal, 2 = double, etc.) */
    height(value: number): this;

    /** Set character width and height multipliers together */
    size(width: number, height: number): this;

    /** Set font (a = default, b = smaller condensed) */
    font(value: "a" | "b"): this;

    /** Set text alignment */
    align(value: Alignment): this;

    /**
     * Print a fixed-width table.
     * @param columns Column definitions (width + alignment)
     * @param rows    2-D array of cell strings
     */
    table(columns: ColumnDefinition[], rows: string[][]): this;

    /** Print a horizontal rule */
    rule(options?: { style?: "single" | "double"; width?: number }): this;

    /** Print a bordered box */
    box(options?: {
      style?: "single" | "double";
      width?: number;
      align?: Alignment;
      marginLeft?: number;
      marginRight?: number;
      paddingLeft?: number;
      paddingRight?: number;
    }): this;

    /** Print a barcode */
    barcode(value: string, symbology: string, height?: number): this;

    /** Print a QR code */
    qrcode(value: string, model?: number, size?: number, errorLevel?: string): this;

    /** Cut the paper */
    cut(value?: "full" | "partial"): this;

    /** Send a cash drawer pulse */
    pulse(device?: number, on?: number, off?: number): this;

    /** Insert raw bytes */
    raw(data: Uint8Array | number[]): this;

    /**
     * Encode all buffered commands into a Uint8Array of ESC/POS bytes
     * ready to be sent directly to a printer.
     */
    encode(): Uint8Array;
  }

  export default ReceiptPrinterEncoder;
}
