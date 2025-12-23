# ShadowLedger Module - Unified Blueprint

```yaml
version: v2.0.0
last_updated: 2025-12-17 23:30:00 UTC+2
status: Production (Full MVP)
parent_system: Aaron Family Financial Model v6.1
deployment: Live (Cloudflare + Render.com)
cost: 0/month (100% serverless)
```

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Data Schema](#3-data-schema)
4. [Expense Logging](#4-expense-logging)
5. [Budget Monitoring](#5-budget-monitoring)
6. [Discord Integration](#6-discord-integration)
7. [Implementation Details](#7-implementation-details)
8. [Deployment Guide](#8-deployment-guide)
9. [Roadmap](#9-roadmap)
10. [Maintenance & Operations](#10-maintenance--operations)

---

## 1. EXECUTIVE SUMMARY

### 1.1 What Is ShadowLedger?

ShadowLedger is a **Discord-based expense tracking module** integrated into the Aaron Family Financial Model. It enables real-time transaction logging via simple Discord messages with automatic categorization and live budget monitoring.

**Core Value Proposition:**
- Log expenses in 5 seconds from mobile: `45 rewe`
- No app needed - just Discord (already on phones)
- Real-time budget feedback on every transaction
- Multi-user support (Husband/Wife)
- Zero monthly cost (100% serverless)
- AI-powered flexible input parsing

### 1.2 Current Status: Full Production MVP

**✅ ALL MVP FEATURES IMPLEMENTED (v2.0.0):**
- Discord message parsing with flexible input formats
- Gemini AI-powered categorization and parsing
- Pattern-based categorization (58 built-in merchants)
- Real-time budget tracking with color-coded alerts
- Multi-user spender tracking (H/W) with extended aliases
- Multi-transaction support (batch logging)
- Full command suite (!help, !status, !today, !week, !ytd, !budgetleft, !undo)
- Enhanced date parsing (yesterday, DD.MM, natural language)
- Google Sheets backend integration
- Cloudflare + Render.com architecture (migrated from Pipedream)

**🎯 Completed Roadmap Items (1-9):**
1. ✅ Extended spender aliases (h/w/husband/wife/nha/anh/aaron/trang/chang/em)
2. ✅ Multi-transaction per message support
3. ✅ Enhanced !status with percentages
4. ✅ !ytd command (year-to-date spending)
5. ✅ Smart flexible input parsing (Gemini-powered)
6. ✅ Enhanced date parsing (multiple formats)
7. ✅ Gemini AI categorization
8. ✅ !budgetleft command
9. ✅ !undo command with confirmation

### 1.3 Technology Stack

| Component | Technology | Cost | Status |
|-----------|------------|------|--------|
| Backend | Google Apps Script v2.0 | Free | ✅ Live |
| Database | Google Sheets | Free | ✅ Live |
| Interface | Discord Bot + Webhook | Free | ✅ Live |
| Bot Host | Render.com Web Service | Free | ✅ Live |
| Relay | Cloudflare Workers | Free | ✅ Live |
| AI Parser | Gemini API | Free tier | ✅ Live |
| Hosting | Google Cloud (via Apps Script) | Free | ✅ Live |

**Total Monthly Cost: €0**

**Architecture Migration:**
- **Previous:** Discord → Pipedream → Apps Script
- **Current:** Discord → Render.com Bot → Cloudflare Worker → Apps Script
- **Reason:** Pipedream rate limits exceeded; new stack provides 100x capacity

### 1.4 Key Metrics

- **Response Time:** <5 seconds (full chain latency)
- **Budget Categories:** 17 (4,090/month total)
- **Built-in Patterns:** 58 merchant mappings
- **Supported Users:** 2 (H/W with cross-recording)
- **Uptime:** 24/7 (serverless architecture)
- **Daily Capacity:** 100,000 requests (Cloudflare free tier)
- **Monthly Uptime:** 750 hours (Render.com free tier, 24/7 coverage with keep-alive)

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Flow (Current: Cloudflare + Render)

```
=
                     SHADOWLEDGER v2.0 ARCHITECTURE                        

                                                                           
  USER (Mobile/Desktop)                                                    
                                                                          
  =                                                    
      Discord         "45 rewe"                                         
     #expenses                                                          
                                                      
            WebSocket (real-time)                                        
  =               
            Discord Bot (Render.com)                                    
    €¢ Node.js + discord.js                                             
    €¢ Listens to #expenses channel                                      
    €¢ Keep-alive HTTP server (prevents sleep)                           
    €¢ 750 hrs/month free (24/7 coverage)                                
                 
            POST /forward                                                
  =               
          Cloudflare Worker (Relay)                                     
    €¢ Edge computing (global, <50ms)                                    
    €¢ 100K requests/day free                                            
    €¢ Logging & monitoring dashboard                                    
    €¢ Flexible config via env vars                                      
                 
            POST to Apps Script                                          
  =
          Google Apps Script v2.0 (Backend Logic)                        
    =  
     Gemini AI (Optional)                                              
     €¢ Smart input parsing                                             
     €¢ Natural language categorization                                 
     €¢ Fallback to regex if unavailable                                
      
    =  
     Pattern Matching                                                   
     €¢ 58 merchant patterns                                            
     €¢ Category mappings                                               
      
    =  
     Transaction Processing                                             
     €¢ Parse amount, merchant, date, spender                           
     €¢ Multi-transaction support                                       
     €¢ Generate unique IDs                                             
      
  
             Write to Sheet                                               
  =               
            Google Sheets (Database)                                    
    €¢ ShadowLedger (transactions)                                       
    €¢ SL_Budget (budget tracking)                                       
    €¢ SL_Patterns (merchant rules)                                      
    €¢ SL_Config (settings & API keys)                                   
                 
            Calculate budget status                                      
  =               
            Apps Script Response                                        
    €¢ Format budget status                                              
    €¢ Color-coded alerts                                                
    €¢ Multi-transaction summaries                                       
                 
            POST to Discord Webhook                                      
  =               
            Discord Response                                            
    €¢ Transaction confirmation                                          
    €¢ Budget status update                                              
    €¢ Emoji indicators (🟢🟡🟠🔴)                                         
                 
                                                                           

```

### 2.2 Migration from Pipedream to Cloudflare + Render

**Previous Architecture (v1.0):**
```
Discord → Pipedream Workflow → Apps Script
```

**Problems with Pipedream:**
- Daily invocation limits exceeded (~100/day)
- Monthly limits too restrictive (~1,000/month)
- Typical family usage: 20-50 transactions/day
- Commands and queries counted against limits

**New Architecture (v2.0):**
```
Discord → Render.com Bot → Cloudflare Worker → Apps Script
```

**Advantages:**
- **100x capacity increase:** Cloudflare 100K/day vs Pipedream 100/day
- **24/7 uptime:** Render.com free tier provides 750 hrs/month
- **Keep-alive mechanism:** HTTP health checks prevent service sleep
- **Better monitoring:** Cloudflare dashboard shows all requests
- **Flexibility:** Can change Apps Script URL without redeploying bot
- **Still 0/month:** All services remain free

**Migration Guide:** See `ShadowLedger_Cloudflare_Migration_Guide_v4.md` in project files

### 2.3 Component Details

#### Discord Bot (Render.com)
- **Language:** Node.js
- **Library:** discord.js v14
- **Hosting:** Render.com Web Service (free tier)
- **Features:**
  - MESSAGE CONTENT INTENT enabled (reads message text)
  - Keep-alive HTTP server on port 10000
  - Self-ping every 14 minutes to prevent sleep
  - Channel filtering (#expenses only)
  - Forwards messages to Cloudflare Worker

#### Cloudflare Worker (Relay)
- **Runtime:** Cloudflare Workers (V8 isolate)
- **Purpose:** Relay messages to Apps Script
- **Configuration:** Apps Script URL stored as environment variable
- **Monitoring:** Cloudflare dashboard logs all requests
- **Limits:** 100,000 requests/day on free tier

#### Google Apps Script (Backend)
- **Version:** 2.0.0
- **File:** `ShadowLedger_v2.gs`
- **Key Functions:**
  - `doPost()`: Main entry point from Cloudflare
  - `processDiscordMessage()`: Route to command or expense handler
  - `parseExpenseInput()`: Gemini AI or regex parsing
  - `logExpense()`: Write transaction to sheet
  - `categorizeExpense()`: Gemini AI or pattern matching
  - Command handlers: !status, !ytd, !budgetleft, !undo, etc.

---

## 3. DATA SCHEMA

### 3.1 Google Sheets Structure

**Sheet:** `FinanceSource_v6.1.xlsx`

**Tabs Used by ShadowLedger:**
1. **ShadowLedger** - Transaction log
2. **SL_Budget** - Monthly budget tracking
3. **SL_Patterns** - Merchant-to-category mappings
4. **SL_Config** - System configuration

### 3.2 ShadowLedger Tab (Transaction Log)

| Column | Name | Type | Example | Description |
|--------|------|------|---------|-------------|
| A | txn_id | Text | SL-20251217-143025-742 | Unique transaction ID |
| B | created_at | Datetime | 2025-12-17T14:30:25 | Timestamp (Europe/Berlin) |
| C | txn_date | Date | 2025-12-17 | Transaction date |
| D | amount | Number | 45.00 | Amount in EUR |
| E | merchant | Text | Rewe | Merchant name |
| F | merchant_orig | Text | rewe | Original input text |
| G | category | Text | Groceries + Food | Budget category |
| H | categorization | Text | pattern | "pattern", "ai", or "user" |
| I | spender | Text | H | Who spent (H or W) |
| J | inputter | Text | W | Who logged (H or W) |

**Transaction ID Format:** `SL-YYYYMMDD-HHmmss-XXX`
- `YYYYMMDD`: Date (e.g., 20251217)
- `HHmmss`: Time with seconds (e.g., 143025)
- `XXX`: 3-digit random suffix (prevents collisions)

**Note:** Changed from v1.0 format `SL-YYYYMMDD-HHMM` per ADR-012

### 3.3 SL_Budget Tab

| Column | Name | Type | Example | Description |
|--------|------|------|---------|-------------|
| A | category | Text | Groceries + Food | Category name |
| B | budget | Number | 600 | Monthly budget in EUR |
| C | month_key | Text | '2025-12 | Month identifier (apostrophe prefix) |
| D | spent | Formula | =SUMIFS(...) | Calculated spending |
| E | remaining | Formula | =B2-D2 | Budget remaining |
| F | percent | Formula | =D2/B2 | Percentage used |

**Formula Example (Column D - spent):**
```excel
=SUMIFS(ShadowLedger!D:D, ShadowLedger!G:G, A2, ShadowLedger!C:C, ">="&DATE(YEAR(C2),MONTH(C2),1), ShadowLedger!C:C, "<"&DATE(YEAR(C2),MONTH(C2)+1,1))
```

### 3.4 SL_Patterns Tab

| Column | Name | Type | Example | Description |
|--------|------|------|---------|-------------|
| A | pattern | Text (lowercase) | rewe | Merchant keyword |
| B | category | Text | Groceries + Food | Target category |

**Built-in Patterns (58 total):**
- **Groceries:** rewe, lidl, edeka, aldi, netto, penny, kaufland
- **Fuel:** shell, aral, esso, total, jet, star
- **Food Delivery:** lieferando, wolt, uber eats, deliveroo
- **Restaurants:** mcdonald, burger king, subway, kfc, pizza
- **Shopping:** amazon, zalando, h&m, zara, dm, rossmann
- **Utilities:** vodafone, telekom, o2, 1&1
- **Transport:** db, deutsche bahn, uber, bolt, tier
- And more...

### 3.5 SL_Config Tab

| Column | Name | Type | Example | Description |
|--------|------|------|---------|-------------|
| A | key | Text | discord_webhook_url | Configuration key |
| B | value | Text | https://discord.com/... | Configuration value |

**Required Keys:**
- `discord_webhook_url`: Discord incoming webhook for responses
- `h_discord_username`: Husband's Discord username
- `w_discord_username`: Wife's Discord username
- `gemini_api_key`: Gemini API key (optional, for AI features)

**Get Gemini API Key:** https://aistudio.google.com/app/apikey

---

## 4. EXPENSE LOGGING

### 4.1 Input Formats (Flexible Order)

**Basic Format:**
```
amount merchant [spender] [date]
```

**All these work (any order):**
```
45 rewe
rewe 45
45 rewe
rewe 45
18e rewe          # 'e' accepted as euro symbol
45 rewe w
45 rewe wife
w 45 rewe
wife rewe 45
45 rewe yesterday
45 rewe 15.12
45 rewe w 15.12
rewe 45 wife yesterday
football ticket 25 anh
```

**Multi-Transaction (Batch Logging):**
```
45 rewe
30 lidl
15 dm
```
Press Shift+Enter for new lines in Discord, then send. All transactions logged at once with summary.

### 4.2 Spender Aliases (Extended in v2.0)

| Spender | Aliases |
|---------|---------|
| **H** (Husband) | h, husband, nha, anh, aaron |
| **W** (Wife) | w, wife, trang, chang, em |

**Detection:** Space-separated word matching (not word boundary to avoid "rewe w" → "ree")

**Default:** If no spender specified, uses inputter's identity (H or W based on Discord username)

### 4.3 Date Parsing (Enhanced in v2.0)

**Supported Formats:**
- **Relative:** yesterday, today, tomorrow
- **Day.Month:** 15.12, 06.03, 1.1
- **Month/Day:** 12/15, 3/6, 1/1
- **Natural:** march 6, 6th march, december 15

**Future:** Full DD/MM/YYYY support (planned)

### 4.4 Parsing Logic (Gemini AI + Regex Fallback)

**Primary Parser: Gemini AI (if API key configured)**
```javascript
function parseWithGemini(input) {
  // Sends input to Gemini with schema instructions
  // Returns: { amount, merchant, spender, date }
  // Handles any natural language order
}
```

**Fallback Parser: Regex (if Gemini unavailable)**
```javascript
function parseExpenseInputRegex(input) {
  // 1. Extract spender aliases (if present)
  // 2. Extract date keywords/patterns (if present)
  // 3. Extract amount (, e, or plain number)
  // 4. Extract merchant (remaining text)
}
```

**Euro Symbol Flexibility (ADR-017):**
- Accepts both `` and `e` as currency indicator
- Constraint: `e` must not be followed by letters (avoids "rewe" → "rew")

### 4.5 Categorization Logic

**Primary: Gemini AI (if API key configured)**
```javascript
function categorizeWithGemini(merchant) {
  // Sends merchant name to Gemini
  // Returns category from predefined list
}
```

**Fallback: Pattern Matching**
```javascript
function categorizeExpense(merchant) {
  // 1. Check SL_Patterns sheet for exact/partial match
  // 2. If no match, return "Buffer" (uncategorized)
}
```

**Categorization Field:**
- `pattern`: Matched via SL_Patterns
- `ai`: Categorized via Gemini AI
- `user`: Manually specified in input

### 4.6 Transaction Storage

**Timestamp Handling (ADR-016):**
All timestamps formatted as `yyyy-MM-dd'T'HH:mm:ss` before writing to sheet to prevent UTC misinterpretation.

```javascript
const now = new Date();
const nowFormatted = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
const txnDate = Utilities.formatDate(txnDateObj, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");

sheet.appendRow([
  txnId,
  nowFormatted,   // Not raw Date object
  txnDate,        // Not raw Date object
  amount,
  merchant,
  merchantOrig,
  category,
  categorization,
  spender,
  inputter
]);
```

---

## 5. BUDGET MONITORING

### 5.1 Real-Time Budget Calculation

**After Every Transaction:**
```javascript
function calculateBudgetStatus(category, monthKey) {
  // 1. Get budget for category from SL_Budget
  // 2. Sum all expenses for category in current month
  // 3. Calculate spent/budget percentage
  // 4. Return status emoji based on threshold
}
```

**Status Thresholds:**
- 🟢 Green: 0-49% of budget used
- 🟡 Yellow: 50-79% of budget used
- 🟠 Orange: 80-99% of budget used
- 🔴 Red: 100%+ of budget used (over budget)

### 5.2 Budget Response Format

**Single Transaction:**
```
✅ **Logged:** 45.00 → Groceries + Food
 Merchant: Rewe
 Spender: H
 Category: Groceries + Food (pattern)


📊 **BUDGET STATUS**

**Groceries + Food:** 245/600 (41%) 🟢

```

**Multi-Transaction:**
```
 **BATCH LOGGED** (3/3)

✅ 45.00 → Groceries + Food
✅ 30.00 → Groceries + Food
✅ 15.00 → Shopping

**Total:** 90.00

📊 **Budget Status:**
🟢 Groceries + Food: 320/600 (53%)
🟢 Shopping: 145/400 (36%)
```

---

## 6. DISCORD INTEGRATION

### 6.1 Discord Bot Setup (Render.com)

**Prerequisites:**
1. Discord Developer Portal application
2. Bot created with MESSAGE CONTENT INTENT enabled
3. Bot invited to server with appropriate permissions

**Bot Code Structure (index.js):**
```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent  // Critical!
  ]
});

client.on('messageCreate', async (message) => {
  // Filter: only #expenses, not from bots
  if (message.channel.name !== EXPENSE_CHANNEL_NAME) return;
  if (message.author.bot) return;
  
  // Forward to Cloudflare Worker
  await forwardToCloudflare(message);
});

// Keep-alive HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime() }));
  }
});

// Self-ping every 14 minutes to prevent Render.com sleep
setInterval(() => {
  fetch(`${RENDER_EXTERNAL_URL}/health`);
}, 14 * 60 * 1000);
```

**Environment Variables (Render.com):**
- `DISCORD_BOT_TOKEN`: Bot token from Discord Developer Portal
- `CLOUDFLARE_WORKER_URL`: Cloudflare Worker URL
- `EXPENSE_CHANNEL_NAME`: Channel name (e.g., "expenses")
- `RENDER_EXTERNAL_URL`: Own service URL (for keep-alive)

### 6.2 Cloudflare Worker (Relay)

**Worker Code:**
```javascript
export default {
  async fetch(request, env) {
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        service: 'ShadowLedger Relay',
        status: 'running'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (request.method === 'POST') {
      const data = await request.json();
      
      // Forward to Apps Script
      const response = await fetch(env.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      return new Response(await response.text(), {
        status: response.status,
        headers: response.headers
      });
    }
  }
}
```

**Environment Variable (Cloudflare):**
- `APPS_SCRIPT_URL`: Google Apps Script Web App URL

### 6.3 Command Interface

**Command Format:** `!command [args]`

| Command | Description | Example |
|---------|-------------|---------|
| `!help` | Show all commands and usage | `!help` |
| `!status` | Monthly budget table (17 categories) | `!status` |
| `!budgetleft` | Remaining budget summary | `!budgetleft` |
| `!ytd` | Year-to-date spending table | `!ytd` |
| `!today` | Today's transactions | `!today` |
| `!week` | This week's transactions | `!week` |
| `!undo` | Delete last transaction (10min window) | `!undo` |
| `!undo confirm` | Confirm deletion | `!undo confirm` |

**Command Examples:**

**!status Output:**
```
📊 **BUDGET STATUS** (December 2025)

   Category          Spent  Budget   %

🟢 Childcare           245    350  70%
🟡 Groceries + Food    487    600  81%
🔴 Shopping            420    400 105%
...

   TOTAL            3,847  4,090  94%
```

**!ytd Output:**
```
 **YEAR TO DATE** (2025)

   Category            YTD  Budget   %

🟢 Childcare         2,940  4,200  70%
🟠 Groceries + Food  6,847  7,200  95%
🔴 Shopping          5,120  4,800 107%
...

   TOTAL YTD       45,234 49,080  92%
```

**!undo Flow:**
```
User: !undo

Bot:  **Delete this transaction?**

45.00 - Rewe (Groceries + Food)
Logged 3 min ago

Reply **!undo confirm** to delete

User: !undo confirm

Bot: ✅ Deleted transaction SL-20251217-143025-742
```

---

## 7. IMPLEMENTATION DETAILS

### 7.1 Key Technical Decisions (ADRs)

**ADR-011: Gemini as Primary Parser**
- **Decision:** Use Gemini API as first-attempt parser, regex as fallback
- **Rationale:** Handles any input order naturally without complex regex chains
- **Trade-off:** Adds ~1-2s latency when Gemini enabled; graceful fallback when not

**ADR-012: Transaction ID Enhanced**
- **Decision:** Changed ID format from `SL-YYYYMMDD-HHMM` to `SL-YYYYMMDD-HHmmss-XXX`
- **Rationale:** Prevents collision risk (two transactions in same minute)
- **Impact:** IDs now include seconds + 3-digit random suffix

**ADR-013: Spender Detection Position**
- **Decision:** Detect spender aliases anywhere in input (not just end)
- **Rationale:** Natural language: "wife 45 rewe" should work like "45 rewe wife"
- **Implementation:** Uses space-based regex instead of word boundary

**ADR-014: Undo Time Window**
- **Decision:** 10-minute window for undo
- **Rationale:** Balance between error recovery and preventing accidental old-data deletion
- **Implementation:** Uses ScriptProperties to track last transaction

**ADR-015: Row-by-ID Deletion for Undo**
- **Decision:** Re-find transaction row by ID at delete time, don't trust stored row number
- **Rationale:** Row numbers shift when other transactions are added between !undo and !undo confirm
- **Impact:** Slightly slower but safe from race conditions

**ADR-016: Timezone-Aware Timestamps**
- **Decision:** Use `Utilities.formatDate()` with ISO format for all timestamps written to sheet
- **Rationale:** Raw `new Date()` objects were being interpreted as UTC by Google Sheets, causing 9-hour offset
- **Implementation:** All `now` and `txnDate` values formatted as `yyyy-MM-dd'T'HH:mm:ss` before writing

**ADR-017: Euro Symbol Flexibility**
- **Decision:** Accept both `` and `e` as euro indicators (e.g., `18` and `18e`)
- **Rationale:** Mobile keyboards often make  hard to type; `e` is natural shorthand
- **Constraint:** `e` must not be followed by other letters (avoids matching "rewe" as "rew" + euro)

**ADR-018: Table Format for Status Commands**
- **Decision:** Use Discord code blocks (```) for aligned table output
- **Rationale:** Monospace font enables proper column alignment; cleaner than markdown bold
- **Applied to:** `!status`, `!ytd`, `!budgetleft`

**ADR-019: Spender Alias Word Boundary**
- **Decision:** Require space separation for spender aliases, not just word boundary
- **Rationale:** `\b` still matched `w` in `rewe` due to word-character transitions
- **Implementation:** Changed regex from `\b(alias)\b` to `(?:^|\s)(alias)(?:\s|$)`

### 7.2 Bug Fixes in v2.0

| Bug | Root Cause | Fix | ADR |
|-----|------------|-----|-----|
| Timestamps 9 hours off | `new Date()` written raw, interpreted as UTC | Format with `Utilities.formatDate()` before writing | ADR-016 |
| "rewe w" → merchant "ree" | `\b` word boundary matched inside "rewe" | Use space-based separation regex | ADR-019 |
| Transaction ID collisions | Same minute, no random component | Add seconds + 3-digit random suffix | ADR-012 |
| Undo row shift race condition | Row numbers change if other txns added | Re-search by txn_id at delete time | ADR-015 |
| month_key apostrophe mismatch | Budget formulas use `'2025-12`, code didn't | Strip `'` prefix when comparing | Changelog 0930 |

### 7.3 Code Structure

**Main Entry Points:**
```javascript
function doPost(e) {
  // HTTP POST from Cloudflare Worker
  const data = JSON.parse(e.postData.contents);
  return processDiscordMessage(data);
}

function doGet(e) {
  // HTTP GET for health checks
  return { success: true, message: 'ShadowLedger API v2.0.0' };
}
```

**Message Routing:**
```javascript
function processDiscordMessage(data) {
  const message = data.content.trim();
  
  if (message.startsWith('!')) {
    return handleCommand(message, username);
  }
  
  // Multi-transaction support
  const lines = message.split('\n').filter(l => l.length > 0);
  if (lines.length === 1) {
    return logExpense(lines[0], username);
  }
  return logMultipleExpenses(lines, username);
}
```

**Parsing Flow:**
```javascript
function parseExpenseInput(message) {
  // Try Gemini AI first (if API key configured)
  const geminiResult = parseWithGemini(message);
  if (geminiResult) return geminiResult;
  
  // Fallback to regex parsing
  return parseExpenseInputRegex(message);
}
```

**Categorization Flow:**
```javascript
function categorizeExpense(merchant) {
  // Check patterns first (fast)
  const patternCategory = checkPatterns(merchant);
  if (patternCategory) return { category: patternCategory, source: 'pattern' };
  
  // Try Gemini AI (if API key configured)
  const geminiCategory = categorizeWithGemini(merchant);
  if (geminiCategory) return { category: geminiCategory, source: 'ai' };
  
  // Default to Buffer
  return { category: 'Buffer', source: 'pattern' };
}
```

---

## 8. DEPLOYMENT GUIDE

### 8.1 Prerequisites

1. **Google Account** with Apps Script access
2. **Discord Account** and server
3. **Cloudflare Account** (free tier)
4. **Render.com Account** (free tier, sign up with GitHub)
5. **GitHub Account** (for code repository)
6. **Gemini API Key** (optional, for AI features)

### 8.2 Initial Setup (One-Time)

**Step 1: Google Sheets Setup**
1. Open `FinanceSource_v6.1.xlsx` in Google Sheets
2. Ensure tabs exist: ShadowLedger, SL_Budget, SL_Patterns, SL_Config
3. Fill SL_Config with Discord webhook URL and usernames
4. (Optional) Add Gemini API key to SL_Config

**Step 2: Google Apps Script Deployment**
1. Open Google Sheets → Extensions → Apps Script
2. Delete default code
3. Paste code from `ShadowLedger_v2.gs`
4. Update `CONFIG.SPREADSHEET_ID` with your sheet ID
5. Deploy → New deployment → Web app
6. Execute as: Me
7. Who has access: Anyone
8. Copy Web App URL

**Step 3: Cloudflare Worker Setup**
1. Create Cloudflare account
2. Workers & Pages → Create Worker
3. Name: `shadowledger-relay`
4. Paste relay code (see Migration Guide)
5. Settings → Variables → Add `APPS_SCRIPT_URL`
6. Save and deploy
7. Copy Worker URL

**Step 4: GitHub Repository**
1. Create new GitHub repo: `shadowledger-discord-bot`
2. Add `index.js` (bot code with keep-alive)
3. Add `package.json` (discord.js dependency)
4. Commit files

**Step 5: Render.com Deployment**
1. Create Render.com account (sign up with GitHub)
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - Name: `shadowledger-bot`
   - Runtime: Node
   - Build: `npm install`
   - Start: `npm start`
   - Instance Type: Free
5. Environment variables:
   - `DISCORD_BOT_TOKEN`
   - `CLOUDFLARE_WORKER_URL`
   - `EXPENSE_CHANNEL_NAME`
   - `RENDER_EXTERNAL_URL` (your Render service URL)
6. Create Web Service
7. Wait for deployment (bot shows online in Discord)

**Step 6: Discord Bot Setup**
1. Discord Developer Portal → Create Application
2. Bot → Add Bot
3. Enable MESSAGE CONTENT INTENT (critical!)
4. Copy bot token → Add to Render env vars
5. OAuth2 → URL Generator:
   - Scopes: bot
   - Permissions: Send Messages, Read Messages, View Channels
6. Invite bot to server using generated URL

**Detailed Migration Guide:** `ShadowLedger_Cloudflare_Migration_Guide_v4.md`

### 8.3 Testing Checklist

- [ ] Bot shows online (green dot) in Discord
- [ ] Basic expense: `45 rewe` → Logged successfully
- [ ] Multi-transaction: `45 rewe\n30 lidl` → Both logged
- [ ] Commands: `!help`, `!status`, `!today` → All work
- [ ] Undo: `!undo` → Shows confirmation, `!undo confirm` → Deletes
- [ ] Budget status: Shows correct percentages and emojis
- [ ] Keep-alive: Bot stays online after 15+ minutes
- [ ] Render logs: Shows periodic keep-alive pings

### 8.4 Updating Apps Script

**When to Update:**
- New features added to code
- Bug fixes
- Configuration changes

**Process:**
1. Backup current code (copy to text file)
2. Open Apps Script editor
3. Replace code with new version
4. Deploy → Manage deployments
5. Edit (pencil icon) → New version
6. Deploy
7. Copy new Web App URL (if changed)
8. Update Cloudflare Worker env var `APPS_SCRIPT_URL` (if URL changed)
9. Test in Discord

**No Render Redeploy Needed:** Bot code rarely changes; Apps Script handles all logic

---

## 9. ROADMAP

### 9.1 Completed Features (v2.0)

All MVP roadmap items (1-9) from v1.0 are now **IMPLEMENTED**:

1. ✅ Extended Spender Aliases
   - h/w/husband/wife/nha/anh/aaron/trang/chang/em
   - Space-based word matching

2. ✅ Multi-Transaction per Message
   - Line break detection (Shift+Enter)
   - Batch processing with summary
   - Per-category budget status

3. ✅ Enhanced !status with %
   - Monospace table format
   - Percentage display
   - Color-coded status emojis

4. ✅ !ytd Command
   - Year-to-date spending table
   - All 17 categories
   - Total YTD summary

5. ✅ Smart Flexible Input Parsing
   - Gemini AI primary parser
   - Handles any input order
   - Regex fallback

6. ✅ Enhanced Date Parsing
   - Relative: yesterday, today, tomorrow
   - Formats: DD.MM, M/D, natural language
   - Timezone-aware

7. ✅ Gemini AI Categorization
   - Natural language category detection
   - Pattern matching fallback
   - API key optional

8. ✅ !budgetleft Command
   - Remaining budget table
   - All categories with remaining amounts

9. ✅ !undo Command
   - 10-minute undo window
   - Confirmation step
   - Row-by-ID deletion (race condition safe)

### 9.2 Future Enhancements (Post-MVP)

**🟢 HIGH PRIORITY - Quick Wins**

10. **Pattern Learning**
    - Auto-suggest new patterns after 5+ transactions to same merchant
    - User approval for learned patterns
    - Confidence scoring based on usage
    - **Effort:** 5-6 hours
    - **Impact:** High (reduces AI API calls, improves accuracy)

11. **Historical Data Import**
    - Backport existing expense data from previous systems
    - CSV upload + bulk processing
    - Validation and duplicate detection
    - **Effort:** 3-4 hours
    - **Impact:** High (complete financial history)

12. **Category Editing**
    - Review and change AI-categorized items
    - Bulk recategorization
    - Command: `!recategorize [txn_id] [new_category]`
    - **Effort:** 3-4 hours
    - **Impact:** Medium (fix AI mistakes)

13. **Scheduled Daily Summary**
    - Auto-post daily spending summary at 21:00 CET
    - Today's total, top categories, budget status
    - **Effort:** 3-4 hours
    - **Impact:** High (proactive awareness)

** MEDIUM PRIORITY - Value Additions**

14. **Scheduled Weekly Summary**
    - Auto-post weekly spending summary (Sundays)
    - Week's total, trends, top merchants
    - **Effort:** 2-3 hours
    - **Impact:** Medium (weekly review)

15. **Receipt Image Recognition**
    - Upload photo → AI extracts amount + merchant
    - Integration: Discord attachments + OCR API
    - **Effort:** 8-10 hours (requires new API integration)
    - **Cost:** ~5-10/month (OCR API)
    - **Impact:** High (convenience, accuracy)

16. **Budget Adjustment Commands**
    - Mid-month budget updates
    - Prorated calculations
    - Command: `!setbudget [category] [amount]`
    - **Effort:** 4-5 hours
    - **Impact:** Medium (flexibility)

17. **Manual Entry Guide**
    - Document how to add/edit entries directly in sheet
    - Safety checks to prevent formula corruption
    - **Effort:** 1-2 hours (documentation only)
    - **Impact:** Low (advanced users)

** LOW PRIORITY - Nice to Have**

18. **Recurring Expenses Auto-Log**
    - Auto-log regular bills (Netflix, utilities, etc.)
    - Monthly schedule with auto-entry
    - **Effort:** 4-5 hours
    - **Impact:** Medium (reduces manual entry)

19. **Multi-Currency Support**
    - Handle transactions in other currencies
    - Auto-convert to EUR at current rate
    - **Effort:** 6-8 hours
    - **Cost:** Exchange rate API
    - **Impact:** Low (unless frequent travel)

20. **Voice Input (Voice Notes)**
    - Voice message → expense logging
    - Discord voice note transcription
    - **Effort:** 8-10 hours (requires transcription API)
    - **Cost:** ~5-10/month (transcription API)
    - **Impact:** Medium (convenience)

21. **Analytics Dashboard**
    - Visual charts in Google Sheet
    - Spending trends, category breakdown
    - Monthly/yearly comparisons
    - **Effort:** 10-12 hours (complex)
    - **Impact:** Medium (insights)

### 9.3 Technical Debt

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Full sheet reads for patterns/budget | Performance (currently acceptable) | 3-4h | Medium |
| No retry logic for transient failures | Lost transactions on temporary errors | 2h | Medium |
| Manual budget formula setup | Setup friction, error-prone | 2h | Low |
| Code modularization | Maintainability | 8-10h | Low |
| Unit test coverage | Bug prevention | 6-8h | Low |

**Refactoring Opportunities:**
- Split monolithic script into modules
- Add unit tests (using Apps Script test framework)
- Improve error messages (user-friendly)
- Add logging/monitoring dashboard

### 9.4 Integration Ideas

**Potential External Integrations:**
-  Bank APIs: Auto-import transactions
-  Email parsing: Receipt emails → expenses
-  Apple Pay / Google Pay: Webhook integration
-  Wise/Revolut: API transaction sync
- 📊 Data Studio: Professional dashboards
-  Telegram bot: Alternative interface

**Internal System Integrations:**
- Link to Monthly_Model_v4 expense tracking
- Auto-populate Exp_Alloc column
- Budget variance alerts to main model
- Net worth impact calculations

---

## 10. MAINTENANCE & OPERATIONS

### 10.1 Daily Operations

**User Actions:**
- Log expenses via Discord as they occur
- Review budget status with !status command
- Check daily totals with !today

**System Actions (Automated):**
- Real-time expense processing (Render bot → Cloudflare → Apps Script)
- Budget formula updates (Google Sheets automatic)
- Keep-alive pings every 14 minutes (Render bot)

**No Manual Intervention Required:**
- System runs 24/7
- No server to maintain
- No local Mac dependency

### 10.2 Weekly Maintenance

**User Tasks (10-15 minutes):**
1. Review AI-categorized items (check for miscategorizations)
2. Check for uncategorized transactions (Buffer category)
3. Update categories if needed (direct sheet edit or !recategorize when available)
4. Add new merchant patterns if recurring (SL_Patterns tab)

**System Health Check:**
1. Verify Render.com service status → "Running"
2. Check Cloudflare Worker status → Active
3. Verify bot online in Discord → Green dot
4. Check Apps Script execution logs for errors
5. Confirm SL_Budget formulas still calculating
6. Test one transaction to verify end-to-end

### 10.3 Monthly Tasks

**End of Month:**
1. Run final !status to see month totals
2. Run !ytd for year-to-date comparison
3. Export data if needed (File → Download → CSV)
4. Review category budgets for next month
5. Adjust budgets in SL_Budget if needed

**Data Management:**
- ShadowLedger grows by ~100 rows/month (typical usage)
- No archiving needed (Google Sheets handles 5M cells)
- Consider yearly sheet tabs if >10,000 transactions

### 10.4 Troubleshooting Guide

**Problem: Bot not responding**

**Check:**
1. Render.com dashboard → Service status = "Running"?
2. Discord → Bot shows green dot (online)?
3. Apps Script execution logs → Any errors?
4. Cloudflare Worker dashboard → Any failed requests?

**Common Fixes:**
- Render service stopped → Restart service
- Bot offline → Check `DISCORD_BOT_TOKEN` env var
- MESSAGE CONTENT INTENT disabled → Enable in Discord Developer Portal
- Cloudflare Worker errors → Check `APPS_SCRIPT_URL` env var

**Problem: Bot goes offline after 15 minutes**

**Cause:** Keep-alive not working

**Fix:**
1. Verify `RENDER_EXTERNAL_URL` env var is set correctly
2. Check Render logs for " Keep-alive ping successful"
3. Verify HTTP server on port 10000 is responding
4. Redeploy if needed

**Problem: Duplicate responses**

**Cause:** Pipedream still enabled (during migration)

**Fix:** Disable Pipedream workflow at https://pipedream.com

**Problem: Transactions not logged**

**Check Render Logs:**
- No " Message received" → MESSAGE CONTENT INTENT disabled
- "Forward failed" → Check `CLOUDFLARE_WORKER_URL` env var
- "Cloudflare error" → Check Cloudflare Worker status
- "Apps Script error" → Check Apps Script execution logs

**Problem: Wrong timestamps (UTC offset)**

**Cause:** Apps Script timezone misconfiguration

**Fix:**
1. Verify `CONFIG.TIMEZONE = 'Europe/Berlin'`
2. Ensure timestamps formatted before writing to sheet
3. Check ADR-016 implementation

**Problem: Budget formulas broken**

**Cause:** Manual sheet edits corrupted formulas

**Fix:**
1. Restore formulas from backup or template
2. Verify month_key format in SL_Budget (apostrophe prefix)
3. Test with !status command

### 10.5 Monitoring & Logging

**Render.com Logs:**
- Access: Dashboard → Service → Logs tab
- Shows: Bot startup, message processing, keep-alive pings
- Retention: Last 1000 lines (free tier)

**Cloudflare Worker Logs:**
- Access: Dashboard → Workers → shadowledger-relay → Metrics
- Shows: Request count, error rate, latency
- Real-time: Quick Edit → Console → Test requests

**Apps Script Execution Logs:**
- Access: Apps Script editor → Executions
- Shows: Function calls, errors, runtime
- Filter by status (Success/Failure)

**Google Sheets Audit:**
- Version History → See changes
- SL_Budget formulas → Verify calculations
- ShadowLedger row count → Growth rate

### 10.6 Backup & Recovery

**Data Backup:**
- Google Sheets auto-saves (30-day version history)
- Manual export: File → Download → Excel (.xlsx)
- Frequency: Monthly or before major changes

**Code Backup:**
- Apps Script: Extensions → Apps Script → Version history
- GitHub: Bot code automatically versioned
- Cloudflare Worker: Auto-saved on deploy

**Recovery Procedures:**
1. **Lost transaction data:**
   - Restore from Google Sheets version history
   - Check Discord channel history for re-entry

2. **Broken Apps Script:**
   - Revert to previous version in Apps Script editor
   - Redeploy as new Web App
   - Update Cloudflare Worker env var if URL changed

3. **Bot offline:**
   - Redeploy from GitHub (Render auto-redeploys on push)
   - Verify env vars are still set
   - Check Discord bot token validity

### 10.7 Security Best Practices

**API Keys & Tokens:**
- Store in environment variables (Render, Cloudflare)
- Never commit to GitHub
- Rotate Discord bot token quarterly
- Regenerate Gemini API key if compromised

**Access Control:**
- Google Sheets: Share with specific users only
- Discord bot: Limit to single channel (#expenses)
- Apps Script: Execute as "Me", access by "Anyone" (required for POST)

**Data Privacy:**
- All data stored in personal Google account
- No third-party analytics or tracking
- Discord messages not logged externally

**Regular Security Checks:**
- Review Apps Script authorized users (monthly)
- Check Discord bot permissions (quarterly)
- Verify env vars not exposed in logs (monthly)

---

## APPENDIX A: GLOSSARY

| Term | Definition |
|------|------------|
| ADR | Architecture Decision Record (documents key technical choices) |
| AI | Artificial Intelligence (categorization via Gemini API) |
| Apps Script | Google's JavaScript platform for Sheets automation |
| CET | Central European Time (Europe/Berlin timezone) |
| CMP | Central Master Pot (from main financial model) |
| Cloudflare Worker | Serverless compute platform (edge computing) |
| Keep-alive | HTTP pings to prevent service from sleeping |
| MVP | Minimum Viable Product (v2.0 = full MVP) |
| Render.com | Cloud platform hosting Discord bot (free tier) |
| SL | ShadowLedger (abbreviation) |
| Spender | Person who made the purchase (H/W) |
| Inputter | Person who logged the transaction (H/W) |
| Webhook | HTTP callback for real-time message delivery |
| month_key | Text format YYYY-MM for grouping transactions (apostrophe prefix in sheet) |

---

## APPENDIX B: FILE INVENTORY

### Production Files (Keep)

**Google Sheets:**
- `aaron_family_financial_model_v6.1.xlsx` (or `FinanceSource_v6.1.xlsx`)
  - Tab: ShadowLedger
  - Tab: SL_Budget
  - Tab: SL_Patterns
  - Tab: SL_Config

**Google Apps Script:**
- `ShadowLedger_v2.gs` (v2.0.0 code)

**GitHub Repository:**
- `index.js` (Discord bot with keep-alive)
- `package.json` (dependencies)

**Cloudflare Worker:**
- Worker code (in Cloudflare dashboard)

**Documentation (Current):**
- `BLUEPRINT_ShadowLedger_v2_0_0.md`  This file
- `ShadowLedger_Cloudflare_Migration_Guide_v4.md` (setup guide)

### Historical Files (Safe to Delete)

**Superseded Blueprints:**
1. `BLUEPRINT_ShadowLedger_v0.1.md` → Superseded by v1.0
2. `BLUEPRINT_ShadowLedger_v1.0.md` → Superseded by v2.0 (this file)

**Implementation Guides (Content Absorbed):**
3. `ShadowLedger_Implementation_Guide.md` → Content in Section 8 of v1.0
4. `ShadowLedger_Implementation_Guide_v2.md` → All features now implemented in v2.0

**Session Notes (Obsolete):**
5. `ShadowLedger_Handoff_NextSession.md` → Session context, no longer needed

**Changelogs (History Absorbed):**
6. `ShadowLedger_Changelog_20251216_2200.md` → History in v1.0
7. `ShadowLedger_Changelog_20251216_2320.md` → History in v1.0
8. `ShadowLedger_changelog_20251217_0930.md` → ADRs in v2.0
9. `ShadowLedger_changelog_20251217_2216.md` → ADRs in v2.0

**Old Code Versions:**
10. `ShadowLedger_Code.gs` → Old version without UTF-8 fix
11. `ShadowLedger_Code_CLEAN.gs` → ASCII-only version
12. `ShadowLedger_Minimal.gs` → Wrong category order
13. `ShadowLedger_UTF8.gs` → Superseded by v2.gs

**TODO (Will Be Updated):**
14. `ShadowLedger_TODO.md` → Will be replaced with updated version

**Reason for Deletion:**
All content from historical files has been consolidated into this unified Blueprint v2.0. No information loss occurs by deleting them.

---

## APPENDIX C: VERSION DIFF SUMMARY

**From:** BLUEPRINT_ShadowLedger_v1.0.md (MVP design)  
**To:** BLUEPRINT_ShadowLedger_v2.0.md (this document)

### Major Changes

1. **All MVP Features Implemented**
   - Changed status from " TODO" to "✅ Implemented" for features 1-9
   - Updated code examples to reflect actual implementation
   - Added ADRs documenting technical decisions

2. **Architecture Migration Documented**
   - Added Cloudflare + Render.com architecture details
   - Documented migration from Pipedream
   - Included keep-alive mechanism explanation
   - Added capacity comparison (100x increase)

3. **Technical Implementation Updated**
   - Transaction ID format: `SL-YYYYMMDD-HHmmss-XXX` (added seconds + random suffix)
   - Timestamp handling: All formatted before sheet write (ADR-016)
   - Euro symbol: Accepts both `` and `e` (ADR-017)
   - Spender detection: Space-based regex (ADR-019)
   - Undo: Row-by-ID deletion (ADR-015)

4. **New Sections Added**
   - Section 2.2: Migration from Pipedream to Cloudflare + Render
   - Section 2.3: Component Details (Bot, Worker, Apps Script)
   - Section 6.1: Discord Bot Setup (Render.com)
   - Section 6.2: Cloudflare Worker (Relay)
   - ADRs 011-019: All technical decisions documented

5. **Bug Fixes Documented**
   - Timestamp UTC offset (ADR-016)
   - "rewe w" parsing bug (ADR-019)
   - Transaction ID collisions (ADR-012)
   - Undo race condition (ADR-015)
   - month_key apostrophe mismatch

6. **Updated Deployment Guide**
   - Added Cloudflare Worker setup
   - Added Render.com deployment
   - Added GitHub repository creation
   - Updated Apps Script deployment (no Pipedream)
   - Added testing checklist

7. **Enhanced Troubleshooting**
   - Cloudflare Worker issues
   - Render.com service issues
   - Keep-alive troubleshooting
   - Bot offline scenarios

8. **Roadmap Reorganized**
   - Moved completed items to "Completed Features" section
   - Updated priorities based on current state
   - Added new enhancement ideas
   - Maintained technical debt section

9. **File Inventory Updated**
   - Current production files: v2.gs, Migration Guide v4
   - Safe to delete: v1.0 Blueprint, old changelogs, implementation guides
   - GitHub repo files added

### Length Change

- **Original v1.0:** ~1,150 lines
- **Updated v2.0:** ~1,850 lines
- **Net increase:** +700 lines (+61%)

### Reason for Length Increase

Added comprehensive sections on:
- Cloudflare + Render architecture (300 lines)
- 9 ADRs documenting technical decisions (200 lines)
- Enhanced deployment guide with new stack (150 lines)
- Bug fixes and implementation details (50 lines)

Removed redundant TODO markers (features now implemented).

---

**END OF UNIFIED BLUEPRINT v2.0.0**

*Last Updated: 2025-12-17 23:30:00 UTC+2*  
*Status: Production (Full MVP)*  
*Next Review: After implementing first post-MVP feature*
