const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const https = require("https");

const balancePath = __dirname + "/coinxbalance.json";

// 🪙 coinxbalance.json না থাকলে বানানো
if (!fs.existsSync(balancePath)) {
  fs.writeFileSync(balancePath, JSON.stringify({}, null, 2));
}

// 🔹 ব্যালেন্স পড়া
function getBalance(userID) {
  const data = JSON.parse(fs.readFileSync(balancePath));
  if (data[userID]?.balance != null) return data[userID].balance;
  if (userID === "100078049308655") return 10000; // Owner ID
  return 100;
}

// 🔹 ব্যালেন্স আপডেট করা
function setBalance(userID, balance) {
  const data = JSON.parse(fs.readFileSync(balancePath));
  data[userID] = { balance };
  fs.writeFileSync(balancePath, JSON.stringify(data, null, 2));
}

// 🔹 ব্যালেন্স ফরম্যাট করা
function formatBalance(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, '') + "T$";
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + "B$";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + "M$";
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, '') + "k$";
  return num + "$";
}

module.exports = {
  config: {
    name: "fakechat",
    version: "2.1",
    author: "Chitron × Akash",
    countDown: 5,
    role: 0,
    aliases: ["chatedit", "fchat"],
    shortDescription: {
      en: "Generate fake Messenger screenshot"
    },
    description: {
      en: "Create a fake Messenger screenshot with UID/mention and custom messages"
    },
    category: "fun",
    guide: {
      en: "+fakechat <@mention or UID> - <text1> - [text2] - [mode=dark]\n\nEach use costs 50 coins.\nDefault mode is light."
    }
  },

  onStart: async function ({ args, message, event, api }) {
    if (args.length < 2)
      return message.reply("⚠️ Usage:\n+fakechat <@mention or UID> - <text1> - [text2] - [mode]");

    const input = args.join(" ").split("-").map(i => i.trim());
    let [target, text1, text2 = "", modeRaw = "light"] = input;

    // 🎯 UID বের করা
    let uid;
    if (Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else if (/^\d{6,}$/.test(target)) {
      uid = target;
    } else {
      return message.reply("❌ Invalid UID or mention.");
    }

    // 🔹 নাম আনা
    let name = "User";
    try {
      const userInfo = await api.getUserInfo(uid);
      name = userInfo[uid]?.name || name;
    } catch (e) {
      name = "User";
    }

    const mode = modeRaw.toLowerCase() === "dark" ? "dark" : "light";

    // 💰 ব্যালেন্স চেক ও কাটানো
    const senderID = event.senderID;
    let balance = getBalance(senderID);
    const cost = 50;

    if (balance < cost) {
      return message.reply(`❌ You need at least ${formatBalance(cost)} to use this command.\n💰 Your Balance: ${formatBalance(balance)}`);
    }

    balance -= cost;
    setBalance(senderID, balance);

    // 📸 API দিয়ে ফেক চ্যাট তৈরি
    const apiURL = `https://fchat-5pni.onrender.com/fakechat?uid=${encodeURIComponent(uid)}&name=${encodeURIComponent(name)}&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}&mode=${mode}`;

    const cachePath = path.join(__dirname, "tmp", `fchat_${senderID}.png`);
    fs.ensureDirSync(path.dirname(cachePath));

    const file = fs.createWriteStream(cachePath);
    https.get(apiURL, res => {
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          const msg = 
`━━━━━━━━━━━━━━━━━━━━━━━
🎭 𝗙𝗔𝗞𝗘 𝗖𝗛𝗔𝗧 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗢𝗥
━━━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${name}
💬 Message 1: ${text1}
${text2 ? `💬 Message 2: ${text2}\n` : ""}
🎨 Mode: ${mode.toUpperCase()}
💸 Used: ${formatBalance(cost)}
💰 Balance Left: ${formatBalance(balance)}
━━━━━━━━━━━━━━━━━━━━━━━
🧠 Powered by Akash × GPT
━━━━━━━━━━━━━━━━━━━━━━━`;

          message.reply({
            body: msg,
            attachment: fs.createReadStream(cachePath)
          }, () => fs.unlinkSync(cachePath));
        });
      });
    }).on("error", err => {
      fs.unlink(cachePath, () => {});
      message.reply("❌ Failed to generate fake chat.");
    });
  }
};
