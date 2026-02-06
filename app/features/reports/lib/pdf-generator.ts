import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import {
  type PDFReportData,
  type PDFJournalEntry,
  SPANISH_MONTHS,
  formatCurrency,
  formatDate,
} from './pdf-types'

// Page dimensions (Letter size)
const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN_LEFT = 40
const MARGIN_RIGHT = 40
const MARGIN_TOP = 50
const MARGIN_BOTTOM = 50

// Column positions (from left margin)
const COL_TYPE = 0
const COL_NUMBER = 25
const COL_DATE = 75
const COL_ENTRY_DESC = 130
const COL_ACCOUNT_NUM = 215
const COL_ACCOUNT_NAME = 290
const COL_LINE_DESC = 385
const COL_DEBIT = 465
const COL_CREDIT = 520

// Column widths for text wrapping
const WIDTH_ENTRY_DESC = COL_ACCOUNT_NUM - COL_ENTRY_DESC - 5
const WIDTH_ACCOUNT_NAME = COL_LINE_DESC - COL_ACCOUNT_NAME - 5
const WIDTH_LINE_DESC = COL_DEBIT - COL_LINE_DESC - 5
const WIDTH_DEBIT = 50
const WIDTH_CREDIT = 50

// Row heights
const HEADER_ROW_HEIGHT = 14
const DATA_ROW_HEIGHT = 10
const ENTRY_SPACING = 8

// Font sizes
const TITLE_FONT_SIZE = 12
const HEADER_FONT_SIZE = 8
const DATA_FONT_SIZE = 7
const SUBTOTAL_FONT_SIZE = 7

/**
 * Wrap text to fit within a given width, returning array of lines
 */
function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  avgCharWidth: number
): string[] {
  if (!text) return ['']

  const maxChars = Math.floor(maxWidth / (avgCharWidth * fontSize))
  if (text.length <= maxChars) return [text]

  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length <= maxChars) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
      }
      // Handle very long words that need to be split
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

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : ['']
}

/**
 * Generate PDF for journal report following "Diario General" format
 */
export async function generateJournalPDF(data: PDFReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Average character width for Helvetica (approximation)
  const AVG_CHAR_WIDTH = 0.5

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let yPosition = PAGE_HEIGHT - MARGIN_TOP
  let folioNumber = 1

  const contentWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
  const monthName = SPANISH_MONTHS[data.period.month]
  const reportTitle = `DIARIO GENERAL DE ${monthName} ${data.period.year}`

  /**
   * Draw page header
   */
  function drawPageHeader() {
    // Company name
    page.drawText(data.companyName.toUpperCase(), {
      x: MARGIN_LEFT + contentWidth / 2 - (data.companyName.length * TITLE_FONT_SIZE * AVG_CHAR_WIDTH) / 2,
      y: yPosition,
      size: TITLE_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    yPosition -= TITLE_FONT_SIZE + 4

    // Report title
    page.drawText(reportTitle, {
      x: MARGIN_LEFT + contentWidth / 2 - (reportTitle.length * TITLE_FONT_SIZE * AVG_CHAR_WIDTH) / 2,
      y: yPosition,
      size: TITLE_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    yPosition -= TITLE_FONT_SIZE + 10

    // Folio number (right aligned)
    const folioText = `Folio: ${folioNumber.toString().padStart(5, '0')}`
    page.drawText(folioText, {
      x: PAGE_WIDTH - MARGIN_RIGHT - 60,
      y: yPosition + HEADER_ROW_HEIGHT,
      size: HEADER_FONT_SIZE,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })

    // Table header row 1
    const headerRow1 = [
      { text: 'Tipo', x: COL_TYPE },
      { text: 'Número', x: COL_NUMBER },
      { text: 'Fecha', x: COL_DATE },
      { text: 'Concepto de la póliza', x: COL_ENTRY_DESC },
    ]

    for (const item of headerRow1) {
      page.drawText(item.text, {
        x: MARGIN_LEFT + item.x,
        y: yPosition,
        size: HEADER_FONT_SIZE,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
    }
    yPosition -= HEADER_ROW_HEIGHT

    // Table header row 2 - with centered Debe and Haber
    const headerRow2Left = [
      { text: 'No. de cuenta', x: COL_ACCOUNT_NUM },
      { text: 'Descripción de la cuenta', x: COL_ACCOUNT_NAME },
      { text: 'Concepto del mov.', x: COL_LINE_DESC },
    ]

    for (const item of headerRow2Left) {
      page.drawText(item.text, {
        x: MARGIN_LEFT + item.x,
        y: yPosition,
        size: HEADER_FONT_SIZE,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
    }

    // Center "Debe" header
    const debeText = 'Debe'
    const debeWidth = debeText.length * HEADER_FONT_SIZE * AVG_CHAR_WIDTH
    page.drawText(debeText, {
      x: MARGIN_LEFT + COL_DEBIT + (WIDTH_DEBIT - debeWidth) / 2,
      y: yPosition,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // Center "Haber" header
    const haberText = 'Haber'
    const haberWidth = haberText.length * HEADER_FONT_SIZE * AVG_CHAR_WIDTH
    page.drawText(haberText, {
      x: MARGIN_LEFT + COL_CREDIT + (WIDTH_CREDIT - haberWidth) / 2,
      y: yPosition,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    yPosition -= HEADER_ROW_HEIGHT

    // Draw header separator line (full width)
    page.drawLine({
      start: { x: MARGIN_LEFT, y: yPosition + 2 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition + 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
    yPosition -= 4
  }

  /**
   * Check if we need a new page and create one if needed
   */
  function checkNewPage(neededHeight: number) {
    if (yPosition - neededHeight < MARGIN_BOTTOM) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      yPosition = PAGE_HEIGHT - MARGIN_TOP
      folioNumber++
      drawPageHeader()
    }
  }

  /**
   * Draw wrapped text at position, returns number of lines drawn
   */
  function drawWrappedText(
    lines: string[],
    x: number,
    startY: number,
    fontSize: number,
    usedFont: typeof font
  ): number {
    for (let i = 0; i < lines.length; i++) {
      page.drawText(lines[i], {
        x,
        y: startY - i * DATA_ROW_HEIGHT,
        size: fontSize,
        font: usedFont,
        color: rgb(0, 0, 0),
      })
    }
    return lines.length
  }

  /**
   * Draw a single journal entry with all its lines
   */
  function drawEntry(entry: PDFJournalEntry) {
    // Wrap entry description
    const entryDescLines = wrapText(entry.description, WIDTH_ENTRY_DESC, DATA_FONT_SIZE, AVG_CHAR_WIDTH)

    // Calculate the height needed for each line in the entry
    let totalLinesNeeded = 0
    const lineWrappedData: { accountName: string[]; lineDesc: string[] }[] = []

    for (const line of entry.lines) {
      const accountNameLines = wrapText(line.accountName, WIDTH_ACCOUNT_NAME, DATA_FONT_SIZE, AVG_CHAR_WIDTH)
      const lineDescLines = wrapText(line.description || '', WIDTH_LINE_DESC, DATA_FONT_SIZE, AVG_CHAR_WIDTH)
      const maxLines = Math.max(accountNameLines.length, lineDescLines.length, 1)
      totalLinesNeeded += maxLines
      lineWrappedData.push({ accountName: accountNameLines, lineDesc: lineDescLines })
    }

    // Include entry description lines and subtotal
    const entryDescHeight = entryDescLines.length * DATA_ROW_HEIGHT
    const linesHeight = totalLinesNeeded * DATA_ROW_HEIGHT
    const subtotalHeight = DATA_ROW_HEIGHT + ENTRY_SPACING + 6 // Extra for double line
    const totalEntryHeight = Math.max(entryDescHeight, linesHeight) + subtotalHeight

    checkNewPage(totalEntryHeight)

    // Draw entry header (type, number, date) - first line only
    page.drawText(entry.type, {
      x: MARGIN_LEFT + COL_TYPE,
      y: yPosition,
      size: DATA_FONT_SIZE,
      font: font,
      color: rgb(0, 0, 0),
    })

    page.drawText(entry.number, {
      x: MARGIN_LEFT + COL_NUMBER,
      y: yPosition,
      size: DATA_FONT_SIZE,
      font: font,
      color: rgb(0, 0, 0),
    })

    page.drawText(formatDate(entry.date), {
      x: MARGIN_LEFT + COL_DATE,
      y: yPosition,
      size: DATA_FONT_SIZE,
      font: font,
      color: rgb(0, 0, 0),
    })

    // Draw wrapped entry description
    drawWrappedText(entryDescLines, MARGIN_LEFT + COL_ENTRY_DESC, yPosition, DATA_FONT_SIZE, font)

    // Draw lines for this entry
    for (let i = 0; i < entry.lines.length; i++) {
      const line = entry.lines[i]
      const wrappedData = lineWrappedData[i]
      const maxLines = Math.max(wrappedData.accountName.length, wrappedData.lineDesc.length, 1)

      // Account number
      page.drawText(line.accountNumber || '', {
        x: MARGIN_LEFT + COL_ACCOUNT_NUM,
        y: yPosition,
        size: DATA_FONT_SIZE,
        font: font,
        color: rgb(0, 0, 0),
      })

      // Account name (wrapped)
      drawWrappedText(wrappedData.accountName, MARGIN_LEFT + COL_ACCOUNT_NAME, yPosition, DATA_FONT_SIZE, font)

      // Line description (wrapped)
      drawWrappedText(wrappedData.lineDesc, MARGIN_LEFT + COL_LINE_DESC, yPosition, DATA_FONT_SIZE, font)

      // Debit (right aligned)
      if (line.debit > 0) {
        const debitText = formatCurrency(line.debit)
        const debitWidth = debitText.length * DATA_FONT_SIZE * AVG_CHAR_WIDTH
        page.drawText(debitText, {
          x: MARGIN_LEFT + COL_DEBIT + WIDTH_DEBIT - debitWidth,
          y: yPosition,
          size: DATA_FONT_SIZE,
          font: font,
          color: rgb(0, 0, 0),
        })
      }

      // Credit (right aligned)
      if (line.credit > 0) {
        const creditText = formatCurrency(line.credit)
        const creditWidth = creditText.length * DATA_FONT_SIZE * AVG_CHAR_WIDTH
        page.drawText(creditText, {
          x: MARGIN_LEFT + COL_CREDIT + WIDTH_CREDIT - creditWidth,
          y: yPosition,
          size: DATA_FONT_SIZE,
          font: font,
          color: rgb(0, 0, 0),
        })
      }

      yPosition -= maxLines * DATA_ROW_HEIGHT
    }

    // Draw subtotal row for this entry
    const subtotalText = 'Total de la póliza:'
    page.drawText(subtotalText, {
      x: MARGIN_LEFT + COL_LINE_DESC - 10,
      y: yPosition,
      size: SUBTOTAL_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // Subtotal debit (right aligned)
    const subtotalDebitText = formatCurrency(entry.subtotalDebit)
    const subtotalDebitWidth = subtotalDebitText.length * SUBTOTAL_FONT_SIZE * AVG_CHAR_WIDTH
    page.drawText(subtotalDebitText, {
      x: MARGIN_LEFT + COL_DEBIT + WIDTH_DEBIT - subtotalDebitWidth,
      y: yPosition,
      size: SUBTOTAL_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // Subtotal credit (right aligned)
    const subtotalCreditText = formatCurrency(entry.subtotalCredit)
    const subtotalCreditWidth = subtotalCreditText.length * SUBTOTAL_FONT_SIZE * AVG_CHAR_WIDTH
    page.drawText(subtotalCreditText, {
      x: MARGIN_LEFT + COL_CREDIT + WIDTH_CREDIT - subtotalCreditWidth,
      y: yPosition,
      size: SUBTOTAL_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    yPosition -= DATA_ROW_HEIGHT

    // Draw double line after subtotal
    const lineY = yPosition + DATA_ROW_HEIGHT - 2
    page.drawLine({
      start: { x: MARGIN_LEFT, y: lineY },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: lineY },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
    page.drawLine({
      start: { x: MARGIN_LEFT, y: lineY - 2 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: lineY - 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })

    yPosition -= ENTRY_SPACING
  }

  /**
   * Draw the final totals row
   */
  function drawFinalTotals() {
    checkNewPage(DATA_ROW_HEIGHT * 2)

    // Draw separator line
    page.drawLine({
      start: { x: MARGIN_LEFT, y: yPosition + DATA_ROW_HEIGHT },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition + DATA_ROW_HEIGHT },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })

    // Total entries count
    const totalEntriesText = `Total de pólizas reportadas: ${data.totalEntries}`
    page.drawText(totalEntriesText, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // "Totales:" label
    page.drawText('Totales:', {
      x: MARGIN_LEFT + COL_LINE_DESC + 20,
      y: yPosition,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // Grand total debit (right aligned)
    const grandDebitText = formatCurrency(data.grandTotalDebit)
    const grandDebitWidth = grandDebitText.length * HEADER_FONT_SIZE * AVG_CHAR_WIDTH
    page.drawText(grandDebitText, {
      x: MARGIN_LEFT + COL_DEBIT + WIDTH_DEBIT - grandDebitWidth,
      y: yPosition,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    // Grand total credit (right aligned)
    const grandCreditText = formatCurrency(data.grandTotalCredit)
    const grandCreditWidth = grandCreditText.length * HEADER_FONT_SIZE * AVG_CHAR_WIDTH
    page.drawText(grandCreditText, {
      x: MARGIN_LEFT + COL_CREDIT + WIDTH_CREDIT - grandCreditWidth,
      y: yPosition,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
  }

  // Draw the PDF content
  drawPageHeader()

  // Draw all entries
  for (const entry of data.entries) {
    drawEntry(entry)
  }

  // Draw final totals
  if (data.entries.length > 0) {
    drawFinalTotals()
  }

  // Return the PDF as bytes
  return await pdfDoc.save()
}
