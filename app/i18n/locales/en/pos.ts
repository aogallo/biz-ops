export const pos = {
  // Terminal selection
  'pos.title': 'Point of Sale',
  'pos.welcome': 'Welcome, {{name}}. Select a terminal to begin.',
  'pos.noTerminals': 'No terminals configured',
  'pos.noTerminalsDescription':
    'Set up at least one terminal from the settings section.',
  'pos.configureTerminals': 'Configure Terminals',
  'pos.backToErp': 'Back to ERP',

  // Header
  'pos.sales': 'Sales',
  'pos.exit': 'Exit',
  'pos.myShift': 'My Shift',
  'pos.cashRegisterHistory': 'Register History',
  'pos.shiftDuration': '{{h}}h {{m}}m',

  // Product search
  'pos.searchProduct': 'Search product or scan code...',

  // Product grid
  'pos.allCategories': 'All',
  'pos.stock': 'Stock',
  'pos.noProducts': 'No products found',

  // Cart
  'pos.emptyCart': 'Empty cart',
  'pos.checkoutWithCount': 'CHECKOUT ({{count}})',
  'pos.subtotal': 'Subtotal',
  'pos.discount': 'Discount',
  'pos.iva': 'IVA (12%)',
  'pos.total': 'TOTAL',
  'pos.checkout': 'CHECKOUT',
  'pos.perUnit': 'each',

  // Customer search
  'pos.defaultCustomer': 'Walk-in Customer',
  'pos.searchCustomer': 'Search customer...',
  'pos.noResults': 'No results',
  'pos.createCustomer': 'Create Customer',

  // Payment dialog
  'pos.collect': 'Collect Payment',
  'pos.totalToCollect': 'Total to collect',
  'pos.cash': 'Cash',
  'pos.card': 'Card',
  'pos.check': 'Check',
  'pos.receivedAmount': 'Received amount',
  'pos.exact': 'Exact',
  'pos.roundUp': 'Round up',
  'pos.change': 'Change',
  'pos.last4Digits': 'Last 4 digits (optional)',
  'pos.checkNumber': 'Check number',
  'pos.processing': 'Processing...',
  'pos.confirmPayment': 'Confirm Payment',
  'pos.remaining': 'Remaining',
  'pos.addPayment': 'Add Payment',
  'pos.splitPayment': 'Split Payment',
  'pos.paymentAdded': 'Payment added',
  'pos.overpayment': 'Change due',
  'pos.amount': 'Amount',

  // Receipt
  'pos.receipt': 'Receipt',
  'pos.saleReceipt': 'SALE RECEIPT',
  'pos.terminal': 'Terminal',
  'pos.cashier': 'Cashier',
  'pos.customer': 'Customer',
  'pos.product': 'Product',
  'pos.payments': 'Payments',
  'pos.received': 'Received',
  'pos.thankYou': 'Thank you for your purchase!',
  'pos.close': 'Close',
  'pos.print': 'Print',

  // Sales history
  'pos.salesHistory': 'POS Sales History',
  'pos.backToPos': 'Back to POS',
  'pos.saleNumber': 'Sale No.',
  'pos.terminalCol': 'Terminal',
  'pos.cashierCol': 'Cashier',
  'pos.customerCol': 'Customer',
  'pos.statusCol': 'Status',
  'pos.dateCol': 'Date',
  'pos.completed': 'Completed',
  'pos.voided': 'Voided',
  'pos.refunded': 'Refunded',

  // Sale detail
  'pos.sale': 'Sale',
  'pos.products': 'Products',
  'pos.voidSale': 'Void Sale',
  'pos.voiding': 'Voiding...',

  // Terminal settings
  'pos.posTerminals': 'POS Terminals',
  'pos.terminalsDescription': 'Configure the point of sale terminals.',
  'pos.newTerminal': 'New Terminal',
  'pos.newTerminalTitle': 'New POS Terminal',
  'pos.terminalName': 'Name',
  'pos.company': 'Company',
  'pos.selectCompany': 'Select company',
  'pos.defaultCustomerLabel': 'Default customer (optional)',
  'pos.autoInvoice': 'Auto-generate invoice',
  'pos.autoPrintReceipt': 'Auto-print receipt',
  'pos.printerName': 'Printer name',
  'pos.printMethod': 'Print Method',
  'pos.printMethodCol': 'Print Method',
  'pos.browserPrint': 'Browser (window.print)',
  'pos.autoPrintCol': 'Auto Print',
  'pos.createTerminal': 'Create Terminal',
  'pos.yes': 'Yes',
  'pos.no': 'No',
  'pos.autoInvoiceCol': 'Auto Invoice',

  // Shift management
  'pos.openShift': 'Open Shift',
  'pos.closeShift': 'Close Shift',
  'pos.openingCash': 'Opening cash amount',
  'pos.closingCash': 'Closing cash amount (counted)',
  'pos.expectedCash': 'Expected cash',
  'pos.cashDifference': 'Difference',
  'pos.shiftNotes': 'Notes (optional)',
  'pos.shiftOpened': 'Shift opened successfully',
  'pos.shiftClosed': 'Shift closed successfully',
  'pos.noOpenSession': 'No open shift',
  'pos.mustOpenShift': 'You must open a shift before processing sales.',
  'pos.currentShift': 'Current Shift',
  'pos.shiftOpenedAt': 'Opened at',

  // Cash movements
  'pos.cashMovement': 'Cash Movement',
  'pos.withdrawal': 'Withdrawal',
  'pos.deposit': 'Deposit',
  'pos.movementAmount': 'Amount',
  'pos.movementNotes': 'Notes (optional)',
  'pos.registerMovement': 'Register Movement',
  'pos.movementRegistered': 'Movement registered successfully',

  // Z Report
  'pos.zReport': 'Z Report',
  'pos.zReportTitle': 'Z Report - Shift Summary',
  'pos.totalSales': 'Total Sales',
  'pos.totalCashSales': 'Cash Sales',
  'pos.totalCardSales': 'Card Sales',
  'pos.totalCheckSales': 'Check Sales',
  'pos.totalRefunds': 'Total Refunds',
  'pos.totalWithdrawals': 'Total Withdrawals',
  'pos.totalDeposits': 'Total Deposits',
  'pos.totalTax': 'Total Tax',
  'pos.orderCount': 'Order Count',
  'pos.firstOrder': 'First Order',
  'pos.lastOrder': 'Last Order',
  'pos.printReport': 'Print Report',

  // Cashier settings
  'pos.cashiers': 'Cashiers',
  'pos.cashiersDescription': 'Manage POS cashiers.',
  'pos.newCashier': 'New Cashier',
  'pos.newCashierTitle': 'New Cashier',
  'pos.cashierName': 'Name',
  'pos.linkedUser': 'Linked User',
  'pos.selectUser': 'Select user (optional)',
  'pos.pinOptional': 'PIN (optional)',
  'pos.createCashier': 'Create Cashier',
  'pos.editCashier': 'Edit Cashier',
  'pos.noCashier': 'No cashier profile found',
  'pos.noCashierDescription':
    'You need a cashier profile to use POS. Contact your administrator.',

  // Create customer from terminal
  'pos.createCustomerTitle': 'New Customer',
  'pos.customerName': 'Name',
  'pos.customerNit': 'NIT',
  'pos.customerCreated': 'Customer created successfully',

  // Accounting integration
  'pos.journalEntry': 'Journal Entry',
  'pos.viewJournalEntry': 'View Journal Entry',
  'pos.journalEntryCreated': 'Journal entry created',
  'pos.noJournalEntry': 'No journal entry (accounts not configured)',

  // Errors
  'pos.noCustomerSelected':
    'No customer selected and no default customer configured for this terminal.',
  'pos.errorProcessing': 'Error processing sale',
  'pos.errorVoiding': 'Error voiding sale',
} as const
