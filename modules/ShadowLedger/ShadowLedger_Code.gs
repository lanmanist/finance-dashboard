/**
 * ShadowLedger - Google Apps Script
 * Version: 2.5.0
 * Date: 2026-01-15
 * 
 * v2.5.0 Changes:
 * - NEW: !income soldrsu h/w - Log actual RSU sale proceeds
 * - NEW: !income soldownsap h/w - Log actual OWNSAP sale proceeds
 * - Sold stock logs to CURRENT month (not previous like salary)
 * - Append mode: multiple sales per month allowed
 * - !income status shows sold stock as optional fields
 * 
 * v2.4.2 Changes:
 * - FIX: Bare "k" (200k cafe) now detected as VND
 * - FIX: VND amounts use comma decimal (1,63€) to avoid date regex collision
 * 
 * v2.4.1 Changes:
 * - FIX: VND amounts like 1.85€ no longer confused with dates
 * - FIX: Gemini date parsing validated to prevent 1970 epoch bug
 * - ADD: One-time budget population script for new category
 * 
 * v2.4.0 Changes:
 * - NEW: Budget category "Fees, Interest, Bureaucracy, Documents"
 * - NEW: VND currency support (200kVND, 200000VND, 200k)
 * - VND auto-converts to EUR via GOOGLEFINANCE
 * - Original VND amount stored in columns P, Q, R
 * 
 * v2.3.1 Changes:
 * 
 * v2.3.0 Changes:
 * - Fixed UTF-8 encoding for all emojis
 * - All Discord messages now display properly
 * 
 * Features v2.2 (Investment Tracking):
 * 14. !invest command for logging transfers to investment accounts
 * 15. !invest status command to see month's investment transfers
 * 16. SL_Investment_Log sheet with destination tracking
 * 
 * Features v2.1 (Income Tracking):
 * 10. !income command for salary, youtube, other income
 * 11. !ta command for Time Account hours
 * 12. !income status command to check monthly input completion
 * 13. Automated monthly reminder (Day 1, 6, 11, 16, 21, 26)
 * 
 * Features v2:
 * 1. Extended spender aliases (h/w/husband/wife/nha/anh/aaron/trang/chang/em)
 * 2. Multi-transaction per message (one line = one transaction)
 * 3. Enhanced !status with percentages
 * 4. !ytd command (year-to-date)
 * 5. Smart flexible input parsing (Gemini-powered)
 * 6. Enhanced date parsing (yesterday, DD.MM, march 6, etc.)
 * 7. Gemini AI categorization fallback
 * 8. !budgetleft command
 * 9. !undo command with confirmation
 */

// ============ CONFIGURATION ============
const CONFIG = {
  SPREADSHEET_ID: '1mrMCTbgPxjxbkHepDiQk_ddN0cbJ-A-GWWtwt3wOgSU',
  SHEETS: {
    LEDGER: 'ShadowLedger',
    BUDGET: 'SL_Budget',
    PATTERNS: 'SL_Patterns',
    CONFIG: 'SL_Config',
    INCOME_LOG: 'SL_Income_Log',
    INVESTMENT_LOG: 'SL_Investment_Log'
  },
  TIMEZONE: 'Europe/Berlin',
  CATEGORIES: [
    'Childcare',
    'Family Support',
    'Groceries + Food',
    'Utilities',
    'Car',
    'Shopping',
    'Travel & Leisure',
    'Insurance',
    'Eat Out & Food delivery',
    'Gifts',
    'Entertainment',
    'Health & beauty',
    'Home improvement',
    'Business & Subscription',
    'Donation',
    'Special IO',
    'Fees, Interest, Bureaucracy, Documents',
    'Buffer'
  ],
  INCOME_TYPES: {
    'salary': { column: 'net_salary', requiresSpender: true, label: 'Net Salary' },
    'youtube': { column: 'yt_gross', requiresSpender: false, label: 'YouTube Gross' },
    'other': { column: 'other_fam_net_inc', requiresSpender: false, label: 'Other Income' }
  },
  // Sold stock income types (log to CURRENT month, append mode)
  SOLD_STOCK_TYPES: {
    'soldrsu': { label: 'Sold RSU', requiresSpender: true },
    'soldownsap': { label: 'Sold OWNSAP', requiresSpender: true }
  },
  REMINDER_DAYS: [1, 6, 11, 16, 21, 26],
  INVESTMENT_DESTINATIONS: ['scalable', 'revolut', 'comdirect', 'trade_republic', 'other']
};

// Extended spender aliases
const SPENDER_ALIASES = {
  'h': 'H', 'husband': 'H', 'nha': 'H', 'anh': 'H', 'aaron': 'H',
  'w': 'W', 'wife': 'W', 'trang': 'W', 'chang': 'W', 'em': 'W'
};

// ============ EMOJI CONSTANTS (UTF-8 Safe) ============
const EMOJI = {
  CHECK: '✅',
  CROSS: '❌',
  CLIPBOARD: '📋',
  MONEY: '💰',
  CHART: '📊',
  EURO: '€',
  ARROW: '→',
  LINE: '─',
  TIMER: '⏱️',
  CALENDAR: '📅',
  MEMO: '📝',
  BULLET: '•',
  GREEN: '🟢',
  RED: '🔴',
  ORANGE: '🟠',
  YELLOW: '🟡',
  DATE: '📆',
  PACKAGE: '📦',
  PERSON: '👤',
  WARNING: '⚠️',
  SPARKLE: '✨',
  PARTY: '🎉',
  MINUS: '➖',
  TRENDING: '📈',
  VND: '\u{1F1FB}\u{1F1F3}',
  STOCK: '📉'
};

// ============ VND CURRENCY SUPPORT ============

/**
 * Get VND exchange rate from SL_Config (populated by GOOGLEFINANCE formula)
 * Returns EUR per 1 VND (e.g., 0.0000365 means 1 VND = €0.0000365)
 */
function getVndRate() {
  const config = getConfigValues();
  const rate = config.vnd_rate;
  
  // vnd_rate from GOOGLEFINANCE is EUR:VND (e.g., 27397 means 1 EUR = 27397 VND)
  // We need VND:EUR, so we invert it
  if (rate && !isNaN(rate) && rate > 0) {
    return 1 / rate;
  }
  
  // Fallback rate if GOOGLEFINANCE fails completely
  Logger.log('VND rate not available, using fallback');
  return 1 / 27000; // ~0.000037
}

/**
 * Detect and convert VND amounts in input
 * Patterns: 200000VND, 200.000VND, 200,000VND, 200kVND, 200k VND, 200k (alone)
 * Returns: { eurAmount, originalAmount, originalCurrency, exchangeRate, cleanedInput }
 */
function detectAndConvertVnd(input) {
  // Pattern 1: Number with k suffix followed by VND (200kVND, 200k VND)
  // Pattern 2: Number followed by VND (200000VND, 200.000VND, 200,000VND)
  // Pattern 3: Number with k suffix alone (200k) - interpreted as VND
  
  let vndAmount = null;
  let matchedPattern = null;
  
  // Check for explicit VND patterns first
  // Matches: 200000VND, 200.000VND, 200,000VND, 200kVND, 200k VND
  const vndExplicitMatch = input.match(/(\d+(?:[.,]\d{3})*(?:[.,]\d+)?)\s*k?\s*VND/i);
  if (vndExplicitMatch) {
    let numStr = vndExplicitMatch[1];
    // Check if 'k' is present before VND
    const hasK = /k\s*VND/i.test(vndExplicitMatch[0]);
    
    // Remove thousand separators (dots or commas followed by 3 digits)
    // But preserve decimal comma/dot
    numStr = numStr.replace(/[.,](?=\d{3}(?:[.,]|$|\s|VND))/g, '');
    // Convert decimal comma to dot
    numStr = numStr.replace(',', '.');
    
    vndAmount = parseFloat(numStr);
    if (hasK) {
      vndAmount *= 1000;
    }
    matchedPattern = vndExplicitMatch[0];
  }
  
  // Check for bare 'k' suffix (200k alone = 200,000 VND)
  if (!vndAmount) {
    const kAloneMatch = input.match(/(\d+(?:[.,]\d+)?)\s*k(?!\s*vnd)/i);
    if (kAloneMatch) {
      let numStr = kAloneMatch[1].replace(',', '.');
      vndAmount = parseFloat(numStr) * 1000;
      matchedPattern = kAloneMatch[0];
    }
  }
  
  // If no VND detected, return null (normal EUR processing)
  if (!vndAmount || isNaN(vndAmount)) {
    return null;
  }
  
  // Convert VND to EUR
  const rate = getVndRate();
  const eurAmount = Math.round(vndAmount * rate * 100) / 100;
  
  // Clean the input by removing the VND pattern and replacing with EUR amount
  // IMPORTANT: Add € symbol to prevent amount being confused with date pattern (e.g., 1.85 looking like Jan 85)
  const cleanedInput = input.replace(matchedPattern, eurAmount.toFixed(2).replace('.', ',') + '€').trim();
  
  return {
    eurAmount: eurAmount,
    originalAmount: vndAmount,
    originalCurrency: 'VND',
    exchangeRate: rate,
    cleanedInput: cleanedInput
  };
}

// ============ MAIN ENTRY POINT ============

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = processDiscordMessage(data);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter ? e.parameter.action : null;
  
  if (action === 'dashboard') {
    return getDashboardData();
  }
  
  if (action === 'expenses') {
    const month = e.parameter.month;
    if (!month) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing required parameter: month (format: YYYY-MM)'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return getExpenseBreakdown(month);
  }
  
  if (action === 'test') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'ShadowLedger API v2.5.0 is running',
      timestamp: new Date().toISOString(),
      endpoints: [
        '?action=dashboard - Financial data for Sankey',
        '?action=expenses&month=YYYY-MM - Expense breakdown',
        '?action=test - This health check'
      ],
      features: ['expenses', 'income', 'ta_hours', 'investments', 'sold_stock', 'reminders']
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'ShadowLedger API v2.5.0',
    hint: 'Use ?action=dashboard, ?action=expenses&month=YYYY-MM, or ?action=test'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============ MESSAGE PROCESSING ============

function processDiscordMessage(data) {
  const message = data.content.trim();
  const username = data.username || 'unknown';
  
  if (message.startsWith('!')) {
    return handleCommand(message, username);
  }
  
  const lines = message.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 1) {
    return logExpense(lines[0], username);
  }
  
  return logMultipleExpenses(lines, username);
}

function logMultipleExpenses(lines, username) {
  const results = [];
  let successCount = 0;
  let failCount = 0;
  let totalAmount = 0;
  const categorySpending = {};
  
  for (const line of lines) {
    try {
      const result = logExpenseSilent(line, username);
      if (result.success) {
        successCount++;
        totalAmount += result.amount;
        results.push(`${EMOJI.CHECK} ${EMOJI.EURO}${result.amount.toFixed(2)} ${EMOJI.ARROW} ${result.category}`);
        if (!categorySpending[result.category]) {
          categorySpending[result.category] = 0;
        }
        categorySpending[result.category] += result.amount;
      } else {
        failCount++;
        results.push(`${EMOJI.CROSS} "${line.substring(0, 20)}..." - ${result.error}`);
      }
    } catch (e) {
      failCount++;
      results.push(`${EMOJI.CROSS} "${line.substring(0, 20)}..." - Error`);
    }
  }
  
  const monthKey = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM');
  let budgetLines = [];
  for (const cat of Object.keys(categorySpending)) {
    const status = calculateBudgetStatus(cat, monthKey);
    budgetLines.push(`${status.status} ${cat}: ${EMOJI.EURO}${status.spent.toFixed(0)}/${EMOJI.EURO}${status.budget} (${(status.percent * 100).toFixed(0)}%)`);
  }
  
  let response = `${EMOJI.CLIPBOARD} **BATCH LOGGED** (${successCount}/${lines.length})
${EMOJI.LINE.repeat(25)}
${results.join('\n')}
${EMOJI.LINE.repeat(25)}
**Total:** ${EMOJI.EURO}${totalAmount.toFixed(2)}`;

  if (budgetLines.length > 0) {
    response += `\n\n${EMOJI.CHART} **Budget Status:**\n${budgetLines.join('\n')}`;
  }
  
  sendDiscordMessage(response);
  return { success: true, logged: successCount, failed: failCount };
}

function handleCommand(message, username) {
  const parts = message.toLowerCase().split(' ');
  const cmd = parts[0];
  
  if (cmd === '!help') {
    const helpText = `**ShadowLedger v2.5 Commands**

${EMOJI.MEMO} **Expense Logging (flexible format):**
Any order works! Examples:
${EMOJI.BULLET} 45 rewe
${EMOJI.BULLET} rewe 45€ wife yesterday
${EMOJI.BULLET} 27 lidl 01.03 husband

${EMOJI.PACKAGE} **Multi-line batch:**
Use Shift+Enter for line breaks

${EMOJI.PERSON} **Spender names:**
H: h, husband, nha, anh, aaron
W: w, wife, trang, chang, em

${EMOJI.DATE} **Dates:**
yesterday, today, tomorrow
06.03, 6/3, march 6

${EMOJI.CLIPBOARD} **Expense Commands:**
!status - Monthly budget table
!budgetleft - Remaining budget
!ytd - Year to date table
!today - Today's expenses
!week - This week's expenses
!undo - Delete last transaction

${EMOJI.MONEY} **Income Commands:**
!income 4200 salary h - Log H net salary
!income 3800 salary w - Log W net salary
!income 1200 youtube - Log YT gross
!income 50 other payback - Log other income
!income status - Check what's missing

${EMOJI.STOCK} **Sold Stock (logs to CURRENT month):**
!income 5200 soldrsu h - H's RSU sale
!income 2500 soldrsu w - W's RSU sale
!income 847 soldownsap h - H's OWNSAP sale
!income 650 soldownsap w - W's OWNSAP sale

${EMOJI.TIMER} **Time Account:**
!ta 45 h - Log H hours added
!ta 38 w - Log W hours added

${EMOJI.TRENDING} **Investment Commands:**
!invest 500 scalable - Log transfer
!invest 1000 revolut ETF purchase
!invest status - This month's transfers

!help - Show this message`;
    sendDiscordMessage(helpText);
    return { success: true };
  }
  
  if (cmd === '!status') {
    return getBudgetStatus();
  }
  
  if (cmd === '!budgetleft') {
    return getBudgetLeft();
  }
  
  if (cmd === '!ytd') {
    return getYTDStatus();
  }
  
  if (cmd === '!today') {
    return getTodayTransactions();
  }
  
  if (cmd === '!week') {
    return getWeekTransactions();
  }
  
  if (cmd === '!undo') {
    if (parts.length > 1 && parts[1] === 'confirm') {
      return executeUndo(username);
    }
    return handleUndo(username);
  }
  
  if (cmd === '!income') {
    if (parts.length >= 2 && parts[1] === 'status') {
      return getIncomeStatus();
    }
    return handleIncomeCommand(message, username);
  }
  
  if (cmd === '!ta') {
    return handleTACommand(message, username);
  }
  
  if (cmd === '!invest') {
    if (parts.length >= 2 && parts[1] === 'status') {
      return getInvestmentStatus();
    }
    return handleInvestCommand(message, username);
  }
  
  sendDiscordMessage(`${EMOJI.CROSS} Unknown command. Type !help for available commands.`);
  return { success: false, error: 'Unknown command' };
}

// ============ INVESTMENT LOGGING ============

function handleInvestCommand(message, username) {
  const parts = message.trim().split(/\s+/);
  
  if (parts.length < 3) {
    sendDiscordMessage(`${EMOJI.CROSS} **Format:** !invest [amount] [destination] [notes]

**Destinations:** scalable, revolut, comdirect, trade_republic, other
**Examples:**
${EMOJI.BULLET} !invest 500 scalable
${EMOJI.BULLET} !invest 1000 revolut ETF purchase
${EMOJI.BULLET} !invest 2000 comdirect monthly DCA`);
    return { success: false, error: 'Invalid format' };
  }
  
  let amount = null;
  let amountIndex = -1;
  for (let i = 1; i < parts.length; i++) {
    const num = parseFloat(parts[i].replace('€', '').replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      amount = num;
      amountIndex = i;
      break;
    }
  }
  
  if (!amount) {
    sendDiscordMessage(`${EMOJI.CROSS} Could not parse amount. Use: !invest 500 scalable`);
    return { success: false, error: 'No amount found' };
  }
  
  let destination = null;
  let destIndex = -1;
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].toLowerCase();
    for (const dest of CONFIG.INVESTMENT_DESTINATIONS) {
      if (part === dest || part.startsWith(dest.substring(0, 4))) {
        destination = dest;
        destIndex = i;
        break;
      }
    }
    if (destination) break;
  }
  
  if (!destination) {
    sendDiscordMessage(`${EMOJI.CROSS} Unknown destination. Use: scalable, revolut, comdirect, trade_republic, or other`);
    return { success: false, error: 'Unknown destination' };
  }
  
  const usedIndices = new Set([0, amountIndex, destIndex]);
  const notesParts = parts.filter((_, i) => !usedIndices.has(i));
  const notes = notesParts.join(' ');
  
  const now = new Date();
  const monthKey = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const result = logInvestmentEntry(amount, destination, notes, monthKey, username);
  
  if (result.success) {
    const monthTotal = getInvestmentMonthTotal(monthKey);
    
    sendDiscordMessage(`${EMOJI.CHECK} **Investment Logged**
${EMOJI.LINE.repeat(25)}
${EMOJI.TRENDING} ${EMOJI.EURO}${amount.toFixed(2)} ${EMOJI.ARROW} ${capitalizeFirst(destination)}
${EMOJI.CALENDAR} Month: ${monthKey}
${EMOJI.MEMO} ${notes || '(no notes)'}
${EMOJI.LINE.repeat(25)}
**${monthKey} Total Invested:** ${EMOJI.EURO}${monthTotal.toFixed(2)}`);
  }
  
  return result;
}

function logInvestmentEntry(amount, destination, notes, monthKey, inputter) {
  try {
    const sheet = getOrCreateInvestmentSheet();
    const now = new Date();
    const timestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
    const dateStr = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd");
    const entryId = `INV-${Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss')}`;
    
    sheet.appendRow([entryId, dateStr, monthKey, amount, destination, notes, timestamp, inputter]);
    
    return { success: true };
  } catch (e) {
    sendDiscordMessage(`${EMOJI.CROSS} Error logging investment: ` + e.toString());
    return { success: false, error: e.toString() };
  }
}

function getInvestmentStatus(monthKeyOverride) {
  const now = new Date();
  const monthKey = monthKeyOverride || Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const sheet = getOrCreateInvestmentSheet();
  const data = sheet.getDataRange().getValues();
  
  const byDestination = {};
  let totalAmount = 0;
  let transferCount = 0;
  const transfers = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === monthKey) {
      const date = data[i][1];
      const amount = data[i][3];
      const destination = data[i][4];
      const notes = data[i][5];
      
      if (!byDestination[destination]) {
        byDestination[destination] = 0;
      }
      byDestination[destination] += amount;
      totalAmount += amount;
      transferCount++;
      
      const dateDisplay = typeof date === 'string' ? date.substring(5) : Utilities.formatDate(new Date(date), CONFIG.TIMEZONE, 'MM-dd');
      transfers.push({ date: dateDisplay, amount, destination, notes });
    }
  }
  
  let response = `${EMOJI.TRENDING} **Investment Status for ${monthKey}**
${EMOJI.LINE.repeat(32)}

`;

  if (transferCount === 0) {
    response += `No investments logged this month yet.

**Log a transfer:**
${EMOJI.BULLET} !invest 500 scalable
${EMOJI.BULLET} !invest 1000 revolut ETF purchase`;
  } else {
    response += `**By Destination:**\n`;
    for (const [dest, amt] of Object.entries(byDestination).sort((a, b) => b[1] - a[1])) {
      response += `${EMOJI.BULLET} ${capitalizeFirst(dest)}: ${EMOJI.EURO}${amt.toFixed(2)}\n`;
    }
    
    response += `\n**Recent Transfers:**\n`;
    const recentTransfers = transfers.slice(-5).reverse();
    for (const t of recentTransfers) {
      const notesStr = t.notes ? ` - ${t.notes.substring(0, 20)}` : '';
      response += `${EMOJI.BULLET} ${t.date}: ${EMOJI.EURO}${t.amount.toFixed(2)} ${EMOJI.ARROW} ${capitalizeFirst(t.destination)}${notesStr}\n`;
    }
    
    response += `
${EMOJI.LINE.repeat(32)}
**Total:** ${EMOJI.EURO}${totalAmount.toFixed(2)} (${transferCount} transfers)`;
  }
  
  sendDiscordMessage(response);
  return { success: true, total: totalAmount, count: transferCount };
}

function getInvestmentMonthTotal(monthKey) {
  const sheet = getOrCreateInvestmentSheet();
  const data = sheet.getDataRange().getValues();
  
  let total = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === monthKey) {
      total += data[i][3] || 0;
    }
  }
  
  return total;
}

function getOrCreateInvestmentSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEETS.INVESTMENT_LOG);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.INVESTMENT_LOG);
    sheet.appendRow(['ID', 'Date', 'MonthKey', 'Amount', 'Destination', 'Notes', 'Timestamp', 'InputBy']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    sheet.setFrozenRows(1);
    Logger.log('Created SL_Investment_Log sheet');
  }
  
  return sheet;
}

function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
}

// ============ INCOME LOGGING ============

function handleIncomeCommand(message, username) {
  const parts = message.trim().split(/\s+/);
  
  if (parts.length < 3) {
    sendDiscordMessage(`${EMOJI.CROSS} **Format:** !income [amount] [type] [h/w] [description]

**Types:** salary, youtube, other, soldrsu, soldownsap
**Examples:**
${EMOJI.BULLET} !income 4200 salary h
${EMOJI.BULLET} !income 3800 salary w
${EMOJI.BULLET} !income 1200 youtube
${EMOJI.BULLET} !income 50 other payback cashout
${EMOJI.BULLET} !income 5200 soldrsu h
${EMOJI.BULLET} !income 847 soldownsap w`);
    return { success: false, error: 'Invalid format' };
  }
  
  // Parse amount
  let amount = null;
  let amountIndex = -1;
  for (let i = 1; i < parts.length; i++) {
    const num = parseFloat(parts[i].replace('€', '').replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      amount = num;
      amountIndex = i;
      break;
    }
  }
  
  if (!amount) {
    sendDiscordMessage(`${EMOJI.CROSS} Could not parse amount. Use: !income 4200 salary h`);
    return { success: false, error: 'No amount found' };
  }
  
  // Check for sold stock types first (they have different behavior)
  let soldStockType = null;
  let typeIndex = -1;
  for (let i = 1; i < parts.length; i++) {
    const partLower = parts[i].toLowerCase();
    if (CONFIG.SOLD_STOCK_TYPES[partLower]) {
      soldStockType = partLower;
      typeIndex = i;
      break;
    }
  }
  
  // If sold stock type found, handle separately
  if (soldStockType) {
    return handleSoldStockCommand(parts, amount, amountIndex, soldStockType, typeIndex, username);
  }
  
  // Standard income type handling
  let incomeType = null;
  for (let i = 1; i < parts.length; i++) {
    if (CONFIG.INCOME_TYPES[parts[i]]) {
      incomeType = parts[i];
      typeIndex = i;
      break;
    }
  }
  
  if (!incomeType) {
    sendDiscordMessage(`${EMOJI.CROSS} Unknown income type. Use: salary, youtube, other, soldrsu, or soldownsap`);
    return { success: false, error: 'Unknown type' };
  }
  
  const typeConfig = CONFIG.INCOME_TYPES[incomeType];
  
  let spender = null;
  if (typeConfig.requiresSpender) {
    for (let i = 1; i < parts.length; i++) {
      if (i !== amountIndex && i !== typeIndex) {
        const alias = parts[i].toLowerCase();
        if (SPENDER_ALIASES[alias]) {
          spender = SPENDER_ALIASES[alias];
          break;
        }
      }
    }
    if (!spender) {
      sendDiscordMessage(`${EMOJI.CROSS} Salary requires spender (h/w). Use: !income ${amount} salary h`);
      return { success: false, error: 'Missing spender' };
    }
  }
  
  let description = '';
  const usedIndices = new Set([0, amountIndex, typeIndex]);
  if (spender) {
    for (let i = 1; i < parts.length; i++) {
      if (SPENDER_ALIASES[parts[i].toLowerCase()]) {
        usedIndices.add(i);
        break;
      }
    }
  }
  const descParts = parts.filter((_, i) => !usedIndices.has(i));
  description = descParts.join(' ');
  
  // Standard income logs to PREVIOUS month
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthKey = Utilities.formatDate(targetMonth, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const result = logIncomeEntry(incomeType, amount, spender, description, monthKey, username);
  
  if (result.success) {
    const spenderStr = spender ? ` (${spender})` : '';
    const updateStr = result.updated ? ' *(updated)*' : '';
    sendDiscordMessage(`${EMOJI.CHECK} **Income Logged**${updateStr}
${EMOJI.LINE.repeat(25)}
${EMOJI.MONEY} ${EMOJI.EURO}${amount.toFixed(2)} ${EMOJI.ARROW} ${typeConfig.label}${spenderStr}
${EMOJI.CALENDAR} For: ${monthKey}
${EMOJI.MEMO} ${description || '(no description)'}
${EMOJI.LINE.repeat(25)}
Use **!income status** to see what's still missing`);
  }
  
  return result;
}

/**
 * Handle sold stock commands (soldrsu, soldownsap)
 * These log to CURRENT month and use APPEND mode (multiple entries allowed)
 */
function handleSoldStockCommand(parts, amount, amountIndex, stockType, typeIndex, username) {
  const typeConfig = CONFIG.SOLD_STOCK_TYPES[stockType];
  
  // Find spender (REQUIRED for both soldrsu and soldownsap)
  let spender = null;
  let spenderIndex = -1;
  for (let i = 1; i < parts.length; i++) {
    if (i !== amountIndex && i !== typeIndex) {
      const alias = parts[i].toLowerCase();
      if (SPENDER_ALIASES[alias]) {
        spender = SPENDER_ALIASES[alias];
        spenderIndex = i;
        break;
      }
    }
  }
  
  if (!spender) {
    sendDiscordMessage(`${EMOJI.CROSS} ${typeConfig.label} requires spender (h/w). Use: !income ${amount} ${stockType} h`);
    return { success: false, error: 'Missing spender' };
  }
  
  // Extract notes (remaining parts)
  const usedIndices = new Set([0, amountIndex, typeIndex, spenderIndex]);
  const notesParts = parts.filter((_, i) => !usedIndices.has(i));
  const notes = notesParts.join(' ');
  
  // Sold stock logs to CURRENT month (not previous)
  const now = new Date();
  const monthKey = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const result = logSoldStockEntry(stockType, amount, spender, notes, monthKey, username);
  
  if (result.success) {
    // Get month totals for this type+spender
    const monthTotals = getSoldStockMonthTotals(monthKey, stockType, spender);
    
    sendDiscordMessage(`${EMOJI.CHECK} **${typeConfig.label} Logged**
${EMOJI.LINE.repeat(25)}
${EMOJI.STOCK} ${EMOJI.EURO}${amount.toFixed(2)} ${EMOJI.ARROW} ${typeConfig.label} (${spender})
${EMOJI.CALENDAR} Month: ${monthKey}
${EMOJI.MEMO} ${notes || '(no notes)'}
${EMOJI.LINE.repeat(25)}
**${monthKey} ${typeConfig.label} (${spender}):** ${EMOJI.EURO}${monthTotals.toFixed(2)} (${result.count} sale${result.count > 1 ? 's' : ''})`);
  }
  
  return result;
}

/**
 * Log sold stock entry (APPEND mode - multiple entries per month allowed)
 */
function logSoldStockEntry(type, amount, spender, notes, monthKey, inputter) {
  try {
    const sheet = getOrCreateIncomeSheet();
    const now = new Date();
    const timestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
    const entryId = `SOLD-${Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss')}`;
    
    // Always append (no update-in-place for sold stock)
    sheet.appendRow([entryId, monthKey, type, amount, spender, notes, timestamp, inputter]);
    
    // Count entries for this type+spender+month
    const data = sheet.getDataRange().getValues();
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === monthKey && data[i][2] === type && data[i][4] === spender) {
        count++;
      }
    }
    
    return { success: true, updated: false, count: count };
  } catch (e) {
    sendDiscordMessage(`${EMOJI.CROSS} Error logging sold stock: ` + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Get total sold stock amount for a month/type/spender
 */
function getSoldStockMonthTotals(monthKey, type, spender) {
  const sheet = getOrCreateIncomeSheet();
  const data = sheet.getDataRange().getValues();
  
  let total = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === monthKey && data[i][2] === type && data[i][4] === spender) {
      total += data[i][3] || 0;
    }
  }
  
  return total;
}

function logIncomeEntry(type, amount, spender, description, monthKey, inputter) {
  try {
    const sheet = getOrCreateIncomeSheet();
    const now = new Date();
    const timestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
    const entryId = `INC-${Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss')}`;
    
    const data = sheet.getDataRange().getValues();
    let existingRow = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === monthKey && data[i][2] === type && data[i][4] === (spender || '')) {
        existingRow = i + 1;
        break;
      }
    }
    
    if (existingRow) {
      sheet.getRange(existingRow, 4).setValue(amount);
      sheet.getRange(existingRow, 6).setValue(description);
      sheet.getRange(existingRow, 7).setValue(timestamp);
      sheet.getRange(existingRow, 8).setValue(inputter);
      return { success: true, updated: true };
    } else {
      sheet.appendRow([entryId, monthKey, type, amount, spender || '', description, timestamp, inputter]);
      return { success: true, updated: false };
    }
  } catch (e) {
    sendDiscordMessage(`${EMOJI.CROSS} Error logging income: ` + e.toString());
    return { success: false, error: e.toString() };
  }
}

// ============ TIME ACCOUNT LOGGING ============

function handleTACommand(message, username) {
  const parts = message.trim().split(/\s+/);
  
  if (parts.length < 3) {
    sendDiscordMessage(`${EMOJI.CROSS} **Format:** !ta [hours] [h/w]

**Examples:**
${EMOJI.BULLET} !ta 45 h - Husband added 45 hours
${EMOJI.BULLET} !ta 38 w - Wife added 38 hours`);
    return { success: false, error: 'Invalid format' };
  }
  
  let hours = null;
  for (let i = 1; i < parts.length; i++) {
    const num = parseFloat(parts[i].replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      hours = num;
      break;
    }
  }
  
  if (hours === null) {
    sendDiscordMessage(`${EMOJI.CROSS} Could not parse hours. Use: !ta 45 h`);
    return { success: false, error: 'No hours found' };
  }
  
  let spender = null;
  for (let i = 1; i < parts.length; i++) {
    const alias = parts[i].toLowerCase();
    if (alias === 'h' || alias === 'w' || SPENDER_ALIASES[alias]) {
      spender = SPENDER_ALIASES[alias] || alias.toUpperCase();
      break;
    }
  }
  
  if (!spender) {
    sendDiscordMessage(`${EMOJI.CROSS} Please specify h or w. Use: !ta 45 h`);
    return { success: false, error: 'Missing spender' };
  }
  
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthKey = Utilities.formatDate(targetMonth, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const taType = spender === 'H' ? 'ta_h' : 'ta_w';
  const result = logTAEntry(taType, hours, spender, monthKey, username);
  
  if (result.success) {
    const label = spender === 'H' ? 'Husband' : 'Wife';
    const updateStr = result.updated ? ' *(updated)*' : '';
    sendDiscordMessage(`${EMOJI.CHECK} **Time Account Logged**${updateStr}
${EMOJI.LINE.repeat(25)}
${EMOJI.TIMER} ${hours} hours ${EMOJI.ARROW} ${label}
${EMOJI.CALENDAR} For: ${monthKey}
${EMOJI.LINE.repeat(25)}
Use **!income status** to see what's still missing`);
  }
  
  return result;
}

function logTAEntry(type, hours, spender, monthKey, inputter) {
  try {
    const sheet = getOrCreateIncomeSheet();
    const now = new Date();
    const timestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
    const entryId = `TA-${Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss')}`;
    
    const data = sheet.getDataRange().getValues();
    let existingRow = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === monthKey && data[i][2] === type) {
        existingRow = i + 1;
        break;
      }
    }
    
    if (existingRow) {
      sheet.getRange(existingRow, 4).setValue(hours);
      sheet.getRange(existingRow, 7).setValue(timestamp);
      sheet.getRange(existingRow, 8).setValue(inputter);
      return { success: true, updated: true };
    } else {
      sheet.appendRow([entryId, monthKey, type, hours, spender, '', timestamp, inputter]);
      return { success: true, updated: false };
    }
  } catch (e) {
    sendDiscordMessage(`${EMOJI.CROSS} Error logging TA hours: ` + e.toString());
    return { success: false, error: e.toString() };
  }
}

// ============ INCOME STATUS CHECK ============

function getIncomeStatus(monthKeyOverride) {
  const now = new Date();
  // For required income: use PREVIOUS month
  const prevMonth = monthKeyOverride || Utilities.formatDate(
    new Date(now.getFullYear(), now.getMonth() - 1, 1), 
    CONFIG.TIMEZONE, 
    'yyyy-MM'
  );
  // For sold stock: use CURRENT month
  const currentMonth = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const sheet = getOrCreateIncomeSheet();
  const data = sheet.getDataRange().getValues();
  
  // Required fields (previous month)
  const entered = {
    'salary_h': false,
    'salary_w': false,
    'youtube': false,
    'ta_h': false,
    'ta_w': false
  };
  
  const amounts = {};
  
  // Sold stock amounts (current month) - totals by type+spender
  const soldStock = {
    'soldrsu_h': 0,
    'soldrsu_w': 0,
    'soldownsap_h': 0,
    'soldownsap_w': 0
  };
  
  for (let i = 1; i < data.length; i++) {
    const rowMonth = data[i][1];
    const type = data[i][2];
    const amount = data[i][3];
    const spender = data[i][4];
    
    // Check required income (previous month)
    if (rowMonth === prevMonth) {
      if (type === 'salary' && spender === 'H') {
        entered['salary_h'] = true;
        amounts['salary_h'] = amount;
      } else if (type === 'salary' && spender === 'W') {
        entered['salary_w'] = true;
        amounts['salary_w'] = amount;
      } else if (type === 'youtube') {
        entered['youtube'] = true;
        amounts['youtube'] = amount;
      } else if (type === 'other') {
        amounts['other'] = (amounts['other'] || 0) + amount;
      } else if (type === 'ta_h') {
        entered['ta_h'] = true;
        amounts['ta_h'] = amount;
      } else if (type === 'ta_w') {
        entered['ta_w'] = true;
        amounts['ta_w'] = amount;
      }
    }
    
    // Check sold stock (current month)
    if (rowMonth === currentMonth) {
      if (type === 'soldrsu' && spender === 'H') {
        soldStock['soldrsu_h'] += amount || 0;
      } else if (type === 'soldrsu' && spender === 'W') {
        soldStock['soldrsu_w'] += amount || 0;
      } else if (type === 'soldownsap' && spender === 'H') {
        soldStock['soldownsap_h'] += amount || 0;
      } else if (type === 'soldownsap' && spender === 'W') {
        soldStock['soldownsap_w'] += amount || 0;
      }
    }
  }
  
  const allComplete = Object.values(entered).every(v => v);
  const statusEmoji = allComplete ? EMOJI.CHECK : EMOJI.CLIPBOARD;
  
  let response = `${statusEmoji} **Income Status for ${prevMonth}**
${EMOJI.LINE.repeat(32)}

**Required:**
`;
  
  response += entered['salary_h'] 
    ? `${EMOJI.CHECK} H Net Salary: ${EMOJI.EURO}${amounts['salary_h'].toFixed(2)}\n`
    : `${EMOJI.CROSS} H Net Salary: *missing*\n`;
    
  response += entered['salary_w']
    ? `${EMOJI.CHECK} W Net Salary: ${EMOJI.EURO}${amounts['salary_w'].toFixed(2)}\n`
    : `${EMOJI.CROSS} W Net Salary: *missing*\n`;
    
  response += entered['youtube']
    ? `${EMOJI.CHECK} YouTube Gross: ${EMOJI.EURO}${amounts['youtube'].toFixed(2)}\n`
    : `${EMOJI.CROSS} YouTube Gross: *missing*\n`;
    
  response += amounts['other']
    ? `${EMOJI.CHECK} Other Income: ${EMOJI.EURO}${amounts['other'].toFixed(2)}\n`
    : `${EMOJI.MINUS} Other Income: ${EMOJI.EURO}0 (assumed)\n`;
    
  response += entered['ta_h']
    ? `${EMOJI.CHECK} H TA Hours: ${amounts['ta_h']} hrs\n`
    : `${EMOJI.CROSS} H TA Hours: *missing*\n`;
    
  response += entered['ta_w']
    ? `${EMOJI.CHECK} W TA Hours: ${amounts['ta_w']} hrs\n`
    : `${EMOJI.CROSS} W TA Hours: *missing*\n`;

  // Sold stock section (current month, optional)
  response += `
**Sold Stock (${currentMonth}, optional):**
`;
  
  response += soldStock['soldrsu_h'] > 0
    ? `${EMOJI.CHECK} Sold RSU (H): ${EMOJI.EURO}${soldStock['soldrsu_h'].toFixed(2)}\n`
    : `${EMOJI.MINUS} Sold RSU (H): ${EMOJI.EURO}0\n`;
    
  response += soldStock['soldrsu_w'] > 0
    ? `${EMOJI.CHECK} Sold RSU (W): ${EMOJI.EURO}${soldStock['soldrsu_w'].toFixed(2)}\n`
    : `${EMOJI.MINUS} Sold RSU (W): ${EMOJI.EURO}0\n`;
    
  response += soldStock['soldownsap_h'] > 0
    ? `${EMOJI.CHECK} Sold OWNSAP (H): ${EMOJI.EURO}${soldStock['soldownsap_h'].toFixed(2)}\n`
    : `${EMOJI.MINUS} Sold OWNSAP (H): ${EMOJI.EURO}0\n`;
    
  response += soldStock['soldownsap_w'] > 0
    ? `${EMOJI.CHECK} Sold OWNSAP (W): ${EMOJI.EURO}${soldStock['soldownsap_w'].toFixed(2)}\n`
    : `${EMOJI.MINUS} Sold OWNSAP (W): ${EMOJI.EURO}0\n`;
  
  response += `
${EMOJI.LINE.repeat(32)}`;
  
  if (!allComplete) {
    response += `

**Commands:**
${EMOJI.BULLET} !income [amount] salary h/w
${EMOJI.BULLET} !income [amount] youtube
${EMOJI.BULLET} !income [amount] other [desc]
${EMOJI.BULLET} !ta [hours] h/w
${EMOJI.BULLET} !income [amount] soldrsu h/w
${EMOJI.BULLET} !income [amount] soldownsap h/w`;
  } else {
    response += `

${EMOJI.PARTY} All required inputs complete!`;
  }
  
  sendDiscordMessage(response);
  return { success: true, complete: allComplete, entered: entered, soldStock: soldStock };
}

// ============ MONTHLY REMINDER TRIGGER ============

function checkAndSendIncomeReminder() {
  const now = new Date();
  const dayOfMonth = now.getDate();
  
  if (!CONFIG.REMINDER_DAYS.includes(dayOfMonth)) {
    Logger.log('Not a reminder day, skipping');
    return;
  }
  
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthKey = Utilities.formatDate(targetMonth, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const sheet = getOrCreateIncomeSheet();
  const data = sheet.getDataRange().getValues();
  
  const entered = {
    'salary_h': false,
    'salary_w': false,
    'youtube': false,
    'ta_h': false,
    'ta_w': false
  };
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === monthKey) {
      const type = data[i][2];
      const spender = data[i][4];
      
      if (type === 'salary' && spender === 'H') entered['salary_h'] = true;
      else if (type === 'salary' && spender === 'W') entered['salary_w'] = true;
      else if (type === 'youtube') entered['youtube'] = true;
      else if (type === 'ta_h') entered['ta_h'] = true;
      else if (type === 'ta_w') entered['ta_w'] = true;
    }
  }
  
  const allComplete = Object.values(entered).every(v => v);
  
  if (allComplete) {
    Logger.log('All income inputs complete for ' + monthKey);
    return;
  }
  
  let missing = [];
  if (!entered['salary_h']) missing.push(`${EMOJI.CROSS} H Net Salary`);
  if (!entered['salary_w']) missing.push(`${EMOJI.CROSS} W Net Salary`);
  if (!entered['youtube']) missing.push(`${EMOJI.CROSS} YouTube Gross`);
  if (!entered['ta_h']) missing.push(`${EMOJI.CROSS} H TA Hours`);
  if (!entered['ta_w']) missing.push(`${EMOJI.CROSS} W TA Hours`);
  
  const reminder = `${EMOJI.CLIPBOARD} **MONTHLY INCOME UPDATE NEEDED**
${EMOJI.LINE.repeat(32)}

**${monthKey}** inputs still missing:

${missing.join('\n')}

${EMOJI.LINE.repeat(32)}
**Commands:**
${EMOJI.BULLET} !income [amount] salary h/w
${EMOJI.BULLET} !income [amount] youtube
${EMOJI.BULLET} !ta [hours] h/w

Use **!income status** for full details`;

  sendDiscordMessage(reminder);
  Logger.log('Sent income reminder for ' + monthKey);
}

// ============ HELPER: CREATE SHEETS IF NEEDED ============

function getOrCreateIncomeSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEETS.INCOME_LOG);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.INCOME_LOG);
    sheet.appendRow(['ID', 'MonthKey', 'Type', 'Amount', 'Spender', 'Description', 'Timestamp', 'InputBy']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    sheet.setFrozenRows(1);
    Logger.log('Created SL_Income_Log sheet');
  }
  
  return sheet;
}

// ============ EXPENSE LOGGING ============

function logExpense(message, username) {
  const parsed = parseExpenseInput(message);
  
  if (!parsed) {
    sendDiscordMessage(`${EMOJI.CROSS} **Error:** Could not parse expense.\n\n**Format:** amount merchant\n**Example:** 45 lidl`);
    return { success: false, error: 'Parse failed' };
  }
  
  const config = getConfigValues();
  const inputter = username === config.h_discord_username ? 'H' : 
                   username === config.w_discord_username ? 'W' : 'H';
  const spender = parsed.spender || inputter;
  
  let category = parsed.category;
  let categorization = 'user';
  
  if (!category) {
    category = categorizeExpense(parsed.merchant);
    categorization = 'ai';
  }
  
  const txnId = generateTxnId();
  const now = new Date();
  const nowFormatted = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  const txnDate = parsed.date || now;
  const txnDateFormatted = Utilities.formatDate(txnDate, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  const monthKey = Utilities.formatDate(txnDate, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const currencyInfo = parsed.currencyInfo || {};
  sheet.appendRow([
    txnId,
    nowFormatted,
    txnDateFormatted,
    parsed.amount,
    parsed.merchant,
    parsed.description || '',
    category,
    spender,
    inputter,
    'Discord',
    categorization,
    categorization === 'user',
    categorization === 'user' ? nowFormatted : '',
    message,
    "'" + monthKey,
    currencyInfo.originalAmount || '',
    currencyInfo.originalCurrency || '',
    currencyInfo.exchangeRate || ''
  ]);
  
  const props = PropertiesService.getScriptProperties();
  props.setProperty('last_txn_id', txnId);
  props.setProperty('last_txn_user', inputter);
  props.setProperty('last_txn_time', now.getTime().toString());
  
  const budgetStatus = calculateBudgetStatus(category, monthKey);
  const response = formatExpenseResponse(parsed, category, spender, categorization, budgetStatus);
  sendDiscordMessage(response);
  
  return {
    success: true,
    txn_id: txnId,
    category: category,
    amount: parsed.amount
  };
}

function logExpenseSilent(message, username) {
  const parsed = parseExpenseInput(message);
  
  if (!parsed) {
    return { success: false, error: 'Parse failed' };
  }
  
  const config = getConfigValues();
  const inputter = username === config.h_discord_username ? 'H' : 
                   username === config.w_discord_username ? 'W' : 'H';
  const spender = parsed.spender || inputter;
  
  let category = parsed.category;
  let categorization = 'user';
  
  if (!category) {
    category = categorizeExpense(parsed.merchant);
    categorization = 'ai';
  }
  
  const txnId = generateTxnId();
  const now = new Date();
  const nowFormatted = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  const txnDate = parsed.date || now;
  const txnDateFormatted = Utilities.formatDate(txnDate, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  const monthKey = Utilities.formatDate(txnDate, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const currencyInfo = parsed.currencyInfo || {};
  sheet.appendRow([
    txnId,
    nowFormatted,
    txnDateFormatted,
    parsed.amount,
    parsed.merchant,
    parsed.description || '',
    category,
    spender,
    inputter,
    'Discord',
    categorization,
    categorization === 'user',
    categorization === 'user' ? nowFormatted : '',
    message,
    "'" + monthKey,
    currencyInfo.originalAmount || '',
    currencyInfo.originalCurrency || '',
    currencyInfo.exchangeRate || ''
  ]);
  
  const props = PropertiesService.getScriptProperties();
  props.setProperty('last_txn_id', txnId);
  props.setProperty('last_txn_user', inputter);
  props.setProperty('last_txn_time', now.getTime().toString());
  
  return {
    success: true,
    txn_id: txnId,
    category: category,
    amount: parsed.amount
  };
}

// ============ INPUT PARSING ============

function parseExpenseInput(input) {
  input = input.trim();
  
  // Check for VND currency first
  const vndInfo = detectAndConvertVnd(input);
  let currencyInfo = null;
  
  if (vndInfo) {
    // Use cleaned input (with EUR amount) for further parsing
    input = vndInfo.cleanedInput;
    currencyInfo = {
      originalAmount: vndInfo.originalAmount,
      originalCurrency: vndInfo.originalCurrency,
      exchangeRate: vndInfo.exchangeRate
    };
  }
  
  const geminiResult = parseWithGemini(input);
  if (geminiResult && geminiResult.amount && geminiResult.merchant) {
    return {
      amount: vndInfo ? vndInfo.eurAmount : geminiResult.amount,
      merchant: geminiResult.merchant,
      category: geminiResult.category,
      spender: geminiResult.spender,
      date: geminiResult.date,
      description: geminiResult.description || '',
      currencyInfo: currencyInfo
    };
  }
  
  const regexResult = parseExpenseInputRegex(input);
  if (regexResult) {
    // Override amount if VND was detected
    if (vndInfo) {
      regexResult.amount = vndInfo.eurAmount;
    }
    regexResult.currencyInfo = currencyInfo;
  }
  return regexResult;
}

function parseExpenseInputRegex(input) {
  const datePatterns = [];
  let cleanInput = input.replace(/\d{1,2}[.\/]\d{1,2}([.\/]\d{2,4})?/g, (match) => {
    datePatterns.push(match);
    return `__DATE${datePatterns.length - 1}__`;
  });
  
  let amountMatch = cleanInput.match(/(\d+(?:[.,]\d+)?)\s*[€e](?![a-df-z])/i);
  if (!amountMatch) {
    amountMatch = cleanInput.match(/(?:^|\s)(\d+(?:[.,]\d+)?)/);
  }
  if (!amountMatch) return null;
  
  const amount = parseFloat(amountMatch[1].replace(',', '.'));
  
  const amountStr = amountMatch[1];
  input = input.replace(new RegExp('(^|\\s)' + amountStr.replace('.', '\\.').replace(',', '\\,') + '\\s*[€e]?(?![a-df-z])', 'i'), '$1').trim();
  
  let spender = null;
  const aliasPattern = Object.keys(SPENDER_ALIASES).join('|');
  const spenderRegex = new RegExp(`(?:^|\\s)(${aliasPattern})(?:\\s|$)`, 'i');
  const spenderMatch = input.match(spenderRegex);
  if (spenderMatch) {
    spender = SPENDER_ALIASES[spenderMatch[1].toLowerCase()];
    input = input.replace(new RegExp(`(?:^|\\s)${spenderMatch[1]}(?:\\s|$)`, 'i'), ' ').trim();
  }
  
  let date = parseDate(input);
  if (date) {
    input = removeDatePatterns(input);
  }
  
  let category = null;
  for (const cat of CONFIG.CATEGORIES) {
    const catLower = cat.toLowerCase();
    if (input.toLowerCase().includes(catLower)) {
      category = cat;
      input = input.replace(new RegExp(catLower, 'i'), '').trim();
      break;
    }
  }
  
  const merchant = input.replace(/\s+/g, ' ').trim() || 'Unknown';
  
  return {
    amount: amount,
    merchant: merchant,
    category: category,
    spender: spender,
    date: date,
    description: ''
  };
}

function parseWithGemini(input) {
  const config = getConfigValues();
  const apiKey = config.gemini_api_key;
  
  if (!apiKey) {
    return null;
  }
  
  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const categories = CONFIG.CATEGORIES.join(', ');
  
  const prompt = `Parse this expense input and return JSON only (no markdown, no explanation):
Input: "${input}"

Extract:
- amount: number (required, look for any number with optional €/e, comma or dot decimals)
- merchant: string (required, the store/place name - NOT item details)
- category: string or null (if explicitly mentioned from: ${categories})
- spender: "H" or "W" or null (H if: h, husband, nha, anh, aaron; W if: w, wife, trang, chang, em)
- date: ISO date string or null (parse: yesterday, today, tomorrow, DD.MM, DD/MM, DD.MM.YYYY, "march 6", "6th march", etc. Use timezone Europe/Berlin. Today is ${today})
- description: string or null (any item details, notes, or context after keywords like "items:", "for:", "desc:", or comma-separated details)

Examples:
"24€ amazon anh, category Gifts, Items: football, toys" → {"amount":24,"merchant":"amazon","category":"Gifts","spender":"H","date":null,"description":"football, toys"}
"45 rewe wife yesterday" → {"amount":45,"merchant":"rewe","category":null,"spender":"W","date":"${today}","description":null}
"lunch 15e for team meeting" → {"amount":15,"merchant":"lunch","category":null,"spender":null,"date":null,"description":"team meeting"}

Return ONLY valid JSON like:
{"amount":45,"merchant":"Rewe","category":null,"spender":"H","date":"2025-03-06","description":null}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 250
      }
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    
    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      const text = json.candidates[0].content.parts[0].text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.date) {
          // Validate date to prevent 1970 epoch bug
          const parsedDate = new Date(parsed.date);
          if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() >= 2020) {
            parsed.date = parsedDate;
          } else {
            // Invalid or very old date - ignore it
            parsed.date = null;
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    Logger.log('Gemini parse error: ' + e.toString());
  }
  
  return null;
}

function parseDate(input) {
  const now = new Date();
  const berlinNow = new Date(Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss"));
  const todayStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const todayParts = todayStr.split('-');
  const currentYear = parseInt(todayParts[0]);
  const currentMonth = parseInt(todayParts[1]) - 1;
  const currentDay = parseInt(todayParts[2]);
  
  function createDate(year, month, day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`;
    return new Date(Utilities.formatDate(new Date(dateStr), CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss"));
  }
  
  if (/\byesterday\b/i.test(input)) {
    return createDate(currentYear, currentMonth, currentDay - 1);
  }
  
  if (/\btomorrow\b/i.test(input)) {
    return createDate(currentYear, currentMonth, currentDay + 1);
  }
  
  if (/\btoday\b/i.test(input)) {
    return createDate(currentYear, currentMonth, currentDay);
  }
  
  const ddmmMatch = input.match(/(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?/);
  if (ddmmMatch) {
    const day = parseInt(ddmmMatch[1]);
    const month = parseInt(ddmmMatch[2]) - 1;
    let year = ddmmMatch[3] ? parseInt(ddmmMatch[3]) : currentYear;
    if (year < 100) year += 2000;
    return createDate(year, month, day);
  }
  
  const months = {
    'jan': 0, 'january': 0,
    'feb': 1, 'february': 1,
    'mar': 2, 'march': 2,
    'apr': 3, 'april': 3,
    'may': 4,
    'jun': 5, 'june': 5,
    'jul': 6, 'july': 6,
    'aug': 7, 'august': 7,
    'sep': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11
  };
  
  const monthPattern = Object.keys(months).join('|');
  const naturalMatch = input.match(new RegExp(`(${monthPattern})\\s*(\\d{1,2})(?:st|nd|rd|th)?|` + `(\\d{1,2})(?:st|nd|rd|th)?\\s*(${monthPattern})`, 'i'));
  
  if (naturalMatch) {
    let monthStr, day;
    if (naturalMatch[1]) {
      monthStr = naturalMatch[1].toLowerCase();
      day = parseInt(naturalMatch[2]);
    } else {
      day = parseInt(naturalMatch[3]);
      monthStr = naturalMatch[4].toLowerCase();
    }
    const month = months[monthStr];
    return createDate(currentYear, month, day);
  }
  
  return null;
}

function removeDatePatterns(input) {
  input = input.replace(/\byesterday\b/gi, '');
  input = input.replace(/\btomorrow\b/gi, '');
  input = input.replace(/\btoday\b/gi, '');
  input = input.replace(/\d{1,2}[.\/]\d{1,2}([.\/]\d{2,4})?/g, '');
  
  const monthPattern = 'jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december';
  input = input.replace(new RegExp(`(${monthPattern})\\s*\\d{1,2}(?:st|nd|rd|th)?`, 'gi'), '');
  input = input.replace(new RegExp(`\\d{1,2}(?:st|nd|rd|th)?\\s*(${monthPattern})`, 'gi'), '');
  
  return input.replace(/\s+/g, ' ').trim();
}

// ============ CATEGORIZATION ============

function categorizeExpense(merchant) {
  const patterns = getSheet(CONFIG.SHEETS.PATTERNS);
  const data = patterns.getDataRange().getValues();
  
  const merchantLower = merchant.toLowerCase();
  for (let i = 1; i < data.length; i++) {
    const pattern = (data[i][0] || '').toLowerCase();
    if (pattern && merchantLower.includes(pattern)) {
      return data[i][1];
    }
  }
  
  const aiCategory = aiCategorize(merchant);
  if (aiCategory) {
    return aiCategory;
  }
  
  return 'Buffer';
}

function aiCategorize(merchant) {
  const config = getConfigValues();
  const apiKey = config.gemini_api_key;
  
  if (!apiKey) return null;
  
  const categories = CONFIG.CATEGORIES.join(', ');
  const prompt = `Categorize this German expense merchant into exactly one category.
Merchant: "${merchant}"
Categories: ${categories}

Respond with ONLY the category name, nothing else.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 50 }
    };
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const json = JSON.parse(response.getContentText());
    if (json.candidates && json.candidates[0]) {
      const category = json.candidates[0].content.parts[0].text.trim();
      if (CONFIG.CATEGORIES.includes(category)) {
        return category;
      }
    }
  } catch (e) {
    Logger.log('AI categorize error: ' + e.toString());
  }
  
  return null;
}

function calculateBudgetStatus(category, monthKey, cachedSpending) {
  const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
  const budgetData = budgetSheet.getDataRange().getValues();
  
  let budget = 0;
  for (let i = 1; i < budgetData.length; i++) {
    if (budgetData[i][0] === category) {
      budget = budgetData[i][1] || 0;
      break;
    }
  }
  
  const spent = calculateCategorySpent(category, monthKey, cachedSpending);
  const remaining = budget - spent;
  const percent = budget > 0 ? spent / budget : 0;
  
  let status = EMOJI.GREEN;
  if (percent >= 1) status = EMOJI.RED;
  else if (percent >= 0.8) status = EMOJI.ORANGE;
  else if (percent >= 0.5) status = EMOJI.YELLOW;
  
  return {
    category: category,
    spent: spent,
    budget: budget,
    remaining: remaining,
    percent: percent,
    status: status
  };
}

// Helper: Get all category spending in ONE sheet read
function getAllCategorySpending(monthKey) {
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const data = sheet.getDataRange().getValues();
  
  const searchKey = monthKey.replace(/^'/, '');
  const spending = {};
  
  // Initialize all categories to 0
  CONFIG.CATEGORIES.forEach(cat => {
    spending[cat] = 0;
  });
  
  // Single pass through all data
  for (let i = 1; i < data.length; i++) {
    let storedKey = data[i][14];
    if (storedKey && typeof storedKey === 'string') {
      storedKey = storedKey.replace(/^'/, '');
    }
    
    if (storedKey === searchKey) {
      const category = data[i][6];
      const amount = data[i][3] || 0;
      if (spending.hasOwnProperty(category)) {
        spending[category] += amount;
      } else {
        spending[category] = amount;
      }
    }
  }
  
  return spending;
}

function calculateCategorySpent(category, monthKey, cachedSpending) {
  // If cached data provided, use it (fast path)
  if (cachedSpending) {
    return cachedSpending[category] || 0;
  }
  
  // Fallback: single category lookup (for backward compatibility)
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const data = sheet.getDataRange().getValues();
  
  const searchKey = monthKey.replace(/^'/, '');
  
  let total = 0;
  for (let i = 1; i < data.length; i++) {
    let storedKey = data[i][14];
    if (storedKey && typeof storedKey === 'string') {
      storedKey = storedKey.replace(/^'/, '');
    }
    if (data[i][6] === category && storedKey === searchKey) {
      total += data[i][3] || 0;
    }
  }
  
  return total;
}

// ============ COMMANDS ============

function getBudgetStatus() {
  const monthKey = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM');
  const monthName = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'MMMM yyyy');
  
  // Read budget data
  const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
  const budgetData = budgetSheet.getDataRange().getValues();
  
  // Read ALL spending in ONE call
  const allSpending = getAllCategorySpending(monthKey);
  
  // Build table rows
  let tableRows = [];
  let totalBudget = 0;
  let totalSpent = 0;
  
  // SL_Budget has multiple months - filter for current month only
  for (let i = 1; i < budgetData.length; i++) {
    const category = budgetData[i][0];
    const budget = budgetData[i][1] || 0;
    const rowMonthKey = String(budgetData[i][2] || '').replace(/^'/, '');
    
    // Skip rows that don't match current month
    if (rowMonthKey !== monthKey) continue;
    if (!category) continue;
    
    const spent = allSpending[category] || 0;
    const percent = budget > 0 ? spent / budget : 0;
    
    let status = EMOJI.GREEN;
    if (percent >= 1) status = EMOJI.RED;
    else if (percent >= 0.8) status = EMOJI.ORANGE;
    else if (percent >= 0.5) status = EMOJI.YELLOW;
    
    // Truncate category name to fit
    let catName = category;
    if (catName.length > 18) catName = catName.substring(0, 16) + '..';
    
    tableRows.push({
      status: status,
      category: catName,
      spent: spent,
      budget: budget,
      percent: percent
    });
    
    totalBudget += budget;
    totalSpent += spent;
  }
  
  // Sort by budget descending (or keep original order)
  // tableRows.sort((a, b) => b.budget - a.budget);
  
  // Build the formatted table using monospace
  let table = '```\n';
  table += '  Category            Spent   Budget    %\n';
  table += '─'.repeat(45) + '\n';
  
  for (const row of tableRows) {
    // Skip zero/zero
    if (row.budget === 0 && row.spent === 0) continue;
    
    const catPad = row.category.padEnd(18);
    const spentPad = ('€' + row.spent.toFixed(0)).padStart(7);
    const budgetPad = ('€' + row.budget.toFixed(0)).padStart(7);
    const pctPad = ((row.percent * 100).toFixed(0) + '%').padStart(5);
    
    table += `${row.status} ${catPad} ${spentPad} ${budgetPad} ${pctPad}\n`;
  }
  
  const totalPercent = totalBudget > 0 ? totalSpent / totalBudget : 0;
  table += '─'.repeat(45) + '\n';
  table += `   ${'TOTAL'.padEnd(18)} ${('€' + totalSpent.toFixed(0)).padStart(7)} ${('€' + totalBudget.toFixed(0)).padStart(7)} ${((totalPercent * 100).toFixed(0) + '%').padStart(5)}\n`;
  table += '```';
  
  // Discord embed with the table in description
  const embed = {
    title: `📊 BUDGET STATUS (${monthName})`,
    description: table,
    color: totalPercent >= 1 ? 0xFF0000 : totalPercent >= 0.8 ? 0xFFA500 : 0x3498db
  };
  
  sendDiscordMessage(null, embed);
  return { success: true };
}

function getBudgetLeft() {
  const monthKey = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM');
  const monthName = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'MMMM yyyy');
  
  // Read budget data
  const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
  const budgetData = budgetSheet.getDataRange().getValues();
  
  // Read ALL spending in ONE call
  const allSpending = getAllCategorySpending(monthKey);
  
  let response = `${EMOJI.MONEY} **BUDGET REMAINING** (${monthName})\n`;
  response += '```\n';
  response += 'Category              Left     Budget  Used\n';
  response += `${EMOJI.LINE.repeat(41)}\n`;
  
  let totalBudget = 0;
  let totalSpent = 0;
  
  // SL_Budget has multiple months - filter for current month only
  // Schema: [category, Budget, Month_Key, Spent, Remaining, Percent]
  for (let i = 1; i < budgetData.length; i++) {
    const category = budgetData[i][0];
    const budget = budgetData[i][1] || 0;
    const rowMonthKey = String(budgetData[i][2] || '').replace(/^'/, '');
    
    // Skip rows that don't match current month
    if (rowMonthKey !== monthKey) continue;
    if (!category) continue;
    
    // Use cached spending data
    const spent = allSpending[category] || 0;
    const remaining = budget - spent;
    const percent = budget > 0 ? spent / budget : 0;
    
    let status = EMOJI.GREEN;
    if (remaining < 0) status = EMOJI.RED;
    else if (percent >= 0.8) status = EMOJI.ORANGE;
    else if (percent >= 0.5) status = EMOJI.YELLOW;
    
    const catName = category.substring(0, 18).padEnd(18);
    const remainingStr = remaining >= 0 ? (`${EMOJI.EURO}` + remaining.toFixed(0)).padStart(8) : (`-${EMOJI.EURO}` + Math.abs(remaining).toFixed(0)).padStart(8);
    const budgetStr = (`${EMOJI.EURO}` + budget).padStart(8);
    const percentStr = ((percent * 100).toFixed(0) + '%').padStart(4);
    
    response += `${status} ${catName} ${remainingStr} ${budgetStr} ${percentStr}\n`;
    
    totalBudget += budget;
    totalSpent += spent;
  }
  
  const totalRemaining = totalBudget - totalSpent;
  const totalPercent = totalBudget > 0 ? totalSpent / totalBudget : 0;
  response += `${EMOJI.LINE.repeat(41)}\n`;
  response += `   TOTAL              ${(`${EMOJI.EURO}` + totalRemaining.toFixed(0)).padStart(8)} ${(`${EMOJI.EURO}` + totalBudget).padStart(8)} ${((totalPercent * 100).toFixed(0) + '%').padStart(4)}\n`;
  response += '```';
  
  sendDiscordMessage(response);
  return { success: true };
}

function getYTDStatus() {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
  const budgetData = budgetSheet.getDataRange().getValues();
  const ledgerSheet = getSheet(CONFIG.SHEETS.LEDGER);
  const ledgerData = ledgerSheet.getDataRange().getValues();
  
  let response = `${EMOJI.CHART} **YEAR TO DATE** (${year})\n`;
  response += '```\n';
  response += 'Category              Spent    Budget   %\n';
  response += `${EMOJI.LINE.repeat(41)}\n`;
  
  let totalBudget = 0;
  let totalSpent = 0;
  
  for (let i = 1; i < budgetData.length; i++) {
    const category = budgetData[i][0];
    const monthlyBudget = budgetData[i][1] || 0;
    if (!category) continue;
    
    const ytdBudget = monthlyBudget * currentMonth;
    
    let ytdSpent = 0;
    for (let j = 1; j < ledgerData.length; j++) {
      const txnCategory = ledgerData[j][6];
      let monthKey = ledgerData[j][14];
      if (monthKey && typeof monthKey === 'string') {
        monthKey = monthKey.replace(/^'/, '');
      }
      if (txnCategory === category && monthKey && monthKey.startsWith(year.toString())) {
        ytdSpent += ledgerData[j][3] || 0;
      }
    }
    
    const percent = ytdBudget > 0 ? ytdSpent / ytdBudget : 0;
    let status = EMOJI.GREEN;
    if (percent >= 1) status = EMOJI.RED;
    else if (percent >= 0.8) status = EMOJI.ORANGE;
    else if (percent >= 0.5) status = EMOJI.YELLOW;
    
    const percentStr = (percent * 100).toFixed(0).padStart(3);
    const catName = category.substring(0, 18).padEnd(18);
    const spentStr = (`${EMOJI.EURO}` + ytdSpent.toFixed(0)).padStart(8);
    const budgetStr = (`${EMOJI.EURO}` + ytdBudget.toFixed(0)).padStart(8);
    
    response += `${status} ${catName} ${spentStr} ${budgetStr} ${percentStr}%\n`;
    
    totalBudget += ytdBudget;
    totalSpent += ytdSpent;
  }
  
  const totalPercent = totalBudget > 0 ? totalSpent / totalBudget : 0;
  response += `${EMOJI.LINE.repeat(41)}\n`;
  response += `   TOTAL YTD          ${(`${EMOJI.EURO}` + totalSpent.toFixed(0)).padStart(8)} ${(`${EMOJI.EURO}` + totalBudget.toFixed(0)).padStart(8)} ${(totalPercent * 100).toFixed(0).padStart(3)}%\n`;
  response += '```';
  
  sendDiscordMessage(response);
  return { success: true };
}

function getTodayTransactions() {
  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const data = sheet.getDataRange().getValues();
  
  let response = `${EMOJI.CALENDAR} **Today's Transactions** (${today})\n${EMOJI.LINE.repeat(29)}\n`;
  let total = 0;
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    const txnDate = Utilities.formatDate(new Date(data[i][2]), CONFIG.TIMEZONE, 'yyyy-MM-dd');
    if (txnDate === today) {
      const amount = data[i][3];
      const merchant = data[i][4];
      const category = data[i][6];
      response += `${EMOJI.EURO}${amount.toFixed(2)} - ${merchant} (${category})\n`;
      total += amount;
      count++;
    }
  }
  
  if (count === 0) {
    response += `${EMOJI.SPARKLE} No transactions yet today`;
  } else {
    response += `${EMOJI.LINE.repeat(29)}\n**Total:** ${EMOJI.EURO}${total.toFixed(2)} (${count} transactions)`;
  }
  
  sendDiscordMessage(response);
  return { success: true };
}

function getWeekTransactions() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const data = sheet.getDataRange().getValues();
  
  let response = `${EMOJI.DATE} **This Week's Transactions**\n${EMOJI.LINE.repeat(29)}\n`;
  let total = 0;
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    const txnDate = new Date(data[i][2]);
    if (txnDate >= weekAgo) {
      const amount = data[i][3];
      const merchant = data[i][4];
      const category = data[i][6];
      const dateStr = Utilities.formatDate(txnDate, CONFIG.TIMEZONE, 'MM-dd');
      response += `${dateStr}: ${EMOJI.EURO}${amount.toFixed(2)} - ${merchant} (${category})\n`;
      total += amount;
      count++;
    }
  }
  
  if (count === 0) {
    response += `${EMOJI.SPARKLE} No transactions this week`;
  } else {
    response += `${EMOJI.LINE.repeat(29)}\n**Total:** ${EMOJI.EURO}${total.toFixed(2)} (${count} transactions)`;
  }
  
  sendDiscordMessage(response);
  return { success: true };
}

function handleUndo(username) {
  const props = PropertiesService.getScriptProperties();
  const lastTxnId = props.getProperty('last_txn_id');
  const lastTxnTime = parseInt(props.getProperty('last_txn_time') || '0');
  
  if (!lastTxnId) {
    sendDiscordMessage(`${EMOJI.CROSS} No recent transaction to undo.`);
    return { success: false };
  }
  
  const now = new Date().getTime();
  if (now - lastTxnTime > 10 * 60 * 1000) {
    sendDiscordMessage(`${EMOJI.CROSS} Last transaction is older than 10 minutes. Cannot undo.`);
    return { success: false };
  }
  
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const data = sheet.getDataRange().getValues();
  let txnDetails = null;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === lastTxnId) {
      txnDetails = {
        row: i + 1,
        amount: data[i][3],
        merchant: data[i][4],
        category: data[i][6]
      };
      break;
    }
  }
  
  if (!txnDetails) {
    sendDiscordMessage(`${EMOJI.CROSS} Transaction not found in sheet.`);
    return { success: false };
  }
  
  props.setProperty('pending_undo', lastTxnId);
  props.setProperty('pending_undo_row', txnDetails.row.toString());
  
  const minutesAgo = Math.round((now - lastTxnTime) / 60000);
  sendDiscordMessage(`${EMOJI.WARNING} **Delete this transaction?**
${EMOJI.LINE.repeat(29)}
${EMOJI.EURO}${txnDetails.amount.toFixed(2)} - ${txnDetails.merchant} (${txnDetails.category})
Logged ${minutesAgo} min ago
${EMOJI.LINE.repeat(29)}
Reply **!undo confirm** to delete`);
  
  return { success: true };
}

function executeUndo(username) {
  const props = PropertiesService.getScriptProperties();
  const pendingUndo = props.getProperty('pending_undo');
  
  if (!pendingUndo) {
    sendDiscordMessage(`${EMOJI.CROSS} No pending undo. Use !undo first.`);
    return { success: false };
  }
  
  try {
    const sheet = getSheet(CONFIG.SHEETS.LEDGER);
    const data = sheet.getDataRange().getValues();
    
    let rowToDelete = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === pendingUndo) {
        rowToDelete = i + 1;
        break;
      }
    }
    
    if (!rowToDelete) {
      sendDiscordMessage(`${EMOJI.CROSS} Transaction not found. May have been already deleted.`);
      props.deleteProperty('pending_undo');
      props.deleteProperty('pending_undo_row');
      return { success: false };
    }
    
    sheet.deleteRow(rowToDelete);
    
    props.deleteProperty('pending_undo');
    props.deleteProperty('pending_undo_row');
    props.deleteProperty('last_txn_id');
    props.deleteProperty('last_txn_time');
    props.deleteProperty('last_txn_user');
    
    sendDiscordMessage(`${EMOJI.CHECK} Deleted transaction ${pendingUndo}`);
    return { success: true };
  } catch (e) {
    sendDiscordMessage(`${EMOJI.CROSS} Error deleting: ` + e.toString());
    return { success: false };
  }
}

// ============ FORMATTING ============

function formatExpenseResponse(parsed, category, spender, categorization, budgetStatus) {
  const catTag = categorization === 'ai' ? `(ai ${EMOJI.WARNING})` : '(user)';
  
  // Build currency info line if VND was used
  let currencyLine = '';
  if (parsed.currencyInfo && parsed.currencyInfo.originalCurrency === 'VND') {
    const vndFormatted = parsed.currencyInfo.originalAmount.toLocaleString('de-DE');
    const rateDisplay = (1 / parsed.currencyInfo.exchangeRate).toFixed(0);
    currencyLine = `\n${EMOJI.VND} Original: ${vndFormatted} VND (1${EMOJI.EURO} = ${rateDisplay} VND)`;
  }
  
  return `${EMOJI.CHECK} **Logged:** ${EMOJI.EURO}${parsed.amount.toFixed(2)} ${EMOJI.ARROW} ${category}${currencyLine}
${EMOJI.MEMO} Merchant: ${parsed.merchant}
${EMOJI.PERSON} Spender: ${spender}
📊 Category: ${category} ${catTag}

${EMOJI.LINE.repeat(29)}
${EMOJI.CHART} **BUDGET STATUS**
${EMOJI.LINE.repeat(29)}
**${category}:** ${EMOJI.EURO}${budgetStatus.spent.toFixed(0)}/${EMOJI.EURO}${budgetStatus.budget} (${(budgetStatus.percent * 100).toFixed(0)}%) ${budgetStatus.status}
${EMOJI.LINE.repeat(29)}`;
}

// ============ UTILITIES ============

function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function sendDiscordMessage(content, embed = null) {
  const config = getConfigValues();
  const webhookUrl = config.discord_webhook_url;
  
  if (!webhookUrl) {
    Logger.log('No webhook URL configured');
    return;
  }
  
  const payload = {};
  if (content) payload.content = content;
  if (embed) payload.embeds = [embed];
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(webhookUrl, options);
  } catch (error) {
    Logger.log('Error sending to Discord: ' + error.toString());
  }
}

function getConfigValues() {
  const sheet = getSheet(CONFIG.SHEETS.CONFIG);
  if (!sheet) return {};
  
  const data = sheet.getDataRange().getValues();
  const config = {};
  
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    const value = data[i][1];
    if (key) {
      config[key] = value;
    }
  }
  
  return config;
}

function generateTxnId() {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyyMMdd');
  const timeStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'HHmmss');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SL-${dateStr}-${timeStr}-${rand}`;
}

// ============ DASHBOARD API ============

function getDashboardData() {
  // This function should be implemented based on your dashboard requirements
  // Returning a placeholder for now
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Dashboard data endpoint'
  })).setMimeType(ContentService.MimeType.JSON);
}

function getExpenseBreakdown(month) {
  try {
    const ledgerSheet = getSheet(CONFIG.SHEETS.LEDGER);
    const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
    
    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 0);
    
    const ledgerData = ledgerSheet.getDataRange().getValues();
    
    const categoryData = {};
    CONFIG.CATEGORIES.forEach(cat => {
      categoryData[cat] = {
        spent: 0,
        transactions: []
      };
    });
    
    for (let i = 1; i < ledgerData.length; i++) {
      const txnDate = new Date(ledgerData[i][2]);
      const amount = ledgerData[i][3] || 0;
      const merchant = ledgerData[i][4] || '';
      const category = ledgerData[i][6];
      
      if (txnDate >= monthStart && txnDate <= monthEnd) {
        if (categoryData.hasOwnProperty(category)) {
          categoryData[category].spent += amount;
          categoryData[category].transactions.push({
            date: Utilities.formatDate(txnDate, CONFIG.TIMEZONE, 'dd.MM'),
            date_sort: txnDate.getTime(),
            merchant: merchant,
            amount: Math.round(amount * 100) / 100
          });
        } else {
          categoryData[category] = {
            spent: amount,
            transactions: [{
              date: Utilities.formatDate(txnDate, CONFIG.TIMEZONE, 'dd.MM'),
              date_sort: txnDate.getTime(),
              merchant: merchant,
              amount: Math.round(amount * 100) / 100
            }]
          };
        }
      }
    }
    
    const budgetData = budgetSheet.getDataRange().getValues();
    const budgetMap = {};
    for (let i = 1; i < budgetData.length; i++) {
      const category = budgetData[i][0];
      const budget = budgetData[i][1] || 0;
      let storedMonthKey = budgetData[i][2] || '';
      
      if (typeof storedMonthKey === 'string') {
        storedMonthKey = storedMonthKey.replace(/^'/, '');
      }
      
      if (storedMonthKey === month) {
        budgetMap[category] = budget;
      }
    }
    
    const categories = [];
    let totalSpent = 0;
    let totalBudget = 0;
    let totalTxnCount = 0;
    
    CONFIG.CATEGORIES.forEach(cat => {
      const data = categoryData[cat];
      const spent = Math.round(data.spent * 100) / 100;
      const budget = budgetMap[cat];
      const hasBudget = budget !== undefined;
      const percent = hasBudget && budget > 0 ? Math.round((spent / budget) * 100) : null;
      const txnCount = data.transactions.length;
      
      const txnsByDate = [...data.transactions].sort((a, b) => b.date_sort - a.date_sort);
      const txnsByAmount = [...data.transactions].sort((a, b) => b.amount - a.amount);
      
      const recentTxns = txnsByDate.slice(0, 10).map(t => ({
        date: t.date,
        merchant: t.merchant,
        amount: t.amount
      }));
      
      const topTxns = txnsByAmount.slice(0, 10).map(t => ({
        date: t.date,
        merchant: t.merchant,
        amount: t.amount
      }));
      
      const avgAmount = txnCount > 0 ? Math.round((spent / txnCount) * 100) / 100 : 0;
      const maxTxn = txnsByAmount[0] || null;
      
      categories.push({
        name: cat,
        spent: spent,
        budget: hasBudget ? budget : null,
        percent: percent,
        status: getStatusEmojiDashboard(percent),
        transaction_count: txnCount,
        transactions_recent: recentTxns,
        transactions_top: topTxns,
        insights: {
          avg_amount: avgAmount,
          largest_amount: maxTxn ? maxTxn.amount : null,
          largest_date: maxTxn ? maxTxn.date : null,
          largest_merchant: maxTxn ? maxTxn.merchant : null
        }
      });
      
      totalSpent += spent;
      totalTxnCount += txnCount;
      if (hasBudget) {
        totalBudget += budget;
      }
    });
    
    categories.sort((a, b) => b.spent - a.spent);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      month: month,
      month_name: getMonthName(monthNum) + ' ' + year,
      categories: categories,
      summary: {
        total_spent: Math.round(totalSpent * 100) / 100,
        total_budget: totalBudget > 0 ? totalBudget : null,
        total_percent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : null,
        transaction_count: totalTxnCount,
        budget_available: totalBudget > 0
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getStatusEmojiDashboard(percent) {
  if (percent === null) return 'N/A';
  if (percent >= 100) return EMOJI.RED;
  if (percent >= 80) return EMOJI.ORANGE;
  if (percent >= 50) return EMOJI.YELLOW;
  return EMOJI.GREEN;
}

function getMonthName(monthNum) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNum - 1] || 'Unknown';
}

// ============ SCHEDULED SUMMARIES ============

// Daily Summary (called by Time-Driven trigger at 9:00 AM)
function sendDailySummary() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = Utilities.formatDate(yesterday, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const yesterdayDisplay = Utilities.formatDate(yesterday, CONFIG.TIMEZONE, 'EEE, dd MMM');
  
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const data = sheet.getDataRange().getValues();
  
  let total = 0;
  let count = 0;
  const categories = {};
  const transactions = [];
  
  for (let i = 1; i < data.length; i++) {
    const txnDate = data[i][2];
    if (!txnDate) continue;
    
    const txnDateStr = Utilities.formatDate(new Date(txnDate), CONFIG.TIMEZONE, 'yyyy-MM-dd');
    if (txnDateStr === yesterdayStr) {
      const amount = data[i][3] || 0;
      const merchant = data[i][4] || 'Unknown';
      const category = data[i][6] || 'Uncategorized';
      
      total += amount;
      count++;
      categories[category] = (categories[category] || 0) + amount;
      transactions.push({ merchant, amount, category });
    }
  }
  
  if (count === 0) {
    Logger.log('No transactions yesterday, skipping daily summary');
    return;
  }
  
  let response = `${EMOJI.CALENDAR} **Daily Summary** (${yesterdayDisplay})\n`;
  response += `${EMOJI.LINE.repeat(32)}\n`;
  response += `**${count} transactions** totaling **${EMOJI.EURO}${total.toFixed(2)}**\n\n`;
  
  // Top categories
  const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  response += `${EMOJI.CHART} **By Category:**\n`;
  for (const [cat, amt] of sortedCats.slice(0, 5)) {
    response += `${EMOJI.BULLET} ${cat}: ${EMOJI.EURO}${amt.toFixed(2)}\n`;
  }
  
  // Top transactions
  if (transactions.length > 0) {
    response += `\n${EMOJI.TRENDING} **Largest:**\n`;
    const topTxns = transactions.sort((a, b) => b.amount - a.amount).slice(0, 3);
    for (const txn of topTxns) {
      response += `${EMOJI.BULLET} ${EMOJI.EURO}${txn.amount.toFixed(2)} - ${txn.merchant}\n`;
    }
  }
  
  sendDiscordMessage(response);
  Logger.log('Sent daily summary for ' + yesterdayStr);
}

// Weekly Summary (called by Time-Driven trigger on Mondays)
function sendWeeklySummary() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = Utilities.formatDate(weekAgo, CONFIG.TIMEZONE, 'dd MMM');
  const nowStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'dd MMM');
  
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const data = sheet.getDataRange().getValues();
  
  let total = 0;
  let count = 0;
  const categories = {};
  const dailyTotals = {};
  
  for (let i = 1; i < data.length; i++) {
    const txnDate = new Date(data[i][2]);
    if (txnDate >= weekAgo && txnDate <= now) {
      const amount = data[i][3] || 0;
      const category = data[i][6] || 'Uncategorized';
      const dayKey = Utilities.formatDate(txnDate, CONFIG.TIMEZONE, 'EEE');
      
      total += amount;
      count++;
      categories[category] = (categories[category] || 0) + amount;
      dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + amount;
    }
  }
  
  if (count === 0) {
    Logger.log('No transactions this week, skipping weekly summary');
    return;
  }
  
  // Get budget for comparison
  const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
  const budgetData = budgetSheet.getDataRange().getValues();
  let totalBudget = 0;
  for (let i = 1; i < budgetData.length; i++) {
    totalBudget += budgetData[i][1] || 0;
  }
  
  const weeklyBudget = totalBudget / 4.33;
  const percent = weeklyBudget > 0 ? (total / weeklyBudget * 100).toFixed(0) : 0;
  
  let response = `${EMOJI.CHART} **Weekly Summary** (${weekAgoStr} - ${nowStr})\n`;
  response += `${EMOJI.LINE.repeat(32)}\n`;
  response += `**${count} transactions** totaling **${EMOJI.EURO}${total.toFixed(2)}**\n`;
  response += `Weekly pace: **${percent}%** of budget\n\n`;
  
  // Top categories
  response += `${EMOJI.TRENDING} **Top Categories:**\n`;
  const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5);
  for (const [cat, amt] of sortedCats) {
    const catPercent = (amt / total * 100).toFixed(0);
    response += `${EMOJI.BULLET} ${cat}: ${EMOJI.EURO}${amt.toFixed(2)} (${catPercent}%)\n`;
  }
  
  // Daily breakdown
  response += `\n${EMOJI.CALENDAR} **Daily Breakdown:**\n`;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (const day of days) {
    const dayTotal = dailyTotals[day] || 0;
    const bar = dayTotal > 0 ? EMOJI.BULLET.repeat(Math.min(Math.ceil(dayTotal / 20), 10)) : '-';
    response += `${day}: ${EMOJI.EURO}${dayTotal.toFixed(0).padStart(4)} ${bar}\n`;
  }
  
  sendDiscordMessage(response);
  Logger.log('Sent weekly summary');
}

// ============ TEST FUNCTIONS ============

function testExpenseBreakdown() {
  const now = new Date();
  const month = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM');
  const result = getExpenseBreakdown(month);
  const content = result.getContent();
  const data = JSON.parse(content);
  Logger.log('Test: ' + JSON.stringify(data.summary));
}

function testIncomeStatus() {
  getIncomeStatus();
  Logger.log('Income status test complete');
}

function testInvestmentStatus() {
  getInvestmentStatus();
  Logger.log('Investment status test complete');
}

// ============ ONE-TIME SETUP FUNCTIONS ============
// Run these manually from Apps Script editor when needed

/**
 * ONE-TIME: Populate SL_Budget with new category for all months 2026-01 to 2042-12
 * Run this once after adding a new category to CONFIG.CATEGORIES
 * 
 * HOW TO USE:
 * 1. Open Apps Script editor
 * 2. Select this function from dropdown
 * 3. Click Run
 * 4. Check SL_Budget sheet for new rows
 */
function populateBudgetForNewCategory() {
  const CATEGORY_NAME = 'Fees, Interest, Bureaucracy, Documents';
  const BUDGET_AMOUNT = 100;  // €100 per month
  const START_YEAR = 2026;
  const START_MONTH = 1;  // January
  const END_YEAR = 2042;
  const END_MONTH = 12;  // December
  
  const sheet = getSheet(CONFIG.SHEETS.BUDGET);
  if (!sheet) {
    Logger.log('ERROR: SL_Budget sheet not found');
    return;
  }
  
  // Check if category already has entries
  const existingData = sheet.getDataRange().getValues();
  let existingCount = 0;
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === CATEGORY_NAME) {
      existingCount++;
    }
  }
  
  if (existingCount > 0) {
    Logger.log(`WARNING: Category "${CATEGORY_NAME}" already has ${existingCount} entries. Skipping to avoid duplicates.`);
    Logger.log('If you want to re-run, first delete existing entries for this category.');
    return;
  }
  
  // Generate all month keys and add rows
  const rowsToAdd = [];
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const startM = (year === START_YEAR) ? START_MONTH : 1;
    const endM = (year === END_YEAR) ? END_MONTH : 12;
    
    for (let month = startM; month <= endM; month++) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      rowsToAdd.push([CATEGORY_NAME, BUDGET_AMOUNT, "'" + monthKey]);
    }
  }
  
  // Batch append all rows
  if (rowsToAdd.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rowsToAdd.length, 3).setValues(rowsToAdd);
    Logger.log(`SUCCESS: Added ${rowsToAdd.length} budget entries for "${CATEGORY_NAME}"`);
    Logger.log(`Range: ${START_YEAR}-${String(START_MONTH).padStart(2, '0')} to ${END_YEAR}-${String(END_MONTH).padStart(2, '0')}`);
  }
}

/**
 * ONE-TIME: Test VND detection (run from Apps Script to debug)
 */
function testVndDetection() {
  const testCases = [
    '50kVND banh mi w',
    '50k VND banh mi w', 
    '200000VND pho h',
    '200k cafe',
    '45 rewe',  // Should NOT detect VND
  ];
  
  for (const test of testCases) {
    const result = detectAndConvertVnd(test);
    if (result) {
      Logger.log(`INPUT: "${test}"`);
      Logger.log(`  VND: ${result.originalAmount} → EUR: ${result.eurAmount}`);
      Logger.log(`  Cleaned: "${result.cleanedInput}"`);
    } else {
      Logger.log(`INPUT: "${test}" → No VND detected (EUR assumed)`);
    }
  }
}
