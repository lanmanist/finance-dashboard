/**
 * ShadowLedger - Google Apps Script
 * Version: 2.0.0
 * Date: 2025-12-17
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
  SPREADSHEET_ID: '1mrMCTbgPxjxbkHepDiQk_ddN0cbJ-A-GWWtwt3wOgSU', // ADD YOUR SPREADSHEET ID HERE
  SHEETS: {
    LEDGER: 'ShadowLedger',
    BUDGET: 'SL_Budget',
    PATTERNS: 'SL_Patterns',
    CONFIG: 'SL_Config'
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
  ]
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
  
  if (action === 'test') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'ShadowLedger API v2.0.0 is running',
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'ShadowLedger API v2.0.0'
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
  const categorySpending = {}; // Track spending per category
  
  for (const line of lines) {
    try {
      const result = logExpenseSilent(line, username);
      if (result.success) {
        successCount++;
        totalAmount += result.amount;
        results.push(`✦ €${result.amount.toFixed(2)} → ${result.category}`);
        // Aggregate by category
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
  
  // Build budget status for affected categories
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
    const helpText = `**ShadowLedger v2 Commands**

📍 **Logging (flexible format):**
Any order works! Examples:
• 45 rewe
• rewe 45€ wife yesterday
• 27 lidl 01.03 husband
• football ticket 25 anh

📦 **Multi-line batch:**
Use Shift+Enter for line breaks, then:
45 rewe
30 lidl
15 dm
→ Logs all 3 at once!

👤 **Spender names:**
H: h, husband, nha, anh, aaron
W: w, wife, trang, chang, em

📆 **Dates:**
yesterday, today, tomorrow
06.03, 6/3, march 6, 6th march

📋 **Commands:**
!status - Monthly budget table
!budgetleft - Remaining budget
!ytd - Year to date table
!today - Today's expenses
!week - This week's expenses
!undo - Delete last transaction
!help - Show this message`;
    sendDiscordMessage(helpText);
    return { success: true };
  }
  
  if (cmd === '!status') {
    return getBudgetStatus();
  }
  
  // Feature #8: !budgetleft command
  if (cmd === '!budgetleft') {
    return getBudgetLeft();
  }
  
  // Feature #4: !ytd command
  if (cmd === '!ytd') {
    return getYTDStatus();
  }
  
  if (cmd === '!today') {
    return getTodayTransactions();
  }
  
  if (cmd === '!week') {
    return getWeekTransactions();
  }
  
  // Feature #9: !undo command
  if (cmd === '!undo') {
    if (parts.length > 1 && parts[1] === 'confirm') {
      return executeUndo(username);
    }
    return handleUndo(username);
  }
  
  sendDiscordMessage('❌ Unknown command. Type !help for available commands.');
  return { success: false, error: 'Unknown command' };
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
  // Create timezone-aware timestamps
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
  
  // Feature #9: Store last transaction for undo
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

// Silent version for multi-transaction (no Discord message per line)
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
  // Create timezone-aware timestamps
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
  
  // Store last transaction for undo
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
  
  // Feature #5: Try Gemini first for flexible parsing
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
  
  // Fallback to regex parsing
  return parseExpenseInputRegex(input);
}

// Regex-based parsing (fallback)
function parseExpenseInputRegex(input) {
  // Extract amount - prioritize numbers with € or e symbol, then standalone numbers
  // Avoid matching date parts like "01" or "03" from "01.03"
  
  // Strategy: First remove date patterns temporarily, find amount, then restore
  const datePatterns = [];
  let cleanInput = input.replace(/\d{1,2}[.\/]\d{1,2}([.\/]\d{2,4})?/g, (match) => {
    datePatterns.push(match);
    return `__DATE${datePatterns.length - 1}__`;
  });
  
  // Try with € or e suffix first (18€, 18e, 18.50€, 18,50e) - e must not be followed by letters
  let amountMatch = cleanInput.match(/(\d+(?:[.,]\d+)?)\s*[€e](?![a-df-z])/i);
  if (!amountMatch) {
    amountMatch = cleanInput.match(/(?:^|\s)(\d+(?:[.,]\d+)?)/); // Any standalone number
  }
  if (!amountMatch) return null;
  
  const amount = parseFloat(amountMatch[1].replace(',', '.'));
  
  // Remove amount from original input (not cleanInput)
  // Find and remove the amount value + optional euro symbol from original
  const amountStr = amountMatch[1];
  input = input.replace(new RegExp('(^|\\s)' + amountStr.replace('.', '\\.').replace(',', '\\,') + '\\s*[€e]?(?![a-df-z])', 'i'), '$1').trim();
  
  // Feature #1: Extended spender aliases
  // Must be standalone word with space separation (not part of another word)
  let spender = null;
  const aliasPattern = Object.keys(SPENDER_ALIASES).join('|');
  const spenderRegex = new RegExp(`(?:^|\\s)(${aliasPattern})(?:\\s|$)`, 'i');
  const spenderMatch = input.match(spenderRegex);
  if (spenderMatch) {
    spender = SPENDER_ALIASES[spenderMatch[1].toLowerCase()];
    // Remove only the alias word, preserve surrounding structure
    input = input.replace(new RegExp(`(?:^|\\s)${spenderMatch[1]}(?:\\s|$)`, 'i'), ' ').trim();
  }
  
  // Feature #6: Enhanced date parsing
  let date = parseDate(input);
  if (date) {
    // Remove date patterns from input
    input = removeDatePatterns(input);
  }
  
  // Check for explicit category
  let category = null;
  for (const cat of CONFIG.CATEGORIES) {
    const catLower = cat.toLowerCase();
    if (input.toLowerCase().includes(catLower)) {
      category = cat;
      input = input.replace(new RegExp(catLower, 'i'), '').trim();
      break;
    }
  }
  
  // Remaining is merchant
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

// Feature #5: Gemini-powered flexible parsing
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

// Feature #6: Enhanced date parsing
function parseDate(input) {
  // Get current date in Berlin timezone
  const now = new Date();
  const berlinNow = new Date(Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss"));
  const todayStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const todayParts = todayStr.split('-');
  const currentYear = parseInt(todayParts[0]);
  const currentMonth = parseInt(todayParts[1]) - 1;
  const currentDay = parseInt(todayParts[2]);
  
  // Create a date at noon in Berlin timezone to avoid DST issues
  function createDate(year, month, day) {
    // Create date string and parse it properly for the timezone
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`;
    return new Date(Utilities.formatDate(new Date(dateStr), CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss"));
  }
  
  // Relative dates
  if (/\byesterday\b/i.test(input)) {
    return createDate(currentYear, currentMonth, currentDay - 1);
  }
  if (/\btoday\b/i.test(input)) {
    return createDate(currentYear, currentMonth, currentDay);
  }
  if (/\btomorrow\b/i.test(input)) {
    return createDate(currentYear, currentMonth, currentDay + 1);
  }
  
  // DD.MM.YYYY or DD/MM/YYYY or DD.MM.YY
  let match = input.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
  if (match) {
    let year = parseInt(match[3]);
    if (year < 100) year += 2000;
    return createDate(year, parseInt(match[2]) - 1, parseInt(match[1]));
  }
  
  // DD.MM or DD/MM (current year)
  match = input.match(/(\d{1,2})[.\/](\d{1,2})(?!\d)/);
  if (match) {
    return createDate(currentYear, parseInt(match[2]) - 1, parseInt(match[1]));
  }
  
  // Month names
  const months = {
    'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
    'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5, 'jul': 6, 'july': 6,
    'aug': 7, 'august': 7, 'sep': 8, 'september': 8, 'oct': 9, 'october': 9,
    'nov': 10, 'november': 10, 'dec': 11, 'december': 11
  };
  
  // "6 march", "6th march"
  match = input.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i);
  if (match) {
    return createDate(currentYear, months[match[2].toLowerCase().substring(0,3)], parseInt(match[1]));
  }
  
  // "march 6"
  match = input.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i);
  if (match) {
    return createDate(currentYear, months[match[1].toLowerCase().substring(0,3)], parseInt(match[2]));
  }
  
  return null;
}

function removeDatePatterns(input) {
  // Remove relative dates
  input = input.replace(/\b(yesterday|today|tomorrow)\b/gi, '');
  
  // Remove DD.MM.YYYY or DD/MM/YYYY
  input = input.replace(/\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}/g, '');
  
  // Remove DD.MM or DD/MM
  input = input.replace(/\d{1,2}[.\/]\d{1,2}(?!\d)/g, '');
  
  // Remove month name patterns
  input = input.replace(/\d{1,2}(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/gi, '');
  input = input.replace(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/gi, '');
  
  return input.replace(/\s+/g, ' ').trim();
}

// ============ CATEGORIZATION ============

function categorizeExpense(merchant) {
  // First try pattern matching (fast)
  const patterns = getSheet(CONFIG.SHEETS.PATTERNS);
  const data = patterns.getDataRange().getValues();
  
  const merchantLower = merchant.toLowerCase();
  for (let i = 1; i < data.length; i++) {
    const pattern = (data[i][0] || '').toLowerCase();
    if (pattern && merchantLower.includes(pattern)) {
      return data[i][1];
    }
  }
  
  // Feature #7: Pattern not found - try Gemini AI
  const aiCategory = aiCategorize(merchant);
  if (aiCategory) {
    return aiCategory;
  }
  
  return 'Buffer';
}

// Feature #7: Gemini AI categorization
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
  
  // Remove apostrophe prefix from search key if present
  const searchKey = monthKey.replace(/^'/, '');
  
  let total = 0;
  for (let i = 1; i < data.length; i++) {
    let storedKey = data[i][14];
    // Handle apostrophe prefix in stored values
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

// Feature #3: Enhanced !status with percentages (table format)
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

// Feature #8: !budgetleft command (table format)
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

// Feature #4: !ytd command
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
      // Handle apostrophe prefix (stored as '2025-12 to force text format)
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

// Feature #9: !undo command
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
    
    // Re-find the row by transaction ID (row numbers can shift)
    let rowToDelete = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === pendingUndo) {
        rowToDelete = i + 1; // Sheet rows are 1-indexed
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
