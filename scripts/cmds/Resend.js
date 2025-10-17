const fs = require("fs-extra");
const path = __dirname + "/cacheMsg.json";

// 🔹 ক্যাশ ফাইল তৈরি না থাকলে বানায়
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}, null, 2));

// 🔸 তোমার UID (Owner)
const OWNER_ID = "100078049308655";

module.exports = {
  config: {
    name: "resend",
    version: "4.2.0",
    author: "Mohammad Akash × ChatGPT",
    role: 0,
    shortDescription: "আনসেন্ট হলে মেসেজ ইনবক্সে পাঠাবে",
    longDescription: "কেউ মেসেজ আনসেন্ট করলে, সেটা সব অ্যাডমিন ও নির্দিষ্ট owner UID-তে পাঠাবে সুন্দর ডিজাইনসহ।",
    category: "system"
  },

  // 🧠 মেসেজ ক্যাশ সেভ
  onChat: async function ({ event }) {
    const { messageID, threadID, senderID, body, attachments } = event;
    if (!messageID) return;
    const cache = JSON.parse(fs.readFileSync(path));
    cache[messageID] = {
      senderID,
      threadID,
      body: body || null,
      attachments: attachments || []
    };
    fs.writeFileSync(path, JSON.stringify(cache, null, 2));
  },

  // ❌ আনসেন্ট ডিটেকশন
  onMessageUnsend: async function ({ event, api }) {
    try {
      const { messageID, threadID, senderID } = event;
      const cache = JSON.parse(fs.readFileSync(path));
      const msgData = cache[messageID];
      if (!msgData) return;

      const threadInfo = await api.getThreadInfo(threadID);
      const adminIDs = threadInfo.adminIDs.map(item => item.id);
      const groupName = threadInfo.threadName || "Unnamed Group";

      const userInfo = await api.getUserInfo(senderID);
      const userName = userInfo[senderID]?.name || "Unknown User";

      // 🕒 সময় ও তারিখ (Bangladesh)
      const now = new Date();
      const time = now.toLocaleTimeString("bn-BD", { timeZone: "Asia/Dhaka", hour12: true });
      const date = now.toLocaleDateString("bn-BD");

      // 📄 আনসেন্ট মেসেজের ধরন
      let msgBody = "";
      if (msgData.body) msgBody = `💬 মেসেজ: ${msgData.body}`;
      else if (msgData.attachments.length > 0) {
        const type = msgData.attachments[0].type;
        if (type === "photo") msgBody = "📷 একটি ছবি আনসেন্ট করেছে!";
        else if (type === "video") msgBody = "🎥 একটি ভিডিও আনসেন্ট করেছে!";
        else if (type === "audio") msgBody = "🎧 একটি ভয়েস মেসেজ আনসেন্ট করেছে!";
        else msgBody = "📎 একটি ফাইল আনসেন্ট করেছে!";
      } else msgBody = "❓ কিছু আনসেন্ট করেছে!";

      // 🎨 ডিজাইন আউটপুট
      const alertMsg =
`━━━━━━━━━━━━━━━━━━━━━
🕵️‍♂️ 𝙐𝙉𝙎𝙀𝙉𝘿 𝘼𝙇𝙀𝙍𝙏 ⚠️
━━━━━━━━━━━━━━━━━━━━━
👤 ইউজার: ${userName}
${msgBody}
🏠 গ্রুপ: ${groupName}
⏰ সময়: ${time}
📅 তারিখ: ${date}
━━━━━━━━━━━━━━━━━━━━━
𝙱𝚘𝚝 𝙾𝚠𝚗𝚎𝚛 : 𝙼𝚘𝚑𝚊𝚖𝚖𝚊𝚍 𝙰𝚔𝚊𝚜𝚑`;

      // 📩 রিসিভার লিস্ট (অ্যাডমিন + Owner)
      const receivers = [...new Set([...adminIDs, OWNER_ID])];

      // 🔁 প্রত্যেককে পাঠানো
      for (const adminID of receivers) {
        await api.sendMessage(alertMsg, adminID);

        if (msgData.attachments.length > 0) {
          for (const att of msgData.attachments) {
            const stream = await global.utils.getStreamFromURL(att.url);
            await api.sendMessage({ attachment: stream }, adminID);
          }
        }
      }

      delete cache[messageID];
      fs.writeFileSync(path, JSON.stringify(cache, null, 2));

    } catch (err) {
      console.error("❌ Resend Error:", err);
    }
  }
};
