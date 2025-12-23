# ShadowLedger: Cloudflare Workers Migration Guide v4

**Complete Beginner's Guide €” 100% Browser-Based, No Terminal Required**  
**Date:** 2025-12-17  
**Estimated Time:** 45-60 minutes  
**Difficulty:** Beginner-friendly (all done in web browser)

---

## Table of Contents

1. [Understanding the Problem](#1-understanding-the-problem)
2. [Understanding the Solution](#2-understanding-the-solution)
3. [Architecture Deep Dive](#3-architecture-deep-dive)
4. [Prerequisites Checklist](#4-prerequisites-checklist)
5. [Part A: Create Cloudflare Worker (Browser Only)](#5-part-a-create-cloudflare-worker-browser-only)
6. [Part B: Prepare Your Existing Discord Bot](#6-part-b-prepare-your-existing-discord-bot)
7. [Part C: Deploy Bot to Render.com (Free Tier)](#7-part-c-deploy-bot-to-rendercom-free-tier)
8. [Part D: Test the Complete System](#8-part-d-test-the-complete-system)
9. [Part E: Disable Pipedream](#9-part-e-disable-pipedream)
10. [Understanding What We Built](#10-understanding-what-we-built)
11. [Maintenance & Monitoring](#11-maintenance--monitoring)
12. [Troubleshooting Guide](#12-troubleshooting-guide)
13. [Quick Reference Card](#13-quick-reference-card)

---

## 1. Understanding the Problem

### What's Happening Now?

Your current ShadowLedger setup uses **Pipedream** as a "middleman" between Discord and Google Apps Script:

```
You type "45 rewe" in Discord
            
    Discord Message
            
    Pipedream catches it   PROBLEM: Rate limited!
            
    Sends to Google Apps Script
            
    Expense logged + Discord responds
```

### Why Pipedream is Failing

Pipedream's free tier has strict limits:

| Limit Type | Pipedream Free | Your Usage |
|------------|----------------|------------|
| Daily invocations | ~100 | Exceeded  |
| Monthly invocations | ~1,000 | Exceeded  |

Every time you or your wife logs an expense, that's one invocation. Every command (`!status`, `!help`, `!today`) is another invocation. You've simply outgrown Pipedream's free tier.

### Why Not Just Pay for Pipedream?

You could, but why pay when free alternatives exist with **100x more capacity**?

---

## 2. Understanding the Solution

### The New Architecture

We're replacing Pipedream with **two free cloud services**:

```
You type "45 rewe" in Discord
            
    Discord Message
            
    Discord Bot (hosted on Render.com FREE)  Catches messages
            
    Cloudflare Worker (FREE)  Relays to Apps Script
            
    Google Apps Script (unchanged)
            
    Expense logged + Discord responds
```

### Why Two Services Instead of One?

#### The Discord Limitation

Discord has two types of "webhooks":
- **Incoming Webhooks**: Send messages TO Discord (like bot responses)
- **Outgoing Messages**: Messages FROM users in Discord

Discord doesn't offer a simple webhook for outgoing messages. To capture what users type, you need a **Discord Bot** that "listens" to the channel.

**Good news:** You already have a Discord bot set up! We just need to host it somewhere other than Pipedream.

#### Why Not Just Discord Bot -> Apps Script Directly?

We could! But there's an advantage to having Cloudflare in the middle:

| Approach | Pros | Cons |
|----------|------|------|
| Bot -> Apps Script directly | Simpler | If Apps Script URL changes, must redeploy bot |
| Bot -> Cloudflare -> Apps Script | Can change Apps Script URL without redeploying bot; Cloudflare adds logging/monitoring | Slightly more complex |

For your use case, the Cloudflare layer adds:
- **Better logging** (see all requests in dashboard)
- **Flexibility** (change Apps Script URL via secret, no redeploy)
- **Future-proofing** (can add rate limiting, caching, etc.)

### Why These Specific Services?

| Service | Role | Why This One? |
|---------|------|---------------|
| **Render.com** | Host Discord bot | Free tier available, auto-deploys from GitHub |
| **Cloudflare Workers** | Relay messages | 100K requests/day free, global edge, 50ms latency |
| **Google Apps Script** | Process expenses | Already working, no changes needed |

### Cost Comparison

| Service | Free Tier Limit | Your Needs | Status |
|---------|-----------------|------------|--------|
| Pipedream | 100/day | ~20-50/day |  Exceeded |
| Render.com (Web Service) | 750 hours/month | 720 hours (24/7) | ✅ Plenty |
| Cloudflare | 100,000/day | ~20-50/day | ✅ Plenty |

**Total cost: 0/month**

---

## 3. Architecture Deep Dive

### Visual Architecture

```

                     SHADOWLEDGER CLOUD ARCHITECTURE                      

                                                                          
                                                     
     You / Wife                                                       
    Discord App                                                        
                                                     
            Type: "45 rewe"                                             
           v                                                              
                                                     
     Discord                                                         
    #expenses                                                          
                                                     
            WebSocket (real-time)                                       
           v                                                              
         
     Discord Bot        WHERE: Render.com (free Web Service)       
    (Node.js)            WHY: Listens 24/7 for Discord messages     
       COST: 0 (750 free hours/month)            
                           NOTE: Has keep-alive to prevent sleep      
                             
            HTTP POST                                                   
           v                                                              
         
     Cloudflare         WHERE: Cloudflare Edge Network             
    Worker               WHY: Fast relay, logging, 100K/day free    
       COST: 0 (100K requests/day)               
                             
            HTTP POST                                                   
           v                                                              
         
    📊 Google Apps        WHERE: Google Cloud (via Apps Script)      
    Script               WHY: Your existing code, no changes        
       COST: 0 (included with Google account)    
                             
                                                                         
                                                            
     v           v                                                        
                                                     
  Sheets   Discord                                                   
   Log     Response                                                  
                                                     
                                                                          

```

### Data Flow Explained

1. **You type `45 rewe`** in Discord #expenses channel
2. **Discord Bot** (running 24/7 on Render.com) receives the message via WebSocket
3. **Bot forwards** the message to Cloudflare Worker via HTTP POST
4. **Cloudflare Worker** receives it, logs it, forwards to Google Apps Script
5. **Apps Script** parses "45 rewe", logs expense to Google Sheets, calculates budget
6. **Apps Script** sends response back to Discord via webhook
7. **You see** the confirmation message in Discord

**Total time: ~1-2 seconds**

---

## 4. Prerequisites Checklist

Before starting, gather these items:

### You Already Have (from existing ShadowLedger setup)

- ✅ **Discord server** "Aaron Family Finance" with #expenses channel
- ✅ **Discord bot** already created and invited to server
- ✅ **Google Apps Script** already deployed and working
- ✅ **Discord webhook** for bot responses (in SL_Config)

### You Need to Retrieve

- [ ] **Google Apps Script Web App URL**
  - Looks like: `https://script.google.com/macros/s/AKfycbw.../exec`
  - Find it: Google Sheets -> Extensions -> Apps Script -> Deploy -> Manage deployments
  
- [ ] **Discord Bot Token** (we'll get this in Part B)

### New Accounts to Create

- [ ] Cloudflare account (free)
- [ ] GitHub account (free, if you don't have one)
- [ ] Render.com account (free)

### What You WON'T Need

-  No Terminal/Command Line
-  No software installation
-  No coding on your computer
-  No Mac/PC required to stay on

**Everything is done in your web browser!**

### Write Down Your Information

Fill these in as you go:

```

                        MY CONFIGURATION                              

                                                                      
 Apps Script URL:                                                     
 ________________________________________________________________    
                                                                      
 Cloudflare Worker URL:                                               
 ________________________________________________________________    
                                                                      
 Discord Bot Token:                                                   
 ________________________________________________________________    
                                                                      
 Render Service URL:                                                  
 ________________________________________________________________    
                                                                      

```

---

## 5. Part A: Create Cloudflare Worker (Browser Only)

**Time: 15 minutes**  
**Tools needed: Just your web browser**

### Why Cloudflare First?

We set up Cloudflare first because we need its URL to configure the Discord bot later. Think of it as building the highway before the cars can drive on it.

---

### Step A1: Create Cloudflare Account

1. Open your browser

2. Go to: **https://dash.cloudflare.com/sign-up**

3. Enter your **email address**

4. Create a **strong password**

5. Click **"Sign up"**

6. Check your email for verification link and click it

7. When asked about adding a domain, click **"Skip"** or **"Maybe later"**
   
   *Why skip?* We're using Cloudflare Workers, which don't need a domain.

### Step A2: Navigate to Workers & Pages

1. You should now be in the Cloudflare dashboard

2. Look at the **left sidebar**

3. Click **"Workers & Pages"**

### Step A3: Create a New Worker

1. Click the blue **"Create"** button

2. Click **"Create Worker"**

3. You'll see a page titled "Create an application"

4. For **"Name"**, type: `shadowledger-relay`

5. Click **"Deploy"**

   *This creates a basic "Hello World" worker. We'll replace the code next.*

### Step A4: Edit the Worker Code

1. After deployment, you'll see a success screen

2. Click **"Edit code"** button

3. You'll see a code editor in your browser with some default code

4. **Delete ALL the existing code** (select all with Ctrl+A or Cmd+A, then delete)

5. **Copy and paste this ENTIRE code block:**

```javascript
/**
 * ShadowLedger Cloudflare Worker
 * 
 * PURPOSE: Receives expense messages from Discord bot and forwards to Google Apps Script
 * 
 * Flow: Discord Bot -> THIS WORKER -> Google Apps Script
 * 
 * Version: 1.0.0
 * Date: 2025-12-17
 */

export default {
  async fetch(request, env, ctx) {
    
    // 
    // STEP 1: Handle different request types
    // 
    
    // GET request = someone visiting the URL in a browser (useful for testing)
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        service: 'ShadowLedger Relay',
        status: 'running',
        message: 'This endpoint accepts POST requests from the Discord bot.',
        timestamp: new Date().toISOString()
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Only accept POST requests (from Discord bot)
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: `Method ${request.method} not allowed. Use POST.`
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 
    // STEP 2: Parse the incoming message from Discord bot
    // 
    
    try {
      const payload = await request.json();
      
      // Log for debugging (visible in Cloudflare dashboard -> Workers -> Logs)
      console.log(' Received from Discord bot:', JSON.stringify(payload));

      // Extract message content and username
      const messageContent = payload.content || '';
      const username = payload.username || 'unknown';

      // 
      // STEP 3: Validate the message
      // 
      
      // Skip empty messages
      if (!messageContent.trim()) {
        console.log(' Skipping: Empty message');
        return new Response(JSON.stringify({
          success: true,
          action: 'skipped',
          reason: 'Empty message'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 
      // STEP 4: Get Apps Script URL from environment variable
      // 
      
      const appsScriptUrl = env.APPS_SCRIPT_URL;
      
      if (!appsScriptUrl) {
        console.error(' APPS_SCRIPT_URL variable not configured!');
        return new Response(JSON.stringify({
          success: false,
          error: 'Server misconfiguration: Missing APPS_SCRIPT_URL variable'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 
      // STEP 5: Forward to Google Apps Script
      // 
      
      const appsScriptPayload = {
        content: messageContent,
        username: username
      };

      console.log(' Forwarding to Apps Script:', JSON.stringify(appsScriptPayload));

      const appsScriptResponse = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appsScriptPayload)
      });

      // 
      // STEP 6: Return the response
      // 
      
      const responseText = await appsScriptResponse.text();
      console.log('✅ Apps Script response:', responseText);

      return new Response(JSON.stringify({
        success: true,
        message: 'Forwarded to ShadowLedger',
        appsScriptStatus: appsScriptResponse.status,
        appsScriptResponse: responseText
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error(' Error:', error.toString());
      
      return new Response(JSON.stringify({
        success: false,
        error: error.toString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
```

6. Click **"Save and deploy"** (button at top right)

### Step A5: Get Your Worker URL

1. After saving, look at the top of the page

2. You'll see your worker URL. It looks like:
   ```
   https://shadowledger-relay.YOUR-SUBDOMAIN.workers.dev
   ```

3. **Copy this URL** and write it down:
   ```
   Cloudflare Worker URL: ________________________________
   ```

### Step A6: Add Your Apps Script URL as Environment Variable

1. Click **"Settings"** tab (at the top of your worker page)

2. Scroll down to find **"Variables and Secrets"** section

3. Click **"Add"** button

4. Choose **"Add variable"**

5. Fill in:
   - **Variable name:** `APPS_SCRIPT_URL`
   - **Value:** Your Google Apps Script Web App URL

6. Click **"Save and deploy"**

### Step A7: Test the Worker

1. Open a **new browser tab**

2. Paste your Cloudflare Worker URL and press Enter

3. You should see:
   ```json
   {
     "service": "ShadowLedger Relay",
     "status": "running",
     "message": "This endpoint accepts POST requests from the Discord bot.",
     "timestamp": "2025-12-17T..."
   }
   ```

### ✅ Checkpoint A Complete!

- [x] Cloudflare account created
- [x] Worker created and deployed
- [x] Apps Script URL configured
- [x] Worker tested and running

---

## 6. Part B: Prepare Your Existing Discord Bot

**Time: 5 minutes**

You already have a Discord bot from your Pipedream setup. We just need to:
1. Enable a required permission
2. Get the bot token

---

### Step B1: Go to Discord Developer Portal

1. Open: **https://discord.com/developers/applications**

2. Log in with your Discord account

### Step B2: Find Your Existing Bot

1. You should see your existing **"ShadowLedger"** application in the list

2. Click on it to open

### Step B3: Enable MESSAGE CONTENT INTENT (Critical!)

This is the most important step. Without this, the bot cannot read message contents.

1. In the left sidebar, click **"Bot"**

2. Scroll down to **"Privileged Gateway Intents"**

3. Find **"MESSAGE CONTENT INTENT"**

4. Make sure it is **toggled ON** (purple/blue)

   *Why is this needed?* Pipedream used Discord's built-in integration which didn't need this. But our self-hosted bot using discord.js **requires** this permission to read what messages say. Without it, the bot sees that messages exist but can't read the content €” like an assistant who knows mail arrived but can't open the envelopes!

5. Click **"Save Changes"** if you made any changes

### Step B4: Get Your Bot Token

1. Still on the **"Bot"** page

2. Find the **"Token"** section (near the top)

3. Click **"Reset Token"**

4. Click **"Yes, do it!"** to confirm

5. **IMMEDIATELY copy the token** that appears

6. Write it down:
   ```
   Discord Bot Token: ________________________________
   ```

** CRITICAL WARNINGS:**
- This token is shown **ONCE**. If you leave without copying, you must reset again.
- Keep this token **SECRET**. Anyone with it can control your bot.
- **NEVER** share this token publicly.

### Step B5: Verify Bot is Still in Server

1. Open Discord

2. Go to "Aaron Family Finance" server

3. Check member list €” **ShadowLedger** bot should be there (will show offline for now)

### ✅ Checkpoint B Complete!

- [x] MESSAGE CONTENT INTENT enabled
- [x] Bot token copied
- [x] Bot still in server

---

## 7. Part C: Deploy Bot to Render.com (Free Tier)

**Time: 20 minutes**

### Important: Using Web Service (Not Background Worker)

Render.com removed free tier for Background Workers, but **Web Service still has a free tier**. The difference:

| Type | Free Tier? | Behavior |
|------|-----------|----------|
| Background Worker |  No ($7/mo minimum) | Runs continuously |
| Web Service | ✅ Yes (750 hrs/mo) | Sleeps after 15 min of no HTTP requests |

**The trick:** We add a "keep-alive" mechanism to our bot that pings itself every 14 minutes, preventing sleep. The bot works exactly the same way.

---

### Step C1: Create GitHub Account (If Needed)

*Skip this if you already have a GitHub account.*

1. Go to: **https://github.com/signup**
2. Create account with email, password, username
3. Verify your email

### Step C2: Create a New GitHub Repository

1. Go to: **https://github.com**

2. Click **"+"** (top right) -> **"New repository"**

3. Fill in:
   - **Repository name:** `shadowledger-discord-bot`
   - **Description:** `Discord bot for ShadowLedger expense tracking`
   - **Visibility:** **Private**
   - **Check:** ✅ "Add a README file"

4. Click **"Create repository"**

### Step C3: Create the Bot Code File (index.js)

1. In your new repository, click **"Add file"** -> **"Create new file"**

2. For filename, type: **`index.js`**

3. Paste this **entire code** (includes keep-alive mechanism):

```javascript
/**
 * ShadowLedger Discord Bot
 * 
 * PURPOSE: Listens to #expenses channel and forwards messages to Cloudflare Worker
 * 
 * Flow: Discord #expenses -> THIS BOT -> Cloudflare Worker -> Apps Script
 * 
 * Hosted on: Render.com (free Web Service tier)
 * 
 * IMPORTANT: This version includes a keep-alive mechanism to prevent
 * Render's free tier from sleeping after 15 minutes of inactivity.
 * 
 * Version: 1.1.0
 * Date: 2025-12-17
 */

const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

// 
// CONFIGURATION (from environment variables)
// 

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
const EXPENSE_CHANNEL_NAME = process.env.EXPENSE_CHANNEL_NAME || 'expenses';
const PORT = process.env.PORT || 3000;
const RENDER_SERVICE_URL = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_URL;

// 
// VALIDATION
// 

if (!BOT_TOKEN) {
  console.error(' ERROR: DISCORD_BOT_TOKEN environment variable not set!');
  process.exit(1);
}

if (!CLOUDFLARE_WORKER_URL) {
  console.error(' ERROR: CLOUDFLARE_WORKER_URL environment variable not set!');
  process.exit(1);
}

// 
// HTTP SERVER (Required for Render Web Service + Keep-Alive)
// 
// WHY: Render's free Web Service tier requires an HTTP server.
//      We also use this for health checks and keep-alive pings.

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'ShadowLedger Discord Bot',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/ping') {
    // Keep-alive endpoint
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(` HTTP server listening on port ${PORT}`);
});

// 
// KEEP-ALIVE MECHANISM
// 
// WHY: Render's free tier sleeps after 15 minutes of no HTTP requests.
//      We ping ourselves every 14 minutes to stay awake.

function startKeepAlive() {
  if (!RENDER_SERVICE_URL) {
    console.log(' RENDER_EXTERNAL_URL not set - keep-alive disabled (local dev mode)');
    return;
  }
  
  const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
  
  setInterval(async () => {
    try {
      const response = await fetch(`${RENDER_SERVICE_URL}/ping`);
      if (response.ok) {
        console.log(` Keep-alive ping successful at ${new Date().toISOString()}`);
      }
    } catch (error) {
      console.error(' Keep-alive ping failed:', error.message);
    }
  }, KEEP_ALIVE_INTERVAL);
  
  console.log(` Keep-alive started: pinging every 14 minutes`);
}

// 
// DISCORD CLIENT
// 

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,  // Requires MESSAGE CONTENT INTENT enabled!
  ]
});

// 
// BOT READY EVENT
// 

client.once('ready', () => {
  console.log('');
  console.log('   ShadowLedger Bot is ONLINE');
  console.log('');
  console.log(`  Bot User: ${client.user.tag}`);
  console.log(`  Listening to channel: #${EXPENSE_CHANNEL_NAME}`);
  console.log(`  Forwarding to: ${CLOUDFLARE_WORKER_URL}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('');
  
  // Start keep-alive after bot is ready
  startKeepAlive();
});

// 
// MESSAGE EVENT
// 

client.on('messageCreate', async (message) => {
  
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Only process messages from #expenses channel
  if (message.channel.name !== EXPENSE_CHANNEL_NAME) return;
  
  // Log the message
  console.log('');
  console.log(` Message received at ${new Date().toISOString()}`);
  console.log(`   From: ${message.author.username}`);
  console.log(`   Content: "${message.content}"`);
  
  // Forward to Cloudflare Worker
  try {
    const payload = {
      content: message.content,
      username: message.author.username,
      channelId: message.channel.id,
      channelName: message.channel.name,
      guildName: message.guild?.name || 'DM',
      timestamp: message.createdAt.toISOString()
    };
    
    console.log(` Forwarding to Cloudflare Worker...`);
    
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ Successfully forwarded! Status: ${response.status}`);
      console.log(`   Response: ${responseText.substring(0, 200)}`);
    } else {
      console.error(` Worker returned error: ${response.status}`);
      console.error(`   Response: ${responseText}`);
    }
    
  } catch (error) {
    console.error(` Error forwarding message:`, error.message);
  }
  
  console.log('');
});

// 
// ERROR HANDLING
// 

client.on('error', (error) => {
  console.error(' Discord client error:', error);
});

// 
// LOGIN
// 

console.log(' Connecting to Discord...');
client.login(BOT_TOKEN);
```

4. Click **"Commit new file"**

### Step C4: Create package.json File

1. Click **"Add file"** -> **"Create new file"**

2. Filename: **`package.json`**

3. Paste:

```json
{
  "name": "shadowledger-discord-bot",
  "version": "1.1.0",
  "description": "Discord bot for ShadowLedger expense tracking",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "discord.js": "^14.14.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

4. Click **"Commit new file"**

### Step C5: Create Render.com Account

1. Go to: **https://render.com**

2. Click **"Get Started for Free"**

3. Click **"GitHub"** to sign up

4. Authorize Render to access your GitHub

### Step C6: Create New Web Service

1. In Render dashboard, click **"New +"** -> **"Web Service"**

   *Why Web Service (not Background Worker)?* Background Worker no longer has a free tier. Web Service does, and with our keep-alive code, it works the same way.

2. Connect your **`shadowledger-discord-bot`** repository

### Step C7: Configure the Web Service

| Setting | Value |
|---------|-------|
| **Name** | `shadowledger-bot` |
| **Region** | `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

### Step C8: Add Environment Variables

Scroll to **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `DISCORD_BOT_TOKEN` | Your bot token from Step B4 |
| `CLOUDFLARE_WORKER_URL` | Your Cloudflare Worker URL from Step A5 |
| `EXPENSE_CHANNEL_NAME` | `expenses` |

### Step C9: Deploy!

1. Click **"Create Web Service"**

2. Wait for deployment (1-2 minutes)

3. Watch the logs. You should see:

```
 HTTP server listening on port 10000
 Connecting to Discord...

   ShadowLedger Bot is ONLINE

  Bot User: ShadowLedger#1234
  Listening to channel: #expenses
  Forwarding to: https://shadowledger-relay.xxxxx.workers.dev
 Keep-alive started: pinging every 14 minutes
```

### Step C10: Get Your Render Service URL

1. At the top of your Render service page, you'll see a URL like:
   ```
   https://shadowledger-bot.onrender.com
   ```

2. Copy this URL

### Step C11: Add Render URL as Environment Variable (For Keep-Alive)

1. Go to **Environment** tab in your Render service

2. Add one more variable:
   | Key | Value |
   |-----|-------|
   | `RENDER_EXTERNAL_URL` | `https://shadowledger-bot.onrender.com` (your URL from Step C10) |

3. Click **"Save Changes"** €” this will trigger a redeploy

### Step C12: Verify Bot is Online

1. Open Discord

2. Go to "Aaron Family Finance" server

3. Check member list €” **ShadowLedger** should show **green dot** (online)

### ✅ Checkpoint C Complete!

- [x] GitHub repository created
- [x] Bot code with keep-alive added
- [x] Render.com Web Service deployed (FREE tier)
- [x] Bot online in Discord

---

## 8. Part D: Test the Complete System

**Time: 10 minutes**

###  Expect Double Responses!

Until you disable Pipedream, **both systems are active**:
- Pipedream processes message -> Response #1
- New system processes message -> Response #2

This is expected and lets you verify the new system works.

---

### Test 1: Basic Expense

1. In Discord #expenses, type: **`45 rewe`**

2. **Check Render.com Logs:**
   ```
    Message received at 2025-12-17T...
      From: aaron
      Content: "45 rewe"
    Forwarding to Cloudflare Worker...
   ✅ Successfully forwarded! Status: 200
   ```

3. **Check Discord:** You should see TWO responses (one from each system)

4. **Check Google Sheets:** New row in ShadowLedger tab

### Test 2: Commands

```
!help
!status
!today
```

Each should work (with double responses until Pipedream is disabled).

### Test 3: Health Check

Open your Render service URL in a browser:
```
https://shadowledger-bot.onrender.com/health
```

Should show:
```json
{
  "status": "healthy",
  "service": "ShadowLedger Discord Bot",
  "uptime": 123.456,
  "timestamp": "2025-12-17T..."
}
```

### Test 4: Keep-Alive

Wait 15+ minutes and check:
- Bot still online in Discord (green dot)
- Render logs show periodic: ` Keep-alive ping successful`

---

## 9. Part E: Disable Pipedream

**Only after all tests pass!**

1. Go to: **https://pipedream.com**

2. Find your ShadowLedger workflow

3. Toggle it **OFF**

4. Test in Discord: **`!status`**
   - Should now see only ONE response

### ✅ Migration Complete!

---

## 10. Understanding What We Built

### Final Architecture

```
Discord #expenses
       
       v
Discord Bot (Render.com FREE Web Service)
        + Keep-alive pings every 14 min
       v
Cloudflare Worker (FREE)
       
       v
Google Apps Script (unchanged)
       
        Google Sheets (log)
        Discord webhook (response)
```

### Cost Summary

| Component | Cost | Limit |
|-----------|------|-------|
| Render.com Web Service | **0** | 750 hrs/month |
| Cloudflare Workers | **0** | 100K/day |
| Google Apps Script | **0** | Included |
| **TOTAL** | **0/month** | |

---

## 11. Maintenance & Monitoring

### Weekly Health Check (2 min)

1. **Render.com:** Service status = "Running"
2. **Discord:** Bot shows green dot
3. **Test:** Send `!status` in #expenses

### Keep-Alive Verification

Check Render logs for periodic:
```
 Keep-alive ping successful at 2025-12-17T...
```

If missing, verify `RENDER_EXTERNAL_URL` environment variable is set.

---

## 12. Troubleshooting Guide

### Bot Shows Offline

**Check:**
1. Render.com -> Is service "Running"?
2. Render logs -> Any errors?

**Common fixes:**
- `DISCORD_BOT_TOKEN` incorrect -> Reset token, update env var
- MESSAGE CONTENT INTENT not enabled -> Enable in Discord Developer Portal

### Messages Not Processing

**Check Render logs:**
- No " Message received" -> MESSAGE CONTENT INTENT disabled
- "Forward failed" -> Check CLOUDFLARE_WORKER_URL

### Bot Goes Offline After 15 Min

**Cause:** Keep-alive not working

**Fix:**
1. Verify `RENDER_EXTERNAL_URL` env var is set correctly
2. Check logs for " Keep-alive started"
3. Redeploy if needed

### Duplicate Messages

**Cause:** Pipedream still enabled

**Fix:** Disable Pipedream workflow

---

## 13. Quick Reference Card

### Daily Usage

```
45 rewe              -> Log 45 at Rewe
27 lidl w            -> Log for Wife
!status              -> Budget overview
!today               -> Today's expenses
!help                -> All commands
```

### Service URLs

| Service | URL |
|---------|-----|
| Cloudflare | https://dash.cloudflare.com |
| Render.com | https://dashboard.render.com |
| Discord Dev | https://discord.com/developers/applications |

### Environment Variables

**Render.com:**
- `DISCORD_BOT_TOKEN`
- `CLOUDFLARE_WORKER_URL`
- `EXPENSE_CHANNEL_NAME`
- `RENDER_EXTERNAL_URL`

**Cloudflare:**
- `APPS_SCRIPT_URL`

---

##  Congratulations!

You've migrated ShadowLedger to a fully free, cloud-based system:

- ✅ 100% browser-based setup
- ✅ 0/month (all free tiers)
- ✅ 100x more capacity than Pipedream
- ✅ Same user experience
- ✅ No Mac required

---

*End of Migration Guide v4*
