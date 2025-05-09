const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Client, Intents, WebhookClient } = require('discord.js');

const app = express();
app.use(cors());
app.get('/', (req, res) => {
  res.send('Bot is running!');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// Important: Railway sometimes needs you to "keep alive" by having a web server running (you already have it — GOOD ✅)

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
  ],
});

// Webhook setup
const webhook = new WebhookClient({ url: process.env.WEBHOOK_URL });
let lastMessageId = null;
let updateInterval;

async function updateStats() {
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    await guild.members.fetch({ withPresences: true });

    const online = guild.members.cache.filter(
      (m) =>
        m.presence?.status &&
        ['online', 'idle', 'dnd'].includes(m.presence.status)
    ).size;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });

    const embed = {
      embeds: [
        {
          title: '**SERVER STATUS**',
          color: 0xff0000,
          fields: [
            {
              name: '**> STATUS**',
              value: '```🟢 Online\n```',
              inline: true,
            },
            {
              name: '**> PLAYERS**',
              value: `\`\`\`👥 ${online}/${guild.memberCount}\`\`\``,
              inline: true,
            },
            {
              name: '**> INVITE**',
              value: '```https://discord.gg/22mGfCGAqw\n```',
            },
          ],
          footer: {
            text: `Updated every 3 minutes • Today at ${formattedTime}`,
          },
          image: {
            url: 'https://i.imgur.com/yxtM4Aw.jpeg',
          },
        },
      ],
    };

    if (!lastMessageId) {
      const message = await webhook.send(embed);
      lastMessageId = message.id;
    } else {
      await webhook.editMessage(lastMessageId, embed);
    }
  } catch (error) {
    console.error('Update failed:', error);
  }
}

client.once('ready', () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
  updateStats();
  client.on('presenceUpdate', updateStats);
  updateInterval = setInterval(updateStats, 180000); // every 3 minutes
});

// Graceful shutdown
process.on('SIGINT', async () => {
  clearInterval(updateInterval);
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  clearInterval(updateInterval);
  await client.destroy();
  process.exit(0);
});

// Bot login
client.login(process.env.BOT_TOKEN);
