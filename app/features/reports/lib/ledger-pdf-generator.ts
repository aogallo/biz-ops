import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFLedgerReportData } from './ledger-pdf-types'
import { formatCurrency } from './pdf-types'

// Landscape Letter dimensions
const PAGE_WIDTH = 792
const PAGE_HEIGHT = 612
const MARGIN_LEFT = 25
const MARGIN_RIGHT = 25
const MARGIN_TOP = 40
const MARGIN_BOTTOM = 35

// Font sizes (small to fit SAT columns)
const TITLE_FONT_SIZE = 9
const HEADER_FONT_SIZE = 6
const DATA_FONT_SIZE = 5.5
const TOTAL_FONT_SIZE = 6

const DATA_ROW_HEIGHT = 8
const HEADER_ROW_HEIGHT = 10
const AVG_CHAR_WIDTH = 0.52

// Column layout for landscape SAT format
// Content width = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT = 792 - 25 - 25 = 742
// Numeric section (from 310): 432px available for 8 num cols + IVA + Total
const COL = {
  fecha: 0,
  tipoDoc: 48,
  tipoTran: 78,
  serie: 95,
  noDocto: 125,
  nit: 170,
  nombre: 215,
  localGravBienes: 310,
  localGravServ: 354,
  localExBienes: 398,
  localExServ: 442,
  importGravBienes: 486,
  importGravServ: 530,
  importExBienes: 574,
  importExServ: 618,
  iva: 662,
  total: 694, // ends at 694 + 48 = 742 = content width ✓
}

const COL_WIDTH = {
  fecha: 45,
  tipoDoc: 28,
  tipoTran: 15,
  serie: 28,
  noDocto: 43,
  nit: 43,
  nombre: 93,
  num: 42,
  iva: 30,
  total: 48,
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  if (!text) return ['']
  const maxChars = Math.floor(maxWidth / (AVG_CHAR_WIDTH * fontSize))
  if (text.length <= maxChars) return [text]

  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length <= maxChars) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      if (word.length > maxChars) {
        let remaining = word
        while (remaining.length > maxChars) {
          lines.push(remaining.substring(0, maxChars))
          remaining = remaining.substring(maxChars)
        }
        currentLine = remaining
      } else {
        currentLine = word
      }
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines.length > 0 ? lines : ['']
}

function drawRightAligned(
  page: ReturnType<typeof PDFDocument.prototype.addPage>,
  text: string,
  x: number,
  width: number,
  y: number,
  fontSize: number,
  font: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
) {
  const textWidth = text.length * fontSize * AVG_CHAR_WIDTH
  page.drawText(text, {
    x: x + width - textWidth,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
}

export async function generateLedgerPDF(
  data: PDFLedgerReportData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let yPosition = PAGE_HEIGHT - MARGIN_TOP
  let folioNumber = 1

  const contentWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

  function drawCentered(text: string, y: number, fontSize: number, usedFont: typeof font) {
    const textWidth = text.length * fontSize * AVG_CHAR_WIDTH
    page.drawText(text, {
      x: MARGIN_LEFT + (contentWidth - textWidth) / 2,
      y,
      size: fontSize,
      font: usedFont,
      color: rgb(0, 0, 0),
    })
  }

  function drawPageHeader() {
    // Company name
    drawCentered(data.companyName.toUpperCase(), yPosition, TITLE_FONT_SIZE, boldFont)
    yPosition -= TITLE_FONT_SIZE + 3

    // Report title
    drawCentered(data.reportTitle, yPosition, TITLE_FONT_SIZE, boldFont)
    yPosition -= TITLE_FONT_SIZE + 3

    // Date range
    const dateRangeText = `DEL ${data.dateFrom} AL ${data.dateTo}`
    drawCentered(dateRangeText, yPosition, HEADER_FONT_SIZE + 1, font)
    yPosition -= HEADER_FONT_SIZE + 6

    // Folio (right)
    const folioText = `Folio: ${folioNumber.toString().padStart(5, '0')}`
    page.drawText(folioText, {
      x: PAGE_WIDTH - MARGIN_RIGHT - 55,
      y: yPosition + HEADER_ROW_HEIGHT + 2,
      size: HEADER_FONT_SIZE,
      font,
      color: rgb(0.3, 0.3, 0.3),
    })

    // Header Row 1: grouped columns
    const headerY = yPosition

    // Left-side headers
    const row1Headers = [
      { text: 'Fecha', x: COL.fecha },
      { text: 'Tipo Doc.', x: COL.tipoDoc },
      { text: 'T', x: COL.tipoTran },
      { text: 'Serie', x: COL.serie },
      { text: 'No. Docto.', x: COL.noDocto },
      { text: 'NIT', x: COL.nit },
      { text: 'Nombre', x: COL.nombre },
    ]

    for (const h of row1Headers) {
      page.drawText(h.text, {
        x: MARGIN_LEFT + h.x,
        y: headerY,
        size: HEADER_FONT_SIZE,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
    }

    // "Local" spanning 4 columns
    const localStart = COL.localGravBienes
    const localEnd = COL.localExServ + COL_WIDTH.num
    const localCenter = localStart + (localEnd - localStart) / 2
    page.drawText('Local', {
      x: MARGIN_LEFT + localCenter - 8,
      y: headerY,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // "Importacion" spanning 4 columns
    const impStart = COL.importGravBienes
    const impEnd = COL.importExServ + COL_WIDTH.num
    const impCenter = impStart + (impEnd - impStart) / 2
    page.drawText('Importacion', {
      x: MARGIN_LEFT + impCenter - 14,
      y: headerY,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // IVA and Total
    page.drawText('IVA', {
      x: MARGIN_LEFT + COL.iva,
      y: headerY,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    page.drawText('Total', {
      x: MARGIN_LEFT + COL.total,
      y: headerY,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    yPosition -= HEADER_ROW_HEIGHT

    // Header Row 2: sub-columns under Local and Import
    const subHeaders = [
      { text: 'Grav. Bienes', x: COL.localGravBienes },
      { text: 'Grav. Serv.', x: COL.localGravServ },
      { text: 'Ex. Bienes', x: COL.localExBienes },
      { text: 'Ex. Serv.', x: COL.localExServ },
      { text: 'Grav. Bienes', x: COL.importGravBienes },
      { text: 'Grav. Serv.', x: COL.importGravServ },
      { text: 'Ex. Bienes', x: COL.importExBienes },
      { text: 'Ex. Serv.', x: COL.importExServ },
    ]

    for (const h of subHeaders) {
      page.drawText(h.text, {
        x: MARGIN_LEFT + h.x,
        y: yPosition,
        size: HEADER_FONT_SIZE,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
    }

    yPosition -= HEADER_ROW_HEIGHT

    // Separator line
    page.drawLine({
      start: { x: MARGIN_LEFT, y: yPosition + 3 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition + 3 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
    yPosition -= 3
  }

  function checkNewPage(neededHeight: number) {
    if (yPosition - neededHeight < MARGIN_BOTTOM) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      yPosition = PAGE_HEIGHT - MARGIN_TOP
      folioNumber++
      drawPageHeader()
    }
  }

  function drawDataRow(row: PDFLedgerReportData['rows'][number]) {
    // Wrap nombre for multi-line
    const nombreLines = wrapText(row.nombre, COL_WIDTH.nombre, DATA_FONT_SIZE)
    const rowHeight = Math.max(nombreLines.length, 1) * DATA_ROW_HEIGHT

    checkNewPage(rowHeight)

    const y = yPosition

    // Fixed text columns
    page.drawText(row.fecha, {
      x: MARGIN_LEFT + COL.fecha,
      y,
      size: DATA_FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    })

    page.drawText(row.tipoDoc, {
      x: MARGIN_LEFT + COL.tipoDoc,
      y,
      size: DATA_FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    })

    page.drawText(row.tipoTran, {
      x: MARGIN_LEFT + COL.tipoTran,
      y,
      size: DATA_FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    })

    // Serie (wrapped)
    const serieLines = wrapText(row.serie, COL_WIDTH.serie, DATA_FONT_SIZE)
    for (let i = 0; i < serieLines.length; i++) {
      page.drawText(serieLines[i], {
        x: MARGIN_LEFT + COL.serie,
        y: y - i * DATA_ROW_HEIGHT,
        size: DATA_FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      })
    }

    // No. Docto (wrapped)
    const doctoLines = wrapText(row.noDocto, COL_WIDTH.noDocto, DATA_FONT_SIZE)
    for (let i = 0; i < doctoLines.length; i++) {
      page.drawText(doctoLines[i], {
        x: MARGIN_LEFT + COL.noDocto,
        y: y - i * DATA_ROW_HEIGHT,
        size: DATA_FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      })
    }

    // NIT (wrapped)
    const nitLines = wrapText(row.nit, COL_WIDTH.nit, DATA_FONT_SIZE)
    for (let i = 0; i < nitLines.length; i++) {
      page.drawText(nitLines[i], {
        x: MARGIN_LEFT + COL.nit,
        y: y - i * DATA_ROW_HEIGHT,
        size: DATA_FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      })
    }

    // Nombre (wrapped)
    for (let i = 0; i < nombreLines.length; i++) {
      page.drawText(nombreLines[i], {
        x: MARGIN_LEFT + COL.nombre,
        y: y - i * DATA_ROW_HEIGHT,
        size: DATA_FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      })
    }

    // Numeric columns (right-aligned)
    const numCols: { value: number; x: number }[] = [
      { value: row.localGravadosBienes, x: COL.localGravBienes },
      { value: row.localGravadosServicios, x: COL.localGravServ },
      { value: row.localExentosBienes, x: COL.localExBienes },
      { value: row.localExentosServicios, x: COL.localExServ },
      { value: row.importGravadosBienes, x: COL.importGravBienes },
      { value: row.importGravadosServicios, x: COL.importGravServ },
      { value: row.importExentosBienes, x: COL.importExBienes },
      { value: row.importExentosServicios, x: COL.importExServ },
    ]

    for (const col of numCols) {
      if (col.value !== 0) {
        drawRightAligned(page, formatCurrency(col.value), MARGIN_LEFT + col.x, COL_WIDTH.num, y, DATA_FONT_SIZE, font)
      }
    }

    // IVA
    if (row.ivaAmount !== 0) {
      drawRightAligned(page, formatCurrency(row.ivaAmount), MARGIN_LEFT + COL.iva, COL_WIDTH.iva, y, DATA_FONT_SIZE, font)
    }

    // Total
    drawRightAligned(page, formatCurrency(row.totalDocumento), MARGIN_LEFT + COL.total, COL_WIDTH.total, y, DATA_FONT_SIZE, font)

    const maxLines = Math.max(nombreLines.length, serieLines.length, doctoLines.length, nitLines.length, 1)
    yPosition -= maxLines * DATA_ROW_HEIGHT
  }

  function drawGrandTotals() {
    checkNewPage(DATA_ROW_HEIGHT * 3)

    // Separator
    page.drawLine({
      start: { x: MARGIN_LEFT, y: yPosition + DATA_ROW_HEIGHT - 2 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition + DATA_ROW_HEIGHT - 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })

    const y = yPosition

    // Total documents label
    page.drawText(`Total Documentos: ${data.totalDocuments}`, {
      x: MARGIN_LEFT,
      y,
      size: TOTAL_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    page.drawText('TOTALES:', {
      x: MARGIN_LEFT + COL.nombre,
      y,
      size: TOTAL_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    const gt = data.grandTotals
    const totCols: { value: number; x: number }[] = [
      { value: gt.localGravadosBienes, x: COL.localGravBienes },
      { value: gt.localGravadosServicios, x: COL.localGravServ },
      { value: gt.localExentosBienes, x: COL.localExBienes },
      { value: gt.localExentosServicios, x: COL.localExServ },
      { value: gt.importGravadosBienes, x: COL.importGravBienes },
      { value: gt.importGravadosServicios, x: COL.importGravServ },
      { value: gt.importExentosBienes, x: COL.importExBienes },
      { value: gt.importExentosServicios, x: COL.importExServ },
    ]

    for (const col of totCols) {
      drawRightAligned(page, formatCurrency(col.value), MARGIN_LEFT + col.x, COL_WIDTH.num, y, TOTAL_FONT_SIZE, boldFont)
    }

    drawRightAligned(page, formatCurrency(gt.ivaAmount), MARGIN_LEFT + COL.iva, COL_WIDTH.iva, y, TOTAL_FONT_SIZE, boldFont)
    drawRightAligned(page, formatCurrency(gt.totalDocumento), MARGIN_LEFT + COL.total, COL_WIDTH.total, y, TOTAL_FONT_SIZE, boldFont)

    yPosition -= DATA_ROW_HEIGHT

    // Double line
    page.drawLine({
      start: { x: MARGIN_LEFT, y: yPosition + DATA_ROW_HEIGHT - 2 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition + DATA_ROW_HEIGHT - 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
    page.drawLine({
      start: { x: MARGIN_LEFT, y: yPosition + DATA_ROW_HEIGHT - 4 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition + DATA_ROW_HEIGHT - 4 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
  }

  // Build the PDF
  drawPageHeader()

  for (const row of data.rows) {
    drawDataRow(row)
  }

  if (data.rows.length > 0) {
    drawGrandTotals()
  }

  return await pdfDoc.save()
}
