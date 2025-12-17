/**
 * ShadowLedger Discord Bot
 * 
 * PURPOSE: Listens to #expenses channel and forwards messages to Cloudflare Worker
 * 
 * Flow: Discord #expenses → THIS BOT → Cloudflare Worker → Apps Script
 * 
 * Hosted on: Render.com (free tier)
 * 
 * Version: 1.0.0
 * Date: 2025-12-17
 */

const { Client, GatewayIntentBits } = require('discord.js');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION (from environment variables)
// ═══════════════════════════════════════════════════════════════════════════
// WHY environment variables? 
// Security! These values are secret and shouldn't be written in the code.
// Render.com lets us set them separately in their dashboard.

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
const EXPENSE_CHANNEL_NAME = process.env.EXPENSE_CHANNEL_NAME || 'expenses';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION - Check that required config exists
// ═══════════════════════════════════════════════════════════════════════════

if (!BOT_TOKEN) {
  console.error('❌ ERROR: DISCORD_BOT_TOKEN environment variable not set!');
  console.error('   Please set it in Render.com dashboard → Environment');
  process.exit(1);
}

if (!CLOUDFLARE_WORKER_URL) {
  console.error('❌ ERROR: CLOUDFLARE_WORKER_URL environment variable not set!');
  console.error('   Please set it in Render.com dashboard → Environment');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE DISCORD CLIENT
// ═══════════════════════════════════════════════════════════════════════════
// WHY these intents? Discord requires you to declare what data you need.
// - Guilds: To see server info
// - GuildMessages: To receive messages
// - MessageContent: To read what the messages say (requires enabled intent!)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// ═══════════════════════════════════════════════════════════════════════════
// BOT READY EVENT
// ═══════════════════════════════════════════════════════════════════════════
// This runs once when the bot successfully connects to Discord

client.once('ready', () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🤖 ShadowLedger Bot is ONLINE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Bot User: ${client.user.tag}`);
  console.log(`  Listening to channel: #${EXPENSE_CHANNEL_NAME}`);
  console.log(`  Forwarding to: ${CLOUDFLARE_WORKER_URL}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════');
});

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE EVENT
// ═══════════════════════════════════════════════════════════════════════════
// This runs every time a message is sent in any channel the bot can see

client.on('messageCreate', async (message) => {
  
  // ─────────────────────────────────────────────────────────────────────────
  // FILTER 1: Ignore messages from bots (including itself)
  // ─────────────────────────────────────────────────────────────────────────
  if (message.author.bot) {
    return; // Exit early, don't process
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // FILTER 2: Only process messages from #expenses channel
  // ─────────────────────────────────────────────────────────────────────────
  if (message.channel.name !== EXPENSE_CHANNEL_NAME) {
    return; // Exit early, wrong channel
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // LOG THE MESSAGE (visible in Render.com logs)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('───────────────────────────────────────────────────────────');
  console.log(`📨 Message received at ${new Date().toISOString()}`);
  console.log(`   From: ${message.author.username}`);
  console.log(`   Content: "${message.content}"`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // FORWARD TO CLOUDFLARE WORKER
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const payload = {
      content: message.content,
      username: message.author.username,
      // Include extra info for debugging (optional)
      channelId: message.channel.id,
      channelName: message.channel.name,
      guildName: message.guild?.name || 'DM',
      timestamp: message.createdAt.toISOString()
    };
    
    console.log(`📤 Forwarding to Cloudflare Worker...`);
    
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ Successfully forwarded! Status: ${response.status}`);
      console.log(`   Response: ${responseText.substring(0, 200)}`);
    } else {
      console.error(`⚠️ Worker returned error status: ${response.status}`);
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

client.on('warn', (warning) => {
  console.warn('⚠️ Discord client warning:', warning);
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN TO DISCORD
// ═══════════════════════════════════════════════════════════════════════════

console.log('🔄 Connecting to Discord...');
client.login(BOT_TOKEN);
