# ShadowLedger Module - Unified Blueprint

```yaml
version: v2.2.0
last_updated: 2025-12-28 22:45:00 UTC+2
status: Production (Full MVP + Income/Investment)
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
9. [Implementation Details](#9-implementation-details)
10. [Deployment Guide](#10-deployment-guide)
11. [Roadmap](#11-roadmap)
12. [Maintenance & Operations](#12-maintenance--operations)

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

### 1.2 Current Status: Production v2.2.0

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

**🎯 Completed Features (1-16):**

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

### 1.3 Technology Stack

| Component | Technology | Cost | Status |
|-----------|------------|------|--------|
| Backend | Google Apps Script v2.2 | Free | ✅ Live |
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
- **Budget Categories:** 17 (€4,090/month total)
- **Built-in Patterns:** 58 merchant mappings
- **Supported Users:** 2 (H/W with cross-recording)
- **Uptime:** 24/7 (serverless architecture)
- **Daily Capacity:** 100,000 requests (Cloudflare free tier)
- **Monthly Uptime:** 750 hours (Render.com free tier)

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SHADOWLEDGER v2.2 ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER (Mobile/Desktop)                                                      │
│       ↓                                                                     │
│  ┌──────────────────┐                                                       │
│  │    Discord       │  "45 rewe" / "!income 4200 salary h"                  │
│  │   #expenses      │                                                       │
│  └────────┬─────────┘                                                       │
│           ↓ WebSocket                                                       │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │          Discord Bot (Render.com)                        │               │
│  │  • Node.js + discord.js                                  │               │
│  │  • Keep-alive HTTP server (prevents sleep)               │               │
│  │  • 750 hrs/month free (24/7 coverage)                    │               │
│  └────────┬─────────────────────────────────────────────────┘               │
│           ↓ POST /forward                                                   │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │        Cloudflare Worker (Relay)                         │               │
│  │  • Edge computing (global, <50ms)                        │               │
│  │  • 100K requests/day free                                │               │
│  └────────┬─────────────────────────────────────────────────┘               │
│           ↓ POST to Apps Script                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │        Google Apps Script v2.2 (Backend Logic)                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │ Command Router                                                 │  │   │
│  │  │ • Expense logging (default)                                    │  │   │
│  │  │ • !income → Income handler                                     │  │   │
│  │  │ • !invest → Investment handler                                 │  │   │
│  │  │ • !ta → Time Account handler                                   │  │   │
│  │  │ • !status, !ytd, !undo → Query handlers                        │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └─────────┬────────────────────────────────────────────────────────────┘   │
│            ↓ Write to Sheets                                                │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │          Google Sheets (Database)                        │               │
│  │  • ShadowLedger (expenses)                               │               │
│  │  • SL_Budget (budget tracking)                           │               │
│  │  • SL_Patterns (merchant rules)                          │               │
│  │  • SL_Config (settings)                                  │               │
│  │  • SL_Income_Log (income/TA) [NEW v2.1]                  │               │
│  │  • SL_Investment_Log (investments) [NEW v2.2]            │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Details

#### Discord Bot (Render.com)
- **Language:** Node.js
- **Library:** discord.js v14
- **Hosting:** Render.com Web Service (free tier)
- **Features:**
  - MESSAGE CONTENT INTENT enabled
  - Keep-alive HTTP server on port 10000
  - Self-ping every 14 minutes
  - Channel filtering (#expenses only)

#### Cloudflare Worker (Relay)
- **Runtime:** Cloudflare Workers (V8 isolate)
- **Purpose:** Relay messages to Apps Script
- **Configuration:** `APPS_SCRIPT_URL` environment variable
- **Limits:** 100,000 requests/day

#### Google Apps Script (Backend)
- **Version:** 2.2.0
- **Key Functions:**
  - `doPost()` - Main entry from Cloudflare
  - `doGet()` - Dashboard API endpoints
  - `processDiscordMessage()` - Route to handlers
  - `handleCommand()` - Command dispatcher
  - `handleIncomeCommand()` - Income logging
  - `handleInvestCommand()` - Investment logging
  - `handleTACommand()` - Time Account logging

### 2.3 API Endpoints (doGet)

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `?action=test` | Health check | Returns version, features |
| `?action=dashboard` | Financial data for Sankey | Dashboard integration |
| `?action=expenses&month=YYYY-MM` | Expense breakdown | Category totals |

---

## 3. DATA SCHEMA

### 3.1 Google Sheets Structure

**Sheet:** `FinanceSource_v6.1.xlsx`

| Tab | Purpose | Version |
|-----|---------|---------|
| ShadowLedger | Transaction log (expenses) | v2.0 |
| SL_Budget | Monthly budget tracking | v2.0 |
| SL_Patterns | Merchant-to-category mappings | v2.0 |
| SL_Config | System configuration | v2.0 |
| SL_Income_Log | Income and TA tracking | v2.1 |
| SL_Investment_Log | Investment transfers | v2.2 |

### 3.2 ShadowLedger Tab (Expenses)

| Column | Name | Type | Example |
|--------|------|------|---------|
| A | txn_id | Text | SL-20251217-143025-742 |
| B | created_at | Datetime | 2025-12-17T14:30:25 |
| C | txn_date | Date | 2025-12-17 |
| D | amount | Number | 45.00 |
| E | merchant | Text | Rewe |
| F | merchant_orig | Text | rewe |
| G | category | Text | Groceries + Food |
| H | categorization | Text | pattern |
| I | spender | Text | H |
| J | inputter | Text | W |

**Transaction ID Format:** `SL-YYYYMMDD-HHmmss-XXX`

### 3.3 SL_Budget Tab

| Column | Name | Type | Example |
|--------|------|------|---------|
| A | category | Text | Groceries + Food |
| B | budget | Number | 600 |
| C | month_key | Text | '2025-12 |
| D | spent | Formula | =SUMIFS(...) |
| E | remaining | Formula | =B2-D2 |
| F | percent | Formula | =D2/B2 |

### 3.4 SL_Patterns Tab

| Column | Name | Type | Example |
|--------|------|------|---------|
| A | pattern | Text | rewe |
| B | category | Text | Groceries + Food |

**Built-in Patterns (58 total):** rewe, lidl, edeka, aldi, shell, aral, amazon, zalando, lieferando, etc.

### 3.5 SL_Config Tab

| Key | Value | Description |
|-----|-------|-------------|
| discord_webhook_url | https://discord.com/... | Response webhook |
| h_discord_username | username | Husband's Discord |
| w_discord_username | username | Wife's Discord |
| gemini_api_key | AIza... | Optional AI key |

### 3.6 SL_Income_Log Tab (v2.1)

| Column | Header | Type | Example |
|--------|--------|------|---------|
| A | ID | Text | INC-20251228-143025 |
| B | MonthKey | Text | 2025-12 |
| C | Type | Text | salary / youtube / other / ta_h / ta_w |
| D | Amount | Number | 4200.00 |
| E | Spender | Text | H / W / (blank) |
| F | Description | Text | Optional notes |
| G | Timestamp | Datetime | 2025-12-28T14:30:25 |
| H | InputBy | Text | Discord username |

**Auto-created** on first `!income` or `!ta` command if not exists.

### 3.7 SL_Investment_Log Tab (v2.2)

| Column | Header | Type | Example |
|--------|--------|------|---------|
| A | ID | Text | INV-20251228-143025 |
| B | Date | Date | 2025-12-28 |
| C | MonthKey | Text | 2025-12 |
| D | Amount | Number | 500.00 |
| E | Destination | Text | scalable |
| F | Notes | Text | Monthly DCA |
| G | Timestamp | Datetime | 2025-12-28T14:30:25 |
| H | InputBy | Text | Discord username |

**Auto-created** on first `!invest` command if not exists.

**Valid Destinations:** scalable, revolut, comdirect, trade_republic, other

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
45€ rewe
rewe 45€
18e rewe          # 'e' accepted as euro symbol
45 rewe w
45 rewe wife
w 45 rewe
wife rewe 45
45 rewe yesterday
45 rewe 15.12
45 rewe w 15.12
rewe 45€ wife yesterday
football ticket 25 anh
```

**Multi-Transaction (Batch):**
```
45 rewe
30 lidl
15 dm
```
Use Shift+Enter for new lines.

### 4.2 Spender Aliases

| Spender | Aliases |
|---------|---------|
| **H** (Husband) | h, husband, nha, anh, aaron |
| **W** (Wife) | w, wife, trang, chang, em |

**Default:** Uses inputter's identity if no spender specified.

### 4.3 Date Parsing

| Format | Example |
|--------|---------|
| Relative | yesterday, today, tomorrow |
| Day.Month | 15.12, 06.03, 1.1 |
| Month/Day | 12/15, 3/6 |
| Natural | march 6, december 15 |

### 4.4 Categories (17 Total)

```javascript
const CATEGORIES = [
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
  'Buffer'  // Default for unmatched
];
```

---

## 5. INCOME TRACKING

### 5.1 Overview (v2.1)

Income tracking enables logging salary, YouTube revenue, and other income directly via Discord. Data flows to `SL_Income_Log` sheet and integrates with the Monthly_Model.

**Key Design Decisions:**
- **ADR-018:** Income targets PREVIOUS month (not current)
- **ADR-019:** Salary requires spender (H/W); YouTube does not
- **ADR-020:** Update-in-place for duplicate entries (prevents double-counting)

### 5.2 Income Command

**Format:**
```
!income [amount] [type] [spender] [description]
```

**Types:**

| Type | Requires Spender | Example |
|------|------------------|---------|
| salary | Yes (H/W) | `!income 4200 salary h` |
| youtube | No | `!income 1200 youtube` |
| other | No | `!income 50 other payback` |

**Examples:**
```
!income 4200 salary h       # Husband's net salary
!income 3800 salary w       # Wife's net salary
!income 1200 youtube        # YouTube gross
!income 50 other payback    # Other income with description
```

### 5.3 Time Account Command

**Format:**
```
!ta [hours] [h/w]
```

**Examples:**
```
!ta 45 h    # Husband added 45 hours
!ta 38 w    # Wife added 38 hours
```

Logs to `SL_Income_Log` as type `ta_h` or `ta_w`.

### 5.4 Income Status Command

```
!income status
```

Shows completion status for previous month:
- ✅ H Net Salary: €4,200.00
- ✅ W Net Salary: €3,800.00
- ✅ YouTube Gross: €1,200.00
- ➖ Other Income: €0 (assumed)
- ✅ H TA Hours: 45 hrs
- ✅ W TA Hours: 38 hrs

### 5.5 Automated Reminders

**Trigger:** Time-driven (8-9 AM daily)
**Active Days:** 1, 6, 11, 16, 21, 26 of each month
**Behavior:** Checks if previous month's inputs are complete; sends Discord reminder if not.

**Setup Required:** Create time trigger for `checkAndSendIncomeReminder` function in Apps Script.

---

## 6. INVESTMENT TRACKING

### 6.1 Overview (v2.2)

Investment tracking logs transfers to investment accounts. Unlike income (which reconciles past months), investments are logged in real-time.

**Key Design Decisions:**
- **ADR-023:** Investment logs to CURRENT month
- **ADR-024:** Each entry creates new row (no update-in-place)
- **ADR-025:** Destination is required from predefined list

### 6.2 Invest Command

**Format:**
```
!invest [amount] [destination] [notes]
```

**Valid Destinations:**
- scalable
- revolut
- comdirect
- trade_republic
- other

**Examples:**
```
!invest 500 scalable              # Basic transfer
!invest 1000 revolut ETF purchase # With notes
!invest 2000 comdirect monthly DCA
```

### 6.3 Investment Status Command

```
!invest status
```

Shows current month's investment transfers:
- By Destination breakdown
- Recent transfers (last 5)
- Total amount and count

### 6.4 Income vs Investment Comparison

| Aspect | Income (!income) | Investment (!invest) |
|--------|------------------|----------------------|
| Target month | Previous | Current |
| Update behavior | Update-in-place | Append new row |
| When to use | After payslip (reconciliation) | When transfer happens |
| Spender required | For salary only | N/A |

---

## 7. BUDGET MONITORING

### 7.1 Budget Status Command

```
!status
```

Shows all categories with spent/budget/percentage and color-coded status.

**Status Indicators:**
- 🟢 Green: <50% used
- 🟡 Yellow: 50-79% used
- 🟠 Orange: 80-99% used
- 🔴 Red: ≥100% used (over budget)

### 7.2 Budget Left Command

```
!budgetleft
```

Shows remaining budget for each category.

### 7.3 YTD Command

```
!ytd
```

Year-to-date spending by category.

### 7.4 Today/Week Commands

```
!today    # Today's transactions
!week     # This week's transactions
```

---

## 8. DISCORD INTEGRATION

### 8.1 Full Command Reference

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

### 8.2 Response Format

**Expense Logged:**
```
✅ **Logged:** €45.00 → Groceries + Food
📝 Merchant: Rewe
👤 Spender: H
🏷️ Category: Groceries + Food (pattern)

─────────────────────────────
📊 **BUDGET STATUS**
─────────────────────────────
**Groceries + Food:** €245/€600 (41%) 🟢
─────────────────────────────
```

**Batch Logged:**
```
📋 **BATCH LOGGED** (3/3)
─────────────────────────────
✦ €45.00 → Groceries + Food
✦ €30.00 → Groceries + Food
✦ €15.00 → Health & beauty
─────────────────────────────
**Total:** €90.00

📊 **Budget Status:**
🟢 Groceries + Food: €275/€600 (46%)
🟢 Health & beauty: €15/€100 (15%)
```

---

## 9. IMPLEMENTATION DETAILS

### 9.1 Architectural Decision Records (ADRs)

**ADR-011: Transaction ID Format**
- Format: `SL-YYYYMMDD-HHmmss-XXX` (seconds + 3-digit random)
- Prevents collisions within same minute

**ADR-012: Row-by-ID Deletion**
- Undo searches by txn_id, not row number
- Prevents race conditions if other transactions added

**ADR-013: Timestamp Formatting**
- All dates formatted as `yyyy-MM-dd'T'HH:mm:ss` before sheet write
- Prevents UTC misinterpretation by Google Sheets

**ADR-014: Euro Symbol Flexibility**
- Accepts both `€` and `e` as currency indicator
- Constraint: `e` must not be followed by letters

**ADR-015: Spender Word Boundary**
- Uses space-based separation, not `\b` regex
- Prevents "rewe w" → "ree" bug

**ADR-016: Gemini Fallback**
- Gemini AI is primary parser
- Regex fallback if API unavailable
- Pattern matching before AI for known merchants

**ADR-017: Income Scope**
- Extend ShadowLedger to income tracking
- Same Discord interface, unified experience

**ADR-018: Income Targets Previous Month**
- Payslips arrive at month-end
- AdSense finalizes 3rd-5th of following month

**ADR-019: Salary Requires Spender**
- Two salaries (H/W), one YouTube stream
- YouTube doesn't need spender specification

**ADR-020: Update-in-Place for Income**
- Duplicate type+spender+month updates existing row
- Prevents double-counting when correcting entries

**ADR-021: Separate Income Sheet**
- `SL_Income_Log` separate from expense ledger
- Different schema (MonthKey vs TxnDate)

**ADR-022: Investment Scope**
- Track transfers to investment accounts
- Transfer amounts only (not portfolio balances)

**ADR-023: Investment Targets Current Month**
- Real-time logging as transfers happen
- Unlike income reconciliation

**ADR-024: Investment Append Mode**
- Each `!invest` creates new row
- Multiple transfers per month are valid

**ADR-025: Required Destination**
- Predefined list: scalable, revolut, comdirect, trade_republic, other
- Enables breakdown reporting

**ADR-026: Separate Investment Sheet**
- `SL_Investment_Log` separate from income
- Different primary key (Date vs MonthKey)

### 9.2 Parsing Logic (Technical)

**Spender Detection Regex:**
```javascript
// Space-based separation to avoid "rewe w" bug
const spenderRegex = /(?:^|\s)(h|w|husband|wife|nha|anh|aaron|trang|chang|em)(?:\s|$)/i;
```

**Amount Extraction:**
```javascript
// Handles €, e suffix, and plain numbers
const amountRegex = /(\d+(?:[.,]\d{1,2})?)\s*[€e]?|[€e]\s*(\d+(?:[.,]\d{1,2})?)/i;
```

**Income Entry Update Logic:**
```javascript
// Check for existing entry (same type + spender + month)
for (let i = 1; i < data.length; i++) {
  if (data[i][1] === monthKey && 
      data[i][2] === type && 
      data[i][4] === (spender || '')) {
    existingRow = i + 1;
    break;
  }
}
// Update existing or append new
```

### 9.3 Bug Fixes History

| Bug | Root Cause | Fix | ADR |
|-----|------------|-----|-----|
| Timestamps 9 hours off | Raw Date() written | Format before write | ADR-013 |
| "rewe w" → "ree" | `\b` word boundary | Space-based regex | ADR-015 |
| Transaction ID collisions | Same minute | Add seconds + random | ADR-011 |
| Undo row shift | Row numbers change | Search by ID at delete | ADR-012 |
| month_key mismatch | Apostrophe prefix | Strip `'` when comparing | v2.0 |

---

## 10. DEPLOYMENT GUIDE

### 10.1 Prerequisites

1. Google Account with Apps Script
2. Discord Account and server
3. Cloudflare Account (free tier)
4. Render.com Account (free tier)
5. GitHub Account
6. Gemini API Key (optional)

### 10.2 Setup Reference

**Detailed Setup Guide:** `ShadowLedger_Cloudflare_Migration_Guide_v4.md`

**Quick Steps:**
1. Google Sheets: Ensure all tabs exist
2. Apps Script: Deploy `ShadowLedger_Code.gs` as web app
3. Cloudflare: Create worker with `APPS_SCRIPT_URL` env var
4. GitHub: Create bot repository
5. Render.com: Deploy bot with env vars
6. Discord: Create bot with MESSAGE CONTENT INTENT

### 10.3 Income Reminder Setup

To enable automated income reminders:

1. Open Apps Script editor
2. Click ⏰ Triggers (left sidebar)
3. Add Trigger:
   - Function: `checkAndSendIncomeReminder`
   - Event source: Time-driven
   - Type: Day timer
   - Time: 8am to 9am
4. Save

### 10.4 Testing Checklist

- [ ] Bot online (green dot)
- [ ] `45 rewe` → Expense logged
- [ ] `!status` → Budget table shows
- [ ] `!income 100 salary h` → Income logged (to previous month)
- [ ] `!income status` → Shows completion
- [ ] `!invest 100 scalable` → Investment logged (to current month)
- [ ] `!invest status` → Shows transfers
- [ ] `!ta 10 h` → TA hours logged
- [ ] `!undo` → Confirmation shows
- [ ] `!help` → Full command list

---

## 11. ROADMAP

### 11.1 Completed Features (v2.0-2.2)

All features 1-16 are now **IMPLEMENTED**. See Section 1.2.

### 11.2 Future Enhancements (Post-MVP)

**🟢 HIGH PRIORITY - Quick Wins**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 17 | Pattern Learning (auto-suggest after 5+ same merchant) | 5-6h | High |
| 18 | Historical Data Import (CSV upload) | 3-4h | High |
| 19 | Category Editing (!recategorize) | 3-4h | Medium |
| 20 | Scheduled Daily Summary (21:00 CET) | 3-4h | High |

**🔵 MEDIUM PRIORITY - Value Additions**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 21 | Scheduled Weekly Summary | 2-3h | Medium |
| 22 | Receipt Image Recognition (OCR) | 8-10h | High |
| 23 | Budget Adjustment Commands | 4-5h | Medium |
| 24 | Manual Entry Guide (documentation) | 1-2h | Low |

**🟣 LOW PRIORITY - Nice to Have**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 25 | Recurring Expenses Auto-Log | 4-5h | Medium |
| 26 | Multi-Currency Support | 6-8h | Low |
| 27 | Voice Input (Voice Notes) | 8-10h | Medium |
| 28 | Analytics Dashboard (charts) | 10-12h | Medium |

### 11.3 Technical Debt

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Full sheet reads for patterns | Performance | 3-4h | Medium |
| No retry logic for failures | Lost transactions | 2h | Medium |
| Manual budget formula setup | Setup friction | 2h | Low |
| Code modularization | Maintainability | 8-10h | Low |
| Unit test coverage | Bug prevention | 6-8h | Low |

### 11.4 Integration Ideas

- 💳 Bank APIs: Auto-import transactions
- 📧 Email parsing: Receipt emails
- 🦊 Wise/Revolut API: Transaction sync
- 📊 Data Studio: Professional dashboards

---

## 12. MAINTENANCE & OPERATIONS

### 12.1 Daily Operations

**User Actions:**
- Log expenses via Discord
- Log income/investments as they occur
- Review budget with !status

**System (Automated):**
- Real-time processing
- Keep-alive pings (14 min intervals)
- Budget formula recalculation

### 12.2 Monthly Tasks

**Start of Month:**
1. Run `!income status` to check previous month completion
2. Log any missing income/TA values
3. Review `!invest status` for investment totals

**End of Month:**
1. Run `!status` for final totals
2. Run `!ytd` for year comparison
3. Review AI-categorized items
4. Add new patterns if needed

### 12.3 Health Checks

| Component | Check | Location |
|-----------|-------|----------|
| Discord Bot | Green dot online | Discord server |
| Render.com | Service "Running" | Dashboard |
| Cloudflare | Worker active | Dashboard |
| Apps Script | No errors in logs | Execution log |

### 12.4 Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Bot offline | Render service sleeping | Check keep-alive, redeploy |
| No response | Worker URL wrong | Verify APPS_SCRIPT_URL |
| Wrong category | Pattern missing | Add to SL_Patterns |
| Budget wrong | Formula broken | Check SL_Budget formulas |
| Income not saving | Sheet missing | Run command to auto-create |

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
- `ShadowLedger_Code.gs` (v2.2.0)

**GitHub Repository:**
- `index.js` (Discord bot)
- `package.json`

**Cloudflare:**
- Worker code (in dashboard)

**Documentation:**
- `BLUEPRINT_ShadowLedger_v2_2_0.md` ← This file
- `ShadowLedger_Cloudflare_Migration_Guide_v4.md` (setup guide)

### Historical Files (Safe to Delete)

| File | Reason |
|------|--------|
| `ShadowLedger_Blueprint.md` | Duplicate of v2.0.0 Blueprint |
| `ShadowLedger_Setup.md` | Duplicate of Migration Guide |
| `BLUEPRINT_ShadowLedger_v2_0_0.md` | Superseded by v2.2.0 |
| `ShadowLedger_Blueprint_changelog_20251228_1830.md` | ADRs absorbed |
| `ShadowLedger_Blueprint_changelog_20251228_1945.md` | ADRs absorbed |

---

**END OF UNIFIED BLUEPRINT v2.2.0**

*Last Updated: 2025-12-28 22:45:00 UTC+2*  
*Status: Production (Full MVP + Income/Investment)*  
*Next Review: After implementing first post-MVP feature*
