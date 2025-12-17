/**
 * ShadowLedger Discord Bot
 * 
 * PURPOSE: Listens to #expenses channel and forwards messages to Cloudflare Worker
 * 
 * Flow: Discord #expenses → THIS BOT → Cloudflare Worker → Apps Script
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

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION (from environment variables)
// ═══════════════════════════════════════════════════════════════════════════

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
const EXPENSE_CHANNEL_NAME = process.env.EXPENSE_CHANNEL_NAME || 'expenses';
const PORT = process.env.PORT || 3000;
const RENDER_SERVICE_URL = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_URL;

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

if (!BOT_TOKEN) {
  console.error('❌ ERROR: DISCORD_BOT_TOKEN environment variable not set!');
  process.exit(1);
}

if (!CLOUDFLARE_WORKER_URL) {
  console.error('❌ ERROR: CLOUDFLARE_WORKER_URL environment variable not set!');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP SERVER (Required for Render Web Service + Keep-Alive)
// ═══════════════════════════════════════════════════════════════════════════
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
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// KEEP-ALIVE MECHANISM
// ═══════════════════════════════════════════════════════════════════════════
// WHY: Render's free tier sleeps after 15 minutes of no HTTP requests.
//      We ping ourselves every 14 minutes to stay awake.

function startKeepAlive() {
  if (!RENDER_SERVICE_URL) {
    console.log('⚠️ RENDER_EXTERNAL_URL not set - keep-alive disabled (local dev mode)');
    return;
  }
  
  const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
  
  setInterval(async () => {
    try {
      const response = await fetch(`${RENDER_SERVICE_URL}/ping`);
      if (response.ok) {
        console.log(`💓 Keep-alive ping successful at ${new Date().toISOString()}`);
      }
    } catch (error) {
      console.error('💔 Keep-alive ping failed:', error.message);
    }
  }, KEEP_ALIVE_INTERVAL);
  
  console.log(`💓 Keep-alive started: pinging every 14 minutes`);
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCORD CLIENT
// ═══════════════════════════════════════════════════════════════════════════

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,  // Requires MESSAGE CONTENT INTENT enabled!
  ]
});

// ═══════════════════════════════════════════════════════════════════════════
// BOT READY EVENT
// ═══════════════════════════════════════════════════════════════════════════

client.once('ready', () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🤖 ShadowLedger Bot is ONLINE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Bot User: ${client.user.tag}`);
  console.log(`  Listening to channel: #${EXPENSE_CHANNEL_NAME}`);
  console.log(`  Forwarding to: ${CLOUDFLARE_WORKER_URL}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  // Start keep-alive after bot is ready
  startKeepAlive();
});

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE EVENT
// ═══════════════════════════════════════════════════════════════════════════

client.on('messageCreate', async (message) => {
  
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Only process messages from #expenses channel
  if (message.channel.name !== EXPENSE_CHANNEL_NAME) return;
  
  // Log the message
  console.log('───────────────────────────────────────────────────────────');
  console.log(`📨 Message received at ${new Date().toISOString()}`);
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
    
    console.log(`📤 Forwarding to Cloudflare Worker...`);
    
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
      console.error(`⚠️ Worker returned error: ${response.status}`);
      console.error(`   Response: ${responseText}`);
    }
    
  } catch (error) {
    console.error(`❌ Error forwarding message:`, error.message);
  }
  
  console.log('───────────────────────────────────────────────────────────');
});

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('🔄 Connecting to Discord...');
client.login(BOT_TOKEN);
