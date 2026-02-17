import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFGeneralLedgerReportData } from './general-ledger-types'
import { formatCurrency } from './pdf-types'

// Landscape Letter dimensions
const PAGE_WIDTH = 792
const PAGE_HEIGHT = 612
const MARGIN_LEFT = 30
const MARGIN_RIGHT = 30
const MARGIN_TOP = 40
const MARGIN_BOTTOM = 35

// Font sizes
const TITLE_FONT_SIZE = 10
const HEADER_FONT_SIZE = 7
const DATA_FONT_SIZE = 6.5
const TOTAL_FONT_SIZE = 7

const DATA_ROW_HEIGHT = 10
const HEADER_ROW_HEIGHT = 12
const AVG_CHAR_WIDTH = 0.52

// Column layout
const COL = {
  cuenta: 0,
  tipo: 200,
  numero: 240,
  fecha: 300,
  descripcion: 360,
  saldoInicial: 510,
  cargos: 580,
  abonos: 650,
  saldoFinal: 720,
}

const COL_WIDTH = {
  cuenta: 195,
  tipo: 38,
  numero: 58,
  fecha: 58,
  descripcion: 148,
  num: 65,
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

export async function generateGeneralLedgerPDF(
  data: PDFGeneralLedgerReportData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let yPosition = PAGE_HEIGHT - MARGIN_TOP
  let folioNumber = 1

  const contentWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

  function drawCentered(
    text: string,
    y: number,
    fontSize: number,
    usedFont: typeof font
  ) {
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

    // Column headers
    const headers = [
      { text: 'Cuenta', x: COL.cuenta },
      { text: 'Tipo', x: COL.tipo },
      { text: 'Numero', x: COL.numero },
      { text: 'Fecha', x: COL.fecha },
      { text: 'Descripcion', x: COL.descripcion },
      { text: 'Saldo Inicial', x: COL.saldoInicial },
      { text: 'Cargos', x: COL.cargos },
      { text: 'Abonos', x: COL.abonos },
      { text: 'Saldo Final', x: COL.saldoFinal },
    ]

    for (const h of headers) {
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

  // Build the PDF
  drawPageHeader()

  for (const row of data.rows) {
    if (row.rowType === 'account-header') {
      checkNewPage(DATA_ROW_HEIGHT * 2)

      // Small spacing before account group
      yPosition -= 3

      const label = `${row.accountNumber} — ${row.accountName}`
      const indent = row.level * 8

      page.drawText(label, {
        x: MARGIN_LEFT + COL.cuenta + indent,
        y: yPosition,
        size: DATA_FONT_SIZE,
        font: boldFont,
        color: rgb(0, 0, 0),
      })

      if (row.openingBalance !== 0) {
        drawRightAligned(
          page,
          formatCurrency(row.openingBalance),
          MARGIN_LEFT + COL.saldoInicial,
          COL_WIDTH.num,
          yPosition,
          DATA_FONT_SIZE,
          boldFont
        )
      }

      yPosition -= DATA_ROW_HEIGHT
    } else if (row.rowType === 'transaction') {
      const descLines = wrapText(row.description, COL_WIDTH.descripcion, DATA_FONT_SIZE)
      const rowHeight = Math.max(descLines.length, 1) * DATA_ROW_HEIGHT
      checkNewPage(rowHeight)

      const y = yPosition

      // Type
      page.drawText(row.entryType, {
        x: MARGIN_LEFT + COL.tipo,
        y,
        size: DATA_FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      })

      // Number
      page.drawText(row.entryNumber, {
        x: MARGIN_LEFT + COL.numero,
        y,
        size: DATA_FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      })

      // Date
      page.drawText(row.entryDate, {
        x: MARGIN_LEFT + COL.fecha,
        y,
        size: DATA_FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      })

      // Description (wrapped)
      for (let i = 0; i < descLines.length; i++) {
        page.drawText(descLines[i], {
          x: MARGIN_LEFT + COL.descripcion,
          y: y - i * DATA_ROW_HEIGHT,
          size: DATA_FONT_SIZE,
          font,
          color: rgb(0, 0, 0),
        })
      }

      // Debit
      if (row.debit !== 0) {
        drawRightAligned(
          page,
          formatCurrency(row.debit),
          MARGIN_LEFT + COL.cargos,
          COL_WIDTH.num,
          y,
          DATA_FONT_SIZE,
          font
        )
      }

      // Credit
      if (row.credit !== 0) {
        drawRightAligned(
          page,
          formatCurrency(row.credit),
          MARGIN_LEFT + COL.abonos,
          COL_WIDTH.num,
          y,
          DATA_FONT_SIZE,
          font
        )
      }

      // Running balance
      drawRightAligned(
        page,
        formatCurrency(row.runningBalance),
        MARGIN_LEFT + COL.saldoFinal,
        COL_WIDTH.num,
        y,
        DATA_FONT_SIZE,
        font
      )

      yPosition -= Math.max(descLines.length, 1) * DATA_ROW_HEIGHT
    } else if (row.rowType === 'account-total') {
      checkNewPage(DATA_ROW_HEIGHT * 2)

      // Separator line above total
      page.drawLine({
        start: { x: MARGIN_LEFT + COL.cargos, y: yPosition + DATA_ROW_HEIGHT - 2 },
        end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition + DATA_ROW_HEIGHT - 2 },
        thickness: 0.3,
        color: rgb(0.5, 0.5, 0.5),
      })

      const y = yPosition
      const totalLabel = `Total: ${row.accountNumber}`

      page.drawText(totalLabel, {
        x: MARGIN_LEFT + COL.descripcion,
        y,
        size: DATA_FONT_SIZE,
        font: boldFont,
        color: rgb(0, 0, 0),
      })

      drawRightAligned(
        page,
        formatCurrency(row.totalDebit),
        MARGIN_LEFT + COL.cargos,
        COL_WIDTH.num,
        y,
        DATA_FONT_SIZE,
        boldFont
      )

      drawRightAligned(
        page,
        formatCurrency(row.totalCredit),
        MARGIN_LEFT + COL.abonos,
        COL_WIDTH.num,
        y,
        DATA_FONT_SIZE,
        boldFont
      )

      drawRightAligned(
        page,
        formatCurrency(row.closingBalance),
        MARGIN_LEFT + COL.saldoFinal,
        COL_WIDTH.num,
        y,
        DATA_FONT_SIZE,
        boldFont
      )

      yPosition -= DATA_ROW_HEIGHT + 3
    }
  }

  // Grand totals
  if (data.rows.length > 0) {
    checkNewPage(DATA_ROW_HEIGHT * 3)

    // Double separator
    page.drawLine({
      start: { x: MARGIN_LEFT, y: yPosition + DATA_ROW_HEIGHT - 2 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition + DATA_ROW_HEIGHT - 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })

    const y = yPosition

    page.drawText('GRAN TOTAL', {
      x: MARGIN_LEFT + COL.descripcion,
      y,
      size: TOTAL_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    drawRightAligned(
      page,
      formatCurrency(data.grandTotals.totalOpeningBalance),
      MARGIN_LEFT + COL.saldoInicial,
      COL_WIDTH.num,
      y,
      TOTAL_FONT_SIZE,
      boldFont
    )

    drawRightAligned(
      page,
      formatCurrency(data.grandTotals.totalDebit),
      MARGIN_LEFT + COL.cargos,
      COL_WIDTH.num,
      y,
      TOTAL_FONT_SIZE,
      boldFont
    )

    drawRightAligned(
      page,
      formatCurrency(data.grandTotals.totalCredit),
      MARGIN_LEFT + COL.abonos,
      COL_WIDTH.num,
      y,
      TOTAL_FONT_SIZE,
      boldFont
    )

    drawRightAligned(
      page,
      formatCurrency(data.grandTotals.totalClosingBalance),
      MARGIN_LEFT + COL.saldoFinal,
      COL_WIDTH.num,
      y,
      TOTAL_FONT_SIZE,
      boldFont
    )

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

  return await pdfDoc.save()
}
