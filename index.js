require("dotenv").config();
const { Client, GatewayIntentBits, WebhookClient } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

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
        ["online", "idle", "dnd"].includes(m.presence.status),
    ).size;

    const currentTime = new Date();
    // Format time and date in your desired timezone (Asia/Kolkata here)
    const formattedTime = currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata", // Change this to your preferred timezone
    });
    const formattedDate = currentTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Kolkata", // Ensure this matches your desired timezone
    });

    const embed = {
      embeds: [
        {
          title: "**SERVER STATUS**",
          color: 0xff0000, // Red
          fields: [
            {
              name: "**> STATUS**",
              value: "```🟢 Online\n```",
              inline: true,
            },
            {
              name: "**> PLAYERS**",
              value: `\`\`\`👥 ${online}/${guild.memberCount}\`\`\``,
              inline: true,
            },
            {
              name: "**> INVITE**",
              value: "```  https://discord.gg/22mGfCGAqw\n```",
            },
          ],
          footer: {
            text: `Updated every 3 minutes • Today at ${formattedTime}`,
          },
          image: {
            url: "https://i.imgur.com/yxtM4Aw.jpeg",
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
    console.error("Update failed:", error);
  }
}

client.on("ready", () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
  updateStats();
  client.on("presenceUpdate", updateStats);
  updateInterval = setInterval(updateStats, 180000); // every 3 minutes
});

process.on("SIGINT", () => {
  clearInterval(updateInterval);
  process.exit();
});

client.login(process.env.BOT_TOKEN);
