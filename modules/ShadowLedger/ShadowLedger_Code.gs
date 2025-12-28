/**
 * ShadowLedger - Google Apps Script
 * Version: 2.1.0
 * Date: 2025-12-28
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
    INCOME_LOG: 'SL_Income_Log'  // NEW: Income tracking sheet
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
    'Buffer'
  ],
  // NEW: Income types configuration
  INCOME_TYPES: {
    'salary': { column: 'net_salary', requiresSpender: true, label: 'Net Salary' },
    'youtube': { column: 'yt_gross', requiresSpender: false, label: 'YouTube Gross' },
    'other': { column: 'other_fam_net_inc', requiresSpender: false, label: 'Other Income' }
  },
  REMINDER_DAYS: [1, 6, 11, 16, 21, 26]  // Days to send reminder
};

// Feature #1: Extended spender aliases
const SPENDER_ALIASES = {
  'h': 'H', 'husband': 'H', 'nha': 'H', 'anh': 'H', 'aaron': 'H',
  'w': 'W', 'wife': 'W', 'trang': 'W', 'chang': 'W', 'em': 'W'
};

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
  
  // Route: Dashboard financial data
  if (action === 'dashboard') {
    return getDashboardData();
  }
  
  // Route: Expense breakdown by month
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
  
  // Route: Health check
  if (action === 'test') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'ShadowLedger API v2.1.0 is running',
      timestamp: new Date().toISOString(),
      endpoints: [
        '?action=dashboard - Financial data for Sankey',
        '?action=expenses&month=YYYY-MM - Expense breakdown',
        '?action=test - This health check'
      ],
      features: ['expenses', 'income', 'ta_hours', 'reminders']
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Default response
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'ShadowLedger API v2.1.0',
    hint: 'Use ?action=dashboard, ?action=expenses&month=YYYY-MM, or ?action=test'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============ MESSAGE PROCESSING ============

function processDiscordMessage(data) {
  const message = data.content.trim();
  const username = data.username || 'unknown';
  
  // Commands
  if (message.startsWith('!')) {
    return handleCommand(message, username);
  }
  
  // Feature #2: Multi-transaction support
  const lines = message.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 1) {
    return logExpense(lines[0], username);
  }
  
  return logMultipleExpenses(lines, username);
}

// Feature #2: Multi-transaction handler
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
        results.push(`✦ €${result.amount.toFixed(2)} → ${result.category}`);
        if (!categorySpending[result.category]) {
          categorySpending[result.category] = 0;
        }
        categorySpending[result.category] += result.amount;
      } else {
        failCount++;
        results.push(`❌ "${line.substring(0, 20)}..." - ${result.error}`);
      }
    } catch (e) {
      failCount++;
      results.push(`❌ "${line.substring(0, 20)}..." - Error`);
    }
  }
  
  const monthKey = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM');
  let budgetLines = [];
  for (const cat of Object.keys(categorySpending)) {
    const status = calculateBudgetStatus(cat, monthKey);
    budgetLines.push(`${status.status} ${cat}: €${status.spent.toFixed(0)}/€${status.budget} (${(status.percent * 100).toFixed(0)}%)`);
  }
  
  let response = `📋 **BATCH LOGGED** (${successCount}/${lines.length})
─────────────────────────────
${results.join('\n')}
─────────────────────────────
**Total:** €${totalAmount.toFixed(2)}`;

  if (budgetLines.length > 0) {
    response += `\n\n📊 **Budget Status:**\n${budgetLines.join('\n')}`;
  }
  
  sendDiscordMessage(response);
  return { success: true, logged: successCount, failed: failCount };
}

function handleCommand(message, username) {
  const parts = message.toLowerCase().split(' ');
  const cmd = parts[0];
  
  if (cmd === '!help') {
    const helpText = `**ShadowLedger v2.1 Commands**

📍 **Expense Logging (flexible format):**
Any order works! Examples:
• 45 rewe
• rewe 45€ wife yesterday
• 27 lidl 01.03 husband

📦 **Multi-line batch:**
Use Shift+Enter for line breaks

👤 **Spender names:**
H: h, husband, nha, anh, aaron
W: w, wife, trang, chang, em

📆 **Dates:**
yesterday, today, tomorrow
06.03, 6/3, march 6

📋 **Expense Commands:**
!status - Monthly budget table
!budgetleft - Remaining budget
!ytd - Year to date table
!today - Today's expenses
!week - This week's expenses
!undo - Delete last transaction

💰 **Income Commands (NEW):**
!income 4200 salary h - Log H net salary
!income 3800 salary w - Log W net salary
!income 1200 youtube - Log YT gross
!income 50 other payback - Log other income
!income status - Check what's missing

⏱️ **Time Account:**
!ta 45 h - Log H hours added
!ta 38 w - Log W hours added

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
  
  // NEW: Income commands
  if (cmd === '!income') {
    if (parts.length >= 2 && parts[1] === 'status') {
      return getIncomeStatus();
    }
    return handleIncomeCommand(message, username);
  }
  
  // NEW: Time Account command
  if (cmd === '!ta') {
    return handleTACommand(message, username);
  }
  
  sendDiscordMessage('❌ Unknown command. Type !help for available commands.');
  return { success: false, error: 'Unknown command' };
}

// ============ NEW: INCOME LOGGING (v2.1) ============

function handleIncomeCommand(message, username) {
  const parts = message.trim().split(/\s+/);
  
  if (parts.length < 3) {
    sendDiscordMessage(`❌ **Format:** !income [amount] [type] [h/w] [description]

**Types:** salary, youtube, other
**Examples:**
• !income 4200 salary h
• !income 3800 salary w
• !income 1200 youtube
• !income 50 other payback cashout`);
    return { success: false, error: 'Invalid format' };
  }
  
  // Extract amount
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
    sendDiscordMessage('❌ Could not parse amount. Use: !income 4200 salary h');
    return { success: false, error: 'No amount found' };
  }
  
  // Extract type
  let incomeType = null;
  let typeIndex = -1;
  for (let i = 1; i < parts.length; i++) {
    if (CONFIG.INCOME_TYPES[parts[i]]) {
      incomeType = parts[i];
      typeIndex = i;
      break;
    }
  }
  
  if (!incomeType) {
    sendDiscordMessage('❌ Unknown income type. Use: salary, youtube, or other');
    return { success: false, error: 'Unknown type' };
  }
  
  const typeConfig = CONFIG.INCOME_TYPES[incomeType];
  
  // Extract spender if required
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
      sendDiscordMessage(`❌ Salary requires spender (h/w). Use: !income ${amount} salary h`);
      return { success: false, error: 'Missing spender' };
    }
  }
  
  // Extract description
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
  
  // Determine month (previous month)
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthKey = Utilities.formatDate(targetMonth, CONFIG.TIMEZONE, 'yyyy-MM');
  
  // Log to SL_Income_Log
  const result = logIncomeEntry(incomeType, amount, spender, description, monthKey, username);
  
  if (result.success) {
    const spenderStr = spender ? ` (${spender})` : '';
    const updateStr = result.updated ? ' *(updated)*' : '';
    sendDiscordMessage(`✅ **Income Logged**${updateStr}
━━━━━━━━━━━━━━━━━━━━━━━━━
💰 €${amount.toFixed(2)} → ${typeConfig.label}${spenderStr}
📅 For: ${monthKey}
📝 ${description || '(no description)'}
━━━━━━━━━━━━━━━━━━━━━━━━━
Use **!income status** to see what's still missing`);
  }
  
  return result;
}

function logIncomeEntry(type, amount, spender, description, monthKey, inputter) {
  try {
    const sheet = getOrCreateIncomeSheet();
    const now = new Date();
    const timestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
    const entryId = `INC-${Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss')}`;
    
    // Check if entry already exists (update if so)
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
    sendDiscordMessage('❌ Error logging income: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

// ============ NEW: TIME ACCOUNT LOGGING (v2.1) ============

function handleTACommand(message, username) {
  const parts = message.trim().split(/\s+/);
  
  if (parts.length < 3) {
    sendDiscordMessage(`❌ **Format:** !ta [hours] [h/w]

**Examples:**
• !ta 45 h - Husband added 45 hours
• !ta 38 w - Wife added 38 hours`);
    return { success: false, error: 'Invalid format' };
  }
  
  // Extract hours
  let hours = null;
  for (let i = 1; i < parts.length; i++) {
    const num = parseFloat(parts[i].replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      hours = num;
      break;
    }
  }
  
  if (hours === null) {
    sendDiscordMessage('❌ Could not parse hours. Use: !ta 45 h');
    return { success: false, error: 'No hours found' };
  }
  
  // Extract spender
  let spender = null;
  for (let i = 1; i < parts.length; i++) {
    const alias = parts[i].toLowerCase();
    if (alias === 'h' || alias === 'w' || SPENDER_ALIASES[alias]) {
      spender = SPENDER_ALIASES[alias] || alias.toUpperCase();
      break;
    }
  }
  
  if (!spender) {
    sendDiscordMessage('❌ Please specify h or w. Use: !ta 45 h');
    return { success: false, error: 'Missing spender' };
  }
  
  // Month for previous month
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthKey = Utilities.formatDate(targetMonth, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const taType = spender === 'H' ? 'ta_h' : 'ta_w';
  const result = logTAEntry(taType, hours, spender, monthKey, username);
  
  if (result.success) {
    const label = spender === 'H' ? 'Husband' : 'Wife';
    const updateStr = result.updated ? ' *(updated)*' : '';
    sendDiscordMessage(`✅ **Time Account Logged**${updateStr}
━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ ${hours} hours → ${label}
📅 For: ${monthKey}
━━━━━━━━━━━━━━━━━━━━━━━━━
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
    sendDiscordMessage('❌ Error logging TA hours: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

// ============ NEW: INCOME STATUS CHECK (v2.1) ============

function getIncomeStatus(monthKeyOverride) {
  const now = new Date();
  const targetMonth = monthKeyOverride || Utilities.formatDate(
    new Date(now.getFullYear(), now.getMonth() - 1, 1), 
    CONFIG.TIMEZONE, 
    'yyyy-MM'
  );
  
  const sheet = getOrCreateIncomeSheet();
  const data = sheet.getDataRange().getValues();
  
  const entered = {
    'salary_h': false,
    'salary_w': false,
    'youtube': false,
    'ta_h': false,
    'ta_w': false
  };
  
  const amounts = {};
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === targetMonth) {
      const type = data[i][2];
      const amount = data[i][3];
      const spender = data[i][4];
      
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
  }
  
  const allComplete = Object.values(entered).every(v => v);
  const statusEmoji = allComplete ? '✅' : '📋';
  
  let response = `${statusEmoji} **Income Status for ${targetMonth}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  
  response += entered['salary_h'] 
    ? `✅ H Net Salary: €${amounts['salary_h'].toFixed(2)}\n`
    : `❌ H Net Salary: *missing*\n`;
    
  response += entered['salary_w']
    ? `✅ W Net Salary: €${amounts['salary_w'].toFixed(2)}\n`
    : `❌ W Net Salary: *missing*\n`;
    
  response += entered['youtube']
    ? `✅ YouTube Gross: €${amounts['youtube'].toFixed(2)}\n`
    : `❌ YouTube Gross: *missing*\n`;
    
  response += amounts['other']
    ? `✅ Other Income: €${amounts['other'].toFixed(2)}\n`
    : `➖ Other Income: €0 (assumed)\n`;
    
  response += entered['ta_h']
    ? `✅ H TA Hours: ${amounts['ta_h']} hrs\n`
    : `❌ H TA Hours: *missing*\n`;
    
  response += entered['ta_w']
    ? `✅ W TA Hours: ${amounts['ta_w']} hrs\n`
    : `❌ W TA Hours: *missing*\n`;
  
  response += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  if (!allComplete) {
    response += `

**Commands:**
• !income [amount] salary h/w
• !income [amount] youtube
• !income [amount] other [desc]
• !ta [hours] h/w`;
  } else {
    response += `

🎉 All required inputs complete!`;
  }
  
  sendDiscordMessage(response);
  return { success: true, complete: allComplete, entered: entered };
}

// ============ NEW: MONTHLY REMINDER TRIGGER (v2.1) ============

/**
 * Set up this function as a daily time-driven trigger at 8:00 AM
 * Triggers → Add Trigger → checkAndSendIncomeReminder → Time-driven → Day timer → 8am to 9am
 */
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
  if (!entered['salary_h']) missing.push('❌ H Net Salary');
  if (!entered['salary_w']) missing.push('❌ W Net Salary');
  if (!entered['youtube']) missing.push('❌ YouTube Gross');
  if (!entered['ta_h']) missing.push('❌ H TA Hours');
  if (!entered['ta_w']) missing.push('❌ W TA Hours');
  
  const reminder = `📋 **MONTHLY INCOME UPDATE NEEDED**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**${monthKey}** inputs still missing:

${missing.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Commands:**
• !income [amount] salary h/w
• !income [amount] youtube
• !ta [hours] h/w

Use **!income status** for full details`;

  sendDiscordMessage(reminder);
  Logger.log('Sent income reminder for ' + monthKey);
}

// ============ HELPER: CREATE INCOME SHEET IF NEEDED ============

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
    sendDiscordMessage('❌ **Error:** Could not parse expense.\n\n**Format:** amount merchant\n**Example:** 45 lidl');
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
    "'" + monthKey
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
    "'" + monthKey
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
  
  const geminiResult = parseWithGemini(input);
  if (geminiResult && geminiResult.amount && geminiResult.merchant) {
    return {
      amount: geminiResult.amount,
      merchant: geminiResult.merchant,
      category: geminiResult.category,
      spender: geminiResult.spender,
      date: geminiResult.date,
      description: geminiResult.description || ''
    };
  }
  
  return parseExpenseInputRegex(input);
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
          parsed.date = new Date(parsed.date);
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
  if (/\btoday\b/i.test(input)) {
    return createDate(currentYear, currentMonth, currentDay);
  }
  if (/\btomorrow\b/i.test(input)) {
    return createDate(currentYear, currentMonth, currentDay + 1);
  }
  
  let match = input.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
  if (match) {
    let year = parseInt(match[3]);
    if (year < 100) year += 2000;
    return createDate(year, parseInt(match[2]) - 1, parseInt(match[1]));
  }
  
  match = input.match(/(\d{1,2})[.\/](\d{1,2})(?!\d)/);
  if (match) {
    return createDate(currentYear, parseInt(match[2]) - 1, parseInt(match[1]));
  }
  
  const months = {
    'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
    'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5, 'jul': 6, 'july': 6,
    'aug': 7, 'august': 7, 'sep': 8, 'september': 8, 'oct': 9, 'october': 9,
    'nov': 10, 'november': 10, 'dec': 11, 'december': 11
  };
  
  match = input.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i);
  if (match) {
    return createDate(currentYear, months[match[2].toLowerCase().substring(0,3)], parseInt(match[1]));
  }
  
  match = input.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i);
  if (match) {
    return createDate(currentYear, months[match[1].toLowerCase().substring(0,3)], parseInt(match[2]));
  }
  
  return null;
}

function removeDatePatterns(input) {
  input = input.replace(/\b(yesterday|today|tomorrow)\b/gi, '');
  input = input.replace(/\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}/g, '');
  input = input.replace(/\d{1,2}[.\/]\d{1,2}(?!\d)/g, '');
  input = input.replace(/\d{1,2}(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/gi, '');
  input = input.replace(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/gi, '');
  
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

function calculateBudgetStatus(category, monthKey) {
  const spent = calculateCategorySpent(category, monthKey);
  
  const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
  const budgetData = budgetSheet.getDataRange().getValues();
  
  let budget = 0;
  for (let i = 1; i < budgetData.length; i++) {
    if (budgetData[i][0] === category) {
      budget = budgetData[i][1] || 0;
      break;
    }
  }
  
  const remaining = budget - spent;
  const percent = budget > 0 ? spent / budget : 0;
  
  let status = '🟢';
  if (percent >= 1) status = '🔴';
  else if (percent >= 0.8) status = '🟠';
  else if (percent >= 0.5) status = '🟡';
  
  return {
    category: category,
    spent: spent,
    budget: budget,
    remaining: remaining,
    percent: percent,
    status: status
  };
}

function calculateCategorySpent(category, monthKey) {
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
  const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
  const budgetData = budgetSheet.getDataRange().getValues();
  
  let response = `📊 **BUDGET STATUS** (${monthName})\n`;
  response += '```\n';
  response += 'Category              Spent    Budget   %\n';
  response += '─────────────────────────────────────────\n';
  
  let totalBudget = 0;
  let totalSpent = 0;
  
  for (let i = 1; i < budgetData.length; i++) {
    const category = budgetData[i][0];
    const budget = budgetData[i][1] || 0;
    
    if (!category) continue;
    
    const spent = calculateCategorySpent(category, monthKey);
    const percent = budget > 0 ? spent / budget : 0;
    
    let status = '🟢';
    if (percent >= 1) status = '🔴';
    else if (percent >= 0.8) status = '🟠';
    else if (percent >= 0.5) status = '🟡';
    
    const percentStr = (percent * 100).toFixed(0).padStart(3);
    const catName = category.substring(0, 18).padEnd(18);
    const spentStr = ('€' + spent.toFixed(0)).padStart(8);
    const budgetStr = ('€' + budget).padStart(8);
    
    response += `${status} ${catName} ${spentStr} ${budgetStr} ${percentStr}%\n`;
    
    totalBudget += budget;
    totalSpent += spent;
  }
  
  const totalPercent = totalBudget > 0 ? totalSpent / totalBudget : 0;
  response += '─────────────────────────────────────────\n';
  response += `   TOTAL              ${('€' + totalSpent.toFixed(0)).padStart(8)} ${('€' + totalBudget).padStart(8)} ${(totalPercent * 100).toFixed(0).padStart(3)}%\n`;
  response += '```';
  
  sendDiscordMessage(response);
  return { success: true };
}

function getBudgetLeft() {
  const monthKey = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM');
  const monthName = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'MMMM yyyy');
  const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
  const budgetData = budgetSheet.getDataRange().getValues();
  
  let response = `💰 **BUDGET REMAINING** (${monthName})\n`;
  response += '```\n';
  response += 'Category              Left     Budget  Used\n';
  response += '─────────────────────────────────────────\n';
  
  let totalBudget = 0;
  let totalSpent = 0;
  
  for (let i = 1; i < budgetData.length; i++) {
    const category = budgetData[i][0];
    const budget = budgetData[i][1] || 0;
    if (!category) continue;
    
    const spent = calculateCategorySpent(category, monthKey);
    const remaining = budget - spent;
    const percent = budget > 0 ? spent / budget : 0;
    
    let status = '🟢';
    if (percent >= 1) status = '🔴';
    else if (percent >= 0.8) status = '🟠';
    else if (percent >= 0.5) status = '🟡';
    
    const catName = category.substring(0, 18).padEnd(18);
    const remainingStr = remaining >= 0 ? ('€' + remaining.toFixed(0)).padStart(8) : ('-€' + Math.abs(remaining).toFixed(0)).padStart(8);
    const budgetStr = ('€' + budget).padStart(8);
    const percentStr = ((percent * 100).toFixed(0) + '%').padStart(4);
    
    response += `${status} ${catName} ${remainingStr} ${budgetStr} ${percentStr}\n`;
    
    totalBudget += budget;
    totalSpent += spent;
  }
  
  const totalRemaining = totalBudget - totalSpent;
  const totalPercent = totalBudget > 0 ? totalSpent / totalBudget : 0;
  response += '─────────────────────────────────────────\n';
  response += `   TOTAL              ${('€' + totalRemaining.toFixed(0)).padStart(8)} ${('€' + totalBudget).padStart(8)} ${((totalPercent * 100).toFixed(0) + '%').padStart(4)}\n`;
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
  
  let response = `📊 **YEAR TO DATE** (${year})\n`;
  response += '```\n';
  response += 'Category              Spent    Budget   %\n';
  response += '─────────────────────────────────────────\n';
  
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
    let status = '🟢';
    if (percent >= 1) status = '🔴';
    else if (percent >= 0.8) status = '🟠';
    else if (percent >= 0.5) status = '🟡';
    
    const percentStr = (percent * 100).toFixed(0).padStart(3);
    const catName = category.substring(0, 18).padEnd(18);
    const spentStr = ('€' + ytdSpent.toFixed(0)).padStart(8);
    const budgetStr = ('€' + ytdBudget.toFixed(0)).padStart(8);
    
    response += `${status} ${catName} ${spentStr} ${budgetStr} ${percentStr}%\n`;
    
    totalBudget += ytdBudget;
    totalSpent += ytdSpent;
  }
  
  const totalPercent = totalBudget > 0 ? totalSpent / totalBudget : 0;
  response += '─────────────────────────────────────────\n';
  response += `   TOTAL YTD          ${('€' + totalSpent.toFixed(0)).padStart(8)} ${('€' + totalBudget.toFixed(0)).padStart(8)} ${(totalPercent * 100).toFixed(0).padStart(3)}%\n`;
  response += '```';
  
  sendDiscordMessage(response);
  return { success: true };
}

function getTodayTransactions() {
  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const data = sheet.getDataRange().getValues();
  
  let response = `📅 **Today's Transactions** (${today})\n─────────────────────────────\n`;
  let total = 0;
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    const txnDate = Utilities.formatDate(new Date(data[i][2]), CONFIG.TIMEZONE, 'yyyy-MM-dd');
    if (txnDate === today) {
      const amount = data[i][3];
      const merchant = data[i][4];
      const category = data[i][6];
      response += `€${amount.toFixed(2)} - ${merchant} (${category})\n`;
      total += amount;
      count++;
    }
  }
  
  if (count === 0) {
    response += '✨ No transactions yet today';
  } else {
    response += `─────────────────────────────\n**Total:** €${total.toFixed(2)} (${count} transactions)`;
  }
  
  sendDiscordMessage(response);
  return { success: true };
}

function getWeekTransactions() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const sheet = getSheet(CONFIG.SHEETS.LEDGER);
  const data = sheet.getDataRange().getValues();
  
  let response = '📆 **This Week\'s Transactions**\n─────────────────────────────\n';
  let total = 0;
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    const txnDate = new Date(data[i][2]);
    if (txnDate >= weekAgo) {
      const amount = data[i][3];
      const merchant = data[i][4];
      const category = data[i][6];
      const dateStr = Utilities.formatDate(txnDate, CONFIG.TIMEZONE, 'MM-dd');
      response += `${dateStr}: €${amount.toFixed(2)} - ${merchant} (${category})\n`;
      total += amount;
      count++;
    }
  }
  
  if (count === 0) {
    response += '✨ No transactions this week';
  } else {
    response += `─────────────────────────────\n**Total:** €${total.toFixed(2)} (${count} transactions)`;
  }
  
  sendDiscordMessage(response);
  return { success: true };
}

function handleUndo(username) {
  const props = PropertiesService.getScriptProperties();
  const lastTxnId = props.getProperty('last_txn_id');
  const lastTxnTime = parseInt(props.getProperty('last_txn_time') || '0');
  
  if (!lastTxnId) {
    sendDiscordMessage('❌ No recent transaction to undo.');
    return { success: false };
  }
  
  const now = new Date().getTime();
  if (now - lastTxnTime > 10 * 60 * 1000) {
    sendDiscordMessage('❌ Last transaction is older than 10 minutes. Cannot undo.');
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
    sendDiscordMessage('❌ Transaction not found in sheet.');
    return { success: false };
  }
  
  props.setProperty('pending_undo', lastTxnId);
  props.setProperty('pending_undo_row', txnDetails.row.toString());
  
  const minutesAgo = Math.round((now - lastTxnTime) / 60000);
  sendDiscordMessage(`⚠️ **Delete this transaction?**
─────────────────────────────
€${txnDetails.amount.toFixed(2)} - ${txnDetails.merchant} (${txnDetails.category})
Logged ${minutesAgo} min ago
─────────────────────────────
Reply **!undo confirm** to delete`);
  
  return { success: true };
}

function executeUndo(username) {
  const props = PropertiesService.getScriptProperties();
  const pendingUndo = props.getProperty('pending_undo');
  
  if (!pendingUndo) {
    sendDiscordMessage('❌ No pending undo. Use !undo first.');
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
      sendDiscordMessage('❌ Transaction not found. May have been already deleted.');
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
    
    sendDiscordMessage(`✦ Deleted transaction ${pendingUndo}`);
    return { success: true };
  } catch (e) {
    sendDiscordMessage('❌ Error deleting: ' + e.toString());
    return { success: false };
  }
}

// ============ FORMATTING ============

function formatExpenseResponse(parsed, category, spender, categorization, budgetStatus) {
  const catTag = categorization === 'ai' ? '(ai ⚠️)' : '(user)';
  
  return `✅ **Logged:** €${parsed.amount.toFixed(2)} → ${category}
📍 Merchant: ${parsed.merchant}
👤 Spender: ${spender}
🏷️ Category: ${category} ${catTag}

─────────────────────────────
📊 **BUDGET STATUS**
─────────────────────────────
**${category}:** €${budgetStatus.spent.toFixed(0)}/€${budgetStatus.budget} (${(budgetStatus.percent * 100).toFixed(0)}%) ${budgetStatus.status}
─────────────────────────────`;
}

// ============ DISCORD ============

function sendDiscordMessage(content) {
  const config = getConfigValues();
  const webhookUrl = config.discord_webhook_url;
  
  if (!webhookUrl) {
    Logger.log('No webhook URL configured');
    return;
  }
  
  const payload = {
    content: content
  };
  
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

// ============ UTILITIES ============

function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

function getConfigValues() {
  const sheet = getSheet(CONFIG.SHEETS.CONFIG);
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

function getExpenseBreakdown(month) {
  try {
    const ledgerSheet = getSheet(CONFIG.SHEETS.LEDGER);
    const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
    
    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 0);
    
    const ledgerData = ledgerSheet.getDataRange().getValues();
    const categoryTotals = {};
    
    CONFIG.CATEGORIES.forEach(cat => {
      categoryTotals[cat] = 0;
    });
    
    for (let i = 1; i < ledgerData.length; i++) {
      const txnDate = new Date(ledgerData[i][2]);
      const amount = ledgerData[i][3] || 0;
      const category = ledgerData[i][6];
      
      if (txnDate >= monthStart && txnDate <= monthEnd) {
        if (categoryTotals.hasOwnProperty(category)) {
          categoryTotals[category] += amount;
        } else {
          categoryTotals[category] = amount;
        }
      }
    }
    
    const budgetData = budgetSheet.getDataRange().getValues();
    const monthKeyAlt = month;
    
    const budgetMap = {};
    for (let i = 1; i < budgetData.length; i++) {
      const category = budgetData[i][0];
      const budget = budgetData[i][1] || 0;
      let storedMonthKey = budgetData[i][2] || '';
      
      if (typeof storedMonthKey === 'string') {
        storedMonthKey = storedMonthKey.replace(/^'/, '');
      }
      
      if (storedMonthKey === monthKeyAlt || storedMonthKey === month) {
        budgetMap[category] = budget;
      }
    }
    
    const categories = [];
    let totalSpent = 0;
    let totalBudget = 0;
    
    CONFIG.CATEGORIES.forEach(cat => {
      const spent = Math.round(categoryTotals[cat] * 100) / 100;
      const budget = budgetMap[cat];
      const hasBudget = budget !== undefined;
      const percent = hasBudget && budget > 0 ? Math.round((spent / budget) * 100) : null;
      
      categories.push({
        name: cat,
        spent: spent,
        budget: hasBudget ? budget : null,
        percent: percent,
        status: getStatusEmojiDashboard(percent)
      });
      
      totalSpent += spent;
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
        transaction_count: countTransactionsInMonth(ledgerData, monthStart, monthEnd),
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
  if (percent >= 100) return '🔴';
  if (percent >= 80) return '🟠';
  if (percent >= 50) return '🟡';
  return '🟢';
}

function getMonthName(monthNum) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNum - 1] || 'Unknown';
}

function countTransactionsInMonth(ledgerData, monthStart, monthEnd) {
  let count = 0;
  for (let i = 1; i < ledgerData.length; i++) {
    const txnDate = new Date(ledgerData[i][2]);
    if (txnDate >= monthStart && txnDate <= monthEnd) {
      count++;
    }
  }
  return count;
}

// ============ TEST FUNCTIONS ============

function testExpenseBreakdown() {
  const now = new Date();
  const month = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM');
  
  const result = getExpenseBreakdown(month);
  const content = result.getContent();
  const data = JSON.parse(content);
  
  Logger.log('Test month: ' + month);
  Logger.log('Success: ' + data.success);
  Logger.log('Categories: ' + data.categories.length);
  Logger.log('Total Spent: €' + data.summary.total_spent);
  Logger.log('Budget Available: ' + data.summary.budget_available);
  
  Logger.log('\nTop 3 Categories:');
  data.categories.slice(0, 3).forEach(cat => {
    Logger.log(`  ${cat.name}: €${cat.spent} / €${cat.budget || 'N/A'} (${cat.percent || 'N/A'}%)`);
  });
}

function testIncomeStatus() {
  const result = getIncomeStatus();
  Logger.log('Income status test complete');
}