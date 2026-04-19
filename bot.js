const express = require("express");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const fs = require("fs");

// 🌐 API + ANTI-SONO
const app = express();

app.get("/", (req, res) => res.send("API online"));

// 🔍 VERIFICAR KEY
app.get("/check", (req, res) => {
  const key = req.query.key;

  let keys = [];
  if (fs.existsSync("keys.json")) {
    keys = JSON.parse(fs.readFileSync("keys.json"));
  }

  const found = keys.find(k => k.key === key);

  if (!found) {
    return res.json({ valid: false });
  }

  if (found.expires && Date.now() > found.expires) {
    return res.json({ valid: false, expired: true });
  }

  return res.json({ valid: true });
});

app.listen(process.env.PORT || 3000);

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

// 💰 PREÇOS
const prices = {
  "1d": "R$5",
  "3d": "R$10",
  "perm": "R$20"
};

// 🔑 GERAR KEY
function generateKey(type) {
  const base = "STORE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  if (type === "1d") return base + "-1D";
  if (type === "3d") return base + "-3D";
  if (type === "perm") return base + "-PERM";
}

// 💾 SALVAR KEY COM TEMPO
function saveKey(key, type) {
  let keys = [];

  if (fs.existsSync("keys.json")) {
    keys = JSON.parse(fs.readFileSync("keys.json"));
  }

  let expires = null;

  if (type === "1d") {
    expires = Date.now() + 24 * 60 * 60 * 1000;
  } else if (type === "3d") {
    expires = Date.now() + 3 * 24 * 60 * 60 * 1000;
  }

  keys.push({
    key: key,
    expires: expires
  });

  fs.writeFileSync("keys.json", JSON.stringify(keys));
}

// 🗂 PEDIDOS
const pending = new Map();
const ADMIN_ID = "1494847279985852499";

// 💬 COMANDOS
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const text = msg.content.toLowerCase().trim();

  // 🛒 COMPRA
  if (text.startsWith("comprar")) {
    const type = text.split(" ")[1];

    if (!["1d", "3d", "perm"].includes(type)) {
      return msg.reply("❌ Use: comprar 1d / 3d / perm");
    }

    if (pending.has(msg.author.id)) {
      return msg.reply("⚠️ Você já tem um pedido ativo.");
    }

    pending.set(msg.author.id, type);

    return msg.reply(
      `📩 Pedido iniciado!\n\n💰 Plano: ${type}\n💵 Valor: ${prices[type]}\n\n🔑 Pix: 87981682220\n\n📎 Envie o comprovante.\n\n📌 Ative o PV para receber a key!`
    );
  }

  // 📎 COMPROVANTE
  if (msg.attachments.size > 0) {
    const type = pending.get(msg.author.id);
    if (!type) return;

    const admin = await client.users.fetch(ADMIN_ID);

    await admin.send(
      `💰 PAGAMENTO\nUser: ${msg.author.tag}\nID: ${msg.author.id}\nPlano: ${type}\n\nConfirme com: !confirm ${msg.author.id}`
    );

    return msg.reply("📩 Comprovante enviado!");
  }

  // ✔ CONFIRMAR
  if (text.startsWith("!confirm")) {
    const userId = text.split(" ")[1];
    const type = pending.get(userId);

    if (!type) return msg.reply("❌ Nenhum pedido.");

    const key = generateKey(type);
    saveKey(key, type);

    const user = await client.users.fetch(userId);

    try {
      await user.send(`🔑 Sua key: ${key}`);
      msg.reply("✔ Key enviada no PV!");
    } catch {
      msg.reply("⚠️ Ative o PV para receber a key.");
    }

    pending.delete(userId);
  }
});

client.on("ready", () => {
  console.log("🤖 Bot online");
});

client.login(process.env.DISCORD_TOKEN);
