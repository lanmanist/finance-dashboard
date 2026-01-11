# ShadowLedger Module - Unified Blueprint

```yaml
version: v2.3.0
last_updated: 2026-01-11 23:30:00 UTC+2
status: Production (Full MVP + Income/Investment + Enhanced API)
parent_system: Aaron Family Financial Model v6.1
deployment: Live (Cloudflare + Render.com)
cost: €0/month (100% serverless)
```

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Data Schema](#3-data-schema)
4. [Expense Logging](#4-expense-logging)
5. [Income Tracking](#5-income-tracking)
6. [Investment Tracking](#6-investment-tracking)
7. [Budget Monitoring](#7-budget-monitoring)
8. [Discord Integration](#8-discord-integration)
9. [Dashboard API](#9-dashboard-api)
10. [Technical Implementation](#10-technical-implementation)
11. [Deployment Guide](#11-deployment-guide)
12. [Roadmap](#12-roadmap)
13. [Maintenance & Operations](#13-maintenance--operations)

---

## 1. EXECUTIVE SUMMARY

### 1.1 What Is ShadowLedger?

ShadowLedger is a **Discord-based expense, income, and investment tracking module** integrated into the Aaron Family Financial Model. It enables real-time transaction logging via simple Discord messages with automatic categorization and live budget monitoring.

**Core Value Proposition:**
- Log expenses in 5 seconds from mobile: `45 rewe`
- Log income for financial model: `!income 4200 salary h`
- Track investment transfers: `!invest 500 scalable`
- No app needed - just Discord (already on phones)
- Real-time budget feedback on every transaction
- Multi-user support (Husband/Wife)
- Zero monthly cost (100% serverless)
- AI-powered flexible input parsing

### 1.2 Current Status: Production v2.3.0

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

**✅ INCOME TRACKING (v2.1.0):**
- `!income` command for salary, YouTube, other income
- `!ta` command for Time Account hours
- `!income status` to check monthly completion
- Automated monthly reminders (Day 1, 6, 11, 16, 21, 26)
- SL_Income_Log sheet with update-in-place logic

**✅ INVESTMENT TRACKING (v2.2.0):**
- `!invest` command for transfer logging
- `!invest status` for monthly investment summary
- SL_Investment_Log sheet with destination tracking
- Support for Scalable, Revolut, Comdirect, Trade Republic, Other

**✅ ENHANCED DASHBOARD API (v2.3.0):**
- Enhanced `getExpenseBreakdown()` with transaction details
- Per-category transaction arrays (recent + top by amount)
- Category insights (avg, largest transaction)
- Supports Dashboard expense hover tooltips

**🎯 Completed Features (1-17):**

| # | Feature | Version | Status |
|---|---------|---------|--------|
| 1 | Extended spender aliases | v2.0 | ✅ |
| 2 | Multi-transaction per message | v2.0 | ✅ |
| 3 | Enhanced !status with percentages | v2.0 | ✅ |
| 4 | !ytd command | v2.0 | ✅ |
| 5 | Smart flexible input parsing (Gemini) | v2.0 | ✅ |
| 6 | Enhanced date parsing | v2.0 | ✅ |
| 7 | Gemini AI categorization | v2.0 | ✅ |
| 8 | !budgetleft command | v2.0 | ✅ |
| 9 | !undo command with confirmation | v2.0 | ✅ |
| 10 | !income command (salary, youtube, other) | v2.1 | ✅ |
| 11 | !ta command (time account hours) | v2.1 | ✅ |
| 12 | !income status command | v2.1 | ✅ |
| 13 | Automated monthly reminder | v2.1 | ✅ |
| 14 | !invest command for transfers | v2.2 | ✅ |
| 15 | !invest status command | v2.2 | ✅ |
| 16 | SL_Investment_Log with destinations | v2.2 | ✅ |
| 17 | Enhanced expense API with transactions | v2.3 | ✅ |

### 1.3 Technology Stack

| Component | Technology | Cost | Status |
|-----------|------------|------|--------|
| Backend | Google Apps Script v2.3 | Free | ✅ Live |
| Database | Google Sheets | Free | ✅ Live |
| Interface | Discord Bot + Webhook | Free | ✅ Live |
| Bot Host | Render.com Web Service | Free | ✅ Live |
| Relay | Cloudflare Workers | Free | ✅ Live |
| AI Parser | Gemini API | Free tier | ✅ Live |
| Hosting | Google Cloud (via Apps Script) | Free | ✅ Live |

**Total Monthly Cost: €0**

**Architecture:**
```
Discord → Render.com Bot → Cloudflare Worker → Apps Script → Google Sheets
```

### 1.4 Key Metrics

- **Response Time:** <5 seconds (full chain latency)
- **Budget Categories:** 17 (€4,110/month total)
- **Built-in Patterns:** 58 merchant mappings
- **Supported Users:** 2 (H/W with cross-recording)
- **Uptime:** 24/7 (serverless architecture)
- **Daily Capacity:** 100,000 requests (Cloudflare free tier)
- **Monthly Uptime:** 750 hours (Render.com free tier)

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     SHADOWLEDGER v2.3 ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  USER (Mobile/Desktop)                                                          │
│       ↓                                                                         │
│  ┌──────────────────┐                                                           │
│  │    Discord       │  "45 rewe" / "!income 4200 salary h"                      │
│  │   #expenses      │                                                           │
│  └────────┬─────────┘                                                           │
│           ↓ WebSocket                                                           │
│  ┌──────────────────────────────────────────────────────────┐                   │
│  │          Discord Bot (Render.com)                        │                   │
│  │  • Node.js + discord.js                                  │                   │
│  │  • Keep-alive HTTP server (prevents sleep)               │                   │
│  │  • 750 hrs/month free (24/7 coverage)                    │                   │
│  └────────┬─────────────────────────────────────────────────┘                   │
│           ↓ POST /forward                                                       │
│  ┌──────────────────────────────────────────────────────────┐                   │
│  │        Cloudflare Worker (Relay)                         │                   │
│  │  • Edge computing (global, <50ms)                        │                   │
│  │  • 100K requests/day free                                │                   │
│  └────────┬─────────────────────────────────────────────────┘                   │
│           ↓ POST to Apps Script                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │        Google Apps Script v2.3 (Backend Logic)                           │   │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Command Router                                                     │  │   │
│  │  │ • Expense logging (default)                                        │  │   │
│  │  │ • !income → Income handler                                         │  │   │
│  │  │ • !invest → Investment handler                                     │  │   │
│  │  │ • !ta → Time Account handler                                       │  │   │
│  │  │ • !status, !ytd, !undo → Query handlers                            │  │   │
│  │  └────────────────────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Dashboard API (GET endpoints)                                      │  │   │
│  │  │ • ?action=dashboard → Full financial data                          │  │   │
│  │  │ • ?action=expenses&month=YYYY-MM → Category breakdown              │  │   │
│  │  │ • ?action=test → Health check                                      │  │   │
│  │  └────────────────────────────────────────────────────────────────────┘  │   │
│  └─────────┬────────────────────────────────────────────────────────────────┘   │
│            ↓ Write to Sheets                                                    │
│  ┌──────────────────────────────────────────────────────────┐                   │
│  │          Google Sheets (Database)                        │                   │
│  │  • ShadowLedger (expenses)                               │                   │
│  │  • SL_Budget (budget tracking)                           │                   │
│  │  • SL_Patterns (merchant rules)                          │                   │
│  │  • SL_Config (settings)                                  │                   │
│  │  • SL_Income_Log (income/TA)                             │                   │
│  │  • SL_Investment_Log (investments)                       │                   │
│  └──────────────────────────────────────────────────────────┘                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Details

#### Discord Bot (Render.com)
- **Runtime:** Node.js + discord.js
- **Purpose:** Listen to #expenses channel, forward messages
- **Keep-alive:** HTTP server on port 3000, self-ping every 14 minutes
- **Env vars:** `DISCORD_TOKEN`, `CLOUDFLARE_WORKER_URL`

#### Cloudflare Worker
- **Purpose:** Relay messages to Apps Script, add logging
- **Secret:** `APPS_SCRIPT_URL` stored securely
- **Benefits:** Can update Apps Script URL without redeploying bot

#### Google Apps Script
- **Purpose:** All business logic, data storage, Discord responses
- **Deployment:** Web App with "Anyone" access
- **Routing:** `doPost()` for Discord, `doGet()` for Dashboard API

---

## 3. DATA SCHEMA

### 3.1 ShadowLedger (Expenses)

| Column | Type | Description |
|--------|------|-------------|
| A | String | txn_id (SL-YYYYMMDD-HHMMSS-XXX) |
| B | DateTime | created_at |
| C | DateTime | txn_date |
| D | Number | amount |
| E | String | merchant |
| F | String | description |
| G | String | category |
| H | String | spender (H/W) |
| I | String | inputter (H/W) |
| J | String | source (Discord) |
| K | String | categorization (ai/pattern/user) |
| L | Boolean | user_override |
| M | DateTime | override_at |
| N | String | raw_input |
| O | String | month_key ('YYYY-MM) |

### 3.2 SL_Income_Log

| Column | Type | Description |
|--------|------|-------------|
| A | String | ID (INC-YYYYMMDD-HHMMSS) |
| B | String | MonthKey (YYYY-MM) |
| C | String | Type (salary/youtube/other/ta_h/ta_w) |
| D | Number | Amount |
| E | String | Spender (H/W or null) |
| F | String | Description |
| G | DateTime | Timestamp |
| H | String | InputBy |

### 3.3 SL_Investment_Log

| Column | Type | Description |
|--------|------|-------------|
| A | String | ID (INV-YYYYMMDD-HHMMSS) |
| B | Date | Date |
| C | String | MonthKey (YYYY-MM) |
| D | Number | Amount |
| E | String | Destination |
| F | String | Notes |
| G | DateTime | Timestamp |
| H | String | InputBy |

### 3.4 SL_Budget

| Column | Type | Description |
|--------|------|-------------|
| A | String | Category |
| B | Number | Budget |
| C | String | Month_Key ('YYYY-MM) |

### 3.5 SL_Patterns

| Column | Type | Description |
|--------|------|-------------|
| A | String | Pattern (regex or exact match) |
| B | String | Category |
| C | String | Notes |

### 3.6 SL_Config

| Column | Type | Description |
|--------|------|-------------|
| A | String | Key |
| B | String | Value |

**Config Keys:**
- `discord_webhook_url` - For bot responses
- `gemini_api_key` - For AI parsing
- `h_discord_username` - Husband's Discord username
- `w_discord_username` - Wife's Discord username

---

## 4. EXPENSE LOGGING

### 4.1 Input Formats

ShadowLedger accepts flexible input formats. All of these work:

```
45 rewe
rewe 45€ wife yesterday
27 lidl 01.03 husband
groceries 32 aldi
```

### 4.2 Parsing Pipeline

1. **Gemini AI Parsing** (primary)
   - Extracts: amount, merchant, category, spender, date, description
   - Model: `gemini-1.5-flash`
   - Temperature: 0.1 (deterministic)

2. **Regex Fallback** (if Gemini fails)
   - Amount: `(\d+(?:[.,]\d+)?)\s*[€e]?`
   - Spender: Match against alias list
   - Date: `\d{1,2}[./]\d{1,2}` or natural language
   - Merchant: Remaining text

### 4.3 Categorization

**Priority Order:**
1. User-specified category in input
2. Pattern match from SL_Patterns
3. Gemini AI suggestion
4. Default to "Buffer"

### 4.4 Multi-Transaction Support

Send multiple expenses in one message using newlines (Shift+Enter):

```
45 rewe
32 dm
15 backerei
```

Each line is processed independently with individual confirmations.

---

## 5. INCOME TRACKING

### 5.1 Commands

| Command | Purpose | Target Month |
|---------|---------|--------------|
| `!income [amt] salary h` | Log H net salary | Previous |
| `!income [amt] salary w` | Log W net salary | Previous |
| `!income [amt] youtube` | Log YouTube gross | Previous |
| `!income [amt] other [desc]` | Log other income | Previous |
| `!ta [hrs] h` | Log H TA hours | Previous |
| `!ta [hrs] w` | Log W TA hours | Previous |
| `!income status` | Check completion | Previous |

### 5.2 Income Types

| Type | Column | Requires Spender | Label |
|------|--------|------------------|-------|
| salary | net_salary | Yes (H/W) | Net Salary |
| youtube | yt_gross | No | YouTube Gross |
| other | other_fam_net_inc | No | Other Income |

### 5.3 Update-in-Place Logic

Income entries use **update-in-place** (unlike expenses which append):
- Same MonthKey + Type + Spender = Update existing row
- New combination = Append new row

### 5.4 Automated Reminders

Trigger function `checkAndSendIncomeReminder()` runs daily at 8-9am.
Sends reminder on days: 1, 6, 11, 16, 21, 26 if any required inputs missing.

**Required inputs checked:**
- H Net Salary
- W Net Salary
- YouTube Gross
- H TA Hours
- W TA Hours

---

## 6. INVESTMENT TRACKING

### 6.1 Commands

| Command | Purpose | Target Month |
|---------|---------|--------------|
| `!invest [amt] [dest] [notes]` | Log transfer | Current |
| `!invest status` | Monthly summary | Current |

### 6.2 Destinations

- `scalable` - Scalable Capital
- `revolut` - Revolut Trading
- `comdirect` - Comdirect Depot
- `trade_republic` - Trade Republic
- `other` - Other destination

### 6.3 Append-Only Logic

Unlike income, each `!invest` command creates a new row (multiple transfers per month supported).

---

## 7. BUDGET MONITORING

### 7.1 Categories (17 Total)

| Category | Monthly Budget |
|----------|---------------|
| Childcare | €200 |
| Family Support | €300 |
| Groceries + Food | €650 |
| Utilities | €400 |
| Car | €300 |
| Shopping | €200 |
| Travel & Leisure | €300 |
| Insurance | €150 |
| Eat Out & Food delivery | €350 |
| Gifts | €200 |
| Entertainment | €100 |
| Health & beauty | €150 |
| Home improvement | €150 |
| Business & Subscription | €200 |
| Donation | €50 |
| Special IO | €310 |
| Buffer | €100 |
| **TOTAL** | **€4,110** |

### 7.2 Status Indicators

| Emoji | Percentage | Meaning |
|-------|------------|---------|
| 🟢 | 0-49% | On track |
| 🟡 | 50-79% | Caution |
| 🟠 | 80-99% | Warning |
| 🔴 | 100%+ | Over budget |

### 7.3 Commands

| Command | Output |
|---------|--------|
| `!status` | Full budget table with all categories |
| `!budgetleft` | Remaining budget per category |
| `!ytd` | Year-to-date spending comparison |

---

## 8. DISCORD INTEGRATION

### 8.1 Spender Aliases

| Husband | Wife |
|---------|------|
| h | w |
| husband | wife |
| nha | trang |
| anh | chang |
| aaron | em |

### 8.2 Date Formats

| Format | Example | Result |
|--------|---------|--------|
| Relative | yesterday | Previous day |
| Relative | today | Current day |
| Relative | tomorrow | Next day |
| DD.MM | 06.03 | March 6 (current year) |
| DD/MM | 6/3 | March 6 (current year) |
| Natural | march 6 | March 6 |

### 8.3 All Commands Reference

```
📝 Expense Logging (flexible format):
Any order works! Examples:
• 45 rewe
• rewe 45€ wife yesterday
• 27 lidl 01.03 husband

📦 Multi-line batch:
Use Shift+Enter for line breaks

👤 Spender names:
H: h, husband, nha, anh, aaron
W: w, wife, trang, chang, em

📆 Dates:
yesterday, today, tomorrow
06.03, 6/3, march 6

📋 Expense Commands:
!status - Monthly budget table
!budgetleft - Remaining budget
!ytd - Year to date table
!today - Today's expenses
!week - This week's expenses
!undo - Delete last transaction

💰 Income Commands:
!income 4200 salary h - Log H net salary
!income 3800 salary w - Log W net salary
!income 1200 youtube - Log YT gross
!income 50 other payback - Log other income
!income status - Check what's missing

⏱️ Time Account:
!ta 45 h - Log H hours added
!ta 38 w - Log W hours added

📈 Investment Commands:
!invest 500 scalable - Log transfer
!invest 1000 revolut ETF purchase
!invest status - This month's transfers

!help - Show this message
```

---

## 9. DASHBOARD API

### 9.1 Endpoints

| Endpoint | Method | Returns |
|----------|--------|---------|
| `?action=dashboard` | GET | Full financial data for Sankey (204 months) |
| `?action=expenses&month=YYYY-MM` | GET | Category expense breakdown with transactions |
| `?action=test` | GET | Health check + endpoint list |
| (POST body) | POST | ShadowLedger Discord message processing |

### 9.2 Expense API Response Schema (v2.3)

```json
{
  "success": true,
  "month": "2026-01",
  "month_name": "January 2026",
  "categories": [
    {
      "name": "Groceries + Food",
      "spent": 523.45,
      "budget": 650,
      "percent": 81,
      "status": "🟠",
      "transaction_count": 12,
      "transactions_recent": [
        { "date": "15.01", "merchant": "Rewe", "amount": 45.32 },
        { "date": "14.01", "merchant": "Lidl", "amount": 32.10 }
      ],
      "transactions_top": [
        { "date": "10.01", "merchant": "Metro", "amount": 156.78 },
        { "date": "15.01", "merchant": "Rewe", "amount": 45.32 }
      ],
      "insights": {
        "avg_amount": 43.62,
        "largest_amount": 156.78,
        "largest_date": "10.01",
        "largest_merchant": "Metro"
      }
    }
  ],
  "summary": {
    "total_spent": 2847.32,
    "total_budget": 4110,
    "total_percent": 69,
    "transaction_count": 47,
    "budget_available": true
  }
}
```

### 9.3 Status Emoji Logic

```javascript
function getStatusEmojiDashboard(percent) {
  if (percent === null) return 'N/A';
  if (percent >= 100) return '🔴';
  if (percent >= 80) return '🟠';
  if (percent >= 50) return '🟡';
  return '🟢';
}
```

---

## 10. TECHNICAL IMPLEMENTATION

### 10.1 Gemini AI Parsing

**Prompt Structure:**
```
Parse this expense input and return JSON only (no markdown, no explanation):
Input: "${input}"

Extract:
- amount: number (required)
- merchant: string (required, the store/place name)
- category: string or null (if explicitly mentioned)
- spender: "H" or "W" or null
- date: ISO date string or null
- description: string or null

Return ONLY valid JSON.
```

**API Call:**
```javascript
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
const payload = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { temperature: 0.1, maxOutputTokens: 250 }
};
```

### 10.2 Regex Parsing (Fallback)

**Amount Pattern:**
```javascript
const amountMatch = input.match(/(\d+(?:[.,]\d+)?)\s*[€e](?![a-df-z])/i);
if (!amountMatch) {
  amountMatch = input.match(/(?:^|\s)(\d+(?:[.,]\d+)?)/);
}
```

**Spender Pattern:**
```javascript
const aliasPattern = Object.keys(SPENDER_ALIASES).join('|');
const spenderRegex = new RegExp(`(?:^|\\s)(${aliasPattern})(?:\\s|$)`, 'i');
```

### 10.3 Date Parsing

**Natural Language:**
- "yesterday" → subtract 1 day
- "today" → current date
- "tomorrow" → add 1 day
- Month names: "march 6", "6th march"

**Numeric:**
- DD.MM: `(\d{1,2})\.(\d{1,2})`
- DD/MM: `(\d{1,2})/(\d{1,2})`
- Full: `(\d{1,2})[./](\d{1,2})[./](\d{2,4})`

### 10.4 Transaction ID Generation

```javascript
function generateTxnId() {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyyMMdd');
  const timeStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'HHmmss');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SL-${dateStr}-${timeStr}-${rand}`;
}
```

### 10.5 Budget Calculation

```javascript
function calculateBudgetStatus(category, monthKey) {
  const budgetSheet = getSheet(CONFIG.SHEETS.BUDGET);
  const ledgerSheet = getSheet(CONFIG.SHEETS.LEDGER);
  
  // Get budget for category
  const budget = getBudgetForCategory(category, monthKey);
  
  // Sum transactions for month
  const spent = sumTransactionsForMonth(category, monthKey);
  
  const percent = budget > 0 ? spent / budget : 0;
  
  return {
    spent: spent,
    budget: budget,
    percent: percent,
    status: getStatusEmoji(percent)
  };
}
```

---

## 11. DEPLOYMENT GUIDE

### 11.1 Google Apps Script

1. Open Google Sheets (FinanceSource_v6_1)
2. Extensions → Apps Script
3. Paste Code.gs content
4. Deploy → New deployment → Web app
5. Execute as: Me, Who has access: Anyone
6. Copy deployment URL

### 11.2 Cloudflare Worker

1. Login to Cloudflare Dashboard
2. Workers & Pages → Create Worker
3. Name: `shadowledger-relay`
4. Paste worker code
5. Settings → Variables → Add Secret: `APPS_SCRIPT_URL`
6. Deploy

### 11.3 Render.com Bot

1. Create GitHub repo with bot code
2. Login to Render.com
3. New → Web Service → Connect repo
4. Environment: Node
5. Add env vars: `DISCORD_TOKEN`, `CLOUDFLARE_WORKER_URL`
6. Deploy

### 11.4 Apps Script Trigger Setup

1. In Apps Script, click Triggers (clock icon)
2. Add Trigger
3. Function: `checkAndSendIncomeReminder`
4. Event source: Time-driven → Day timer → 8am to 9am

### 11.5 Testing Checklist

- [ ] Bot online (green dot)
- [ ] `45 rewe` → Expense logged
- [ ] `!status` → Budget table shows
- [ ] `!income 100 salary h` → Income logged
- [ ] `!income status` → Shows completion
- [ ] `!invest 100 scalable` → Investment logged
- [ ] `!invest status` → Shows transfers
- [ ] `!ta 10 h` → TA hours logged
- [ ] `!undo` → Confirmation shows
- [ ] `!help` → Full command list
- [ ] `?action=expenses&month=2026-01` → Returns transactions

---

## 12. ROADMAP

### 12.1 Completed Features (v2.0-2.3)

All features 1-17 are now **IMPLEMENTED**. See Section 1.2.

### 12.2 Future Enhancements (Post-MVP)

**🟢 HIGH PRIORITY - Quick Wins**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 18 | Pattern Learning (auto-suggest after 5+ same merchant) | 5-6h | High |
| 19 | Historical Data Import (CSV upload) | 3-4h | High |
| 20 | Category Editing (!recategorize) | 3-4h | Medium |
| 21 | Scheduled Daily Summary (21:00 CET) | 3-4h | High |

**🔵 MEDIUM PRIORITY - Value Additions**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 22 | Scheduled Weekly Summary | 2-3h | Medium |
| 23 | Receipt Image Recognition (OCR) | 8-10h | High |
| 24 | Budget Adjustment Commands | 4-5h | Medium |
| 25 | Manual Entry Guide (documentation) | 1-2h | Low |

**🟣 LOW PRIORITY - Nice to Have**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 26 | Recurring Expenses Auto-Log | 4-5h | Medium |
| 27 | Multi-Currency Support | 6-8h | Low |
| 28 | Voice Input (Voice Notes) | 8-10h | Medium |
| 29 | Analytics Dashboard (charts) | 10-12h | Medium |

### 12.3 Technical Debt

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Full sheet reads for patterns | Performance | 3-4h | Medium |
| No retry logic for failures | Lost transactions | 2h | Medium |
| Manual budget formula setup | Setup friction | 2h | Low |
| Code modularization | Maintainability | 8-10h | Low |
| Unit test coverage | Bug prevention | 6-8h | Low |

### 12.4 Integration Ideas

- 💳 Bank APIs: Auto-import transactions
- 📧 Email parsing: Receipt emails
- 🦊 Wise/Revolut API: Transaction sync
- 📊 Data Studio: Professional dashboards

---

## 13. MAINTENANCE & OPERATIONS

### 13.1 Daily Operations

**User Actions:**
- Log expenses via Discord
- Log income/investments as they occur
- Review budget with !status

**System (Automated):**
- Real-time processing
- Keep-alive pings (14 min intervals)
- Budget formula recalculation

### 13.2 Monthly Tasks

**Start of Month:**
1. Run `!income status` to check previous month completion
2. Log any missing income/TA values
3. Review `!invest status` for investment totals

**End of Month:**
1. Run `!status` for final totals
2. Run `!ytd` for year comparison
3. Review AI-categorized items
4. Add new patterns if needed

### 13.3 Health Checks

| Component | Check | Location |
|-----------|-------|----------|
| Discord Bot | Green dot online | Discord server |
| Render.com | Service "Running" | Dashboard |
| Cloudflare | Worker active | Dashboard |
| Apps Script | No errors in logs | Execution log |

### 13.4 Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Bot offline | Render service sleeping | Check keep-alive, redeploy |
| No response | Worker URL wrong | Verify APPS_SCRIPT_URL |
| Wrong category | Pattern missing | Add to SL_Patterns |
| Budget wrong | Formula broken | Check SL_Budget formulas |
| Income not saving | Sheet missing | Run command to auto-create |
| Expense API empty | No transactions | Check ShadowLedger tab |

---

## APPENDIX A: GLOSSARY

| Term | Definition |
|------|------------|
| ADR | Architectural Decision Record |
| CET | Central European Time |
| CMP | Central Master Pot (main financial model) |
| Inputter | Person who logged the transaction |
| month_key | Text format YYYY-MM (apostrophe prefix in budget sheet) |
| SL | ShadowLedger abbreviation |
| Spender | Person who made the purchase |
| TA | Time Account (flex hours) |

---

## APPENDIX B: FILE INVENTORY

### Production Files (Keep)

**Google Sheets:**
- `FinanceSource_v6.1.xlsx`
  - Tab: ShadowLedger
  - Tab: SL_Budget
  - Tab: SL_Patterns
  - Tab: SL_Config
  - Tab: SL_Income_Log
  - Tab: SL_Investment_Log

**Google Apps Script:**
- `ShadowLedger_Code.gs` (v2.3.0)

**GitHub Repository:**
- `index.js` (Discord bot)
- `package.json`

**Cloudflare:**
- Worker code (in dashboard)

**Documentation:**
- `BLUEPRINT_ShadowLedger_v2_3_0.md` ← This file

### Safe to Delete

| File | Reason |
|------|--------|
| `BLUEPRINT_ShadowLedger_v2_2_0.md` | Superseded by v2.3.0 |
| `ShadowLedger_Blueprint.md` | Duplicate of earlier version |
| `ShadowLedger_Setup.md` | Absorbed into Migration Guide |
| `ShadowLedger_Blueprint_changelog_*.md` | ADRs absorbed |
| `Dashboard_ShadowLedger_changelog_20260111_2200.md` | Absorbed into this Blueprint |

---

## APPENDIX C: VERSION HISTORY

### v2.3.0 (2026-01-11)
- **Enhanced Expense API**: `getExpenseBreakdown()` now returns transaction details per category
- **New response fields**: `transaction_count`, `transactions_recent[]`, `transactions_top[]`, `insights{}`
- **Dashboard support**: Enables hover tooltips with transaction lists
- **No Discord command changes**

### v2.2.0 (2025-12-28)
- Added `!invest` command for investment transfers
- Added `!invest status` for monthly summary
- Created SL_Investment_Log sheet
- Supports 5 destinations

### v2.1.0 (2025-12-28)
- Added `!income` command for salary/youtube/other
- Added `!ta` command for Time Account hours
- Added `!income status` for completion check
- Added automated monthly reminders
- Created SL_Income_Log sheet

### v2.0.0 (2025-12-17)
- Migrated from Pipedream to Cloudflare + Render.com
- Added Gemini AI parsing
- Multi-transaction support
- Extended spender aliases
- Enhanced date parsing

---

**END OF UNIFIED BLUEPRINT v2.3.0**

*Last Updated: 2026-01-11 23:30:00 UTC+2*  
*Status: Production (Full MVP + Income/Investment + Enhanced API)*  
*Next Review: After implementing first post-MVP feature*
