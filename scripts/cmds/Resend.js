const fs = require("fs-extra");
const path = __dirname + "/cacheMsg.json";

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}, null, 2));

module.exports = {
  config: {
    name: "resend",
    version: "4.0.0",
    author: "Mohammad Akash",
    countDown: 0,
    role: 0,
    shortDescription: "কেউ আনসেন্ট করলে অ্যাডমিনদের ইনবক্সে পাঠাবে",
    longDescription: "গ্রুপে কেউ মেসেজ, ছবি, ভিডিও বা ভয়েস আনসেন্ট করলে, সেই কনটেন্ট গ্রুপের সব অ্যাডমিনের ইনবক্সে পাঠানো হবে সুন্দর ডিজাইন ও সময়সহ।",
    category: "system"
  },

  // 🧠 মেসেজ ক্যাশ
  onMessage: async function ({ event }) {
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

  // ❌ আনসেন্ট হলে
  onMessageUnsend: async function ({ event, api }) {
    try {
      const { messageID, threadID, senderID } = event;
      const cache = JSON.parse(fs.readFileSync(path));
      const msgData = cache[messageID];
      if (!msgData) return;

      const threadInfo = await api.getThreadInfo(threadID);
      const adminIDs = threadInfo.adminIDs.map(u => u.id);
      const groupName = threadInfo.threadName || "Unnamed Group";

      const userInfo = await api.getUserInfo(senderID);
      const userName = userInfo[senderID]?.name || "Unknown User";

      // 🕒 সময় ও তারিখ
      const now = new Date();
      const options = { timeZone: "Asia/Dhaka", hour12: true };
      const time = now.toLocaleTimeString("bn-BD", options);
      const date = now.toLocaleDateString("bn-BD");

      // 📄 মেসেজ কনটেন্ট
      let msgBody = "";
      if (msgData.body) {
        msgBody = `💬 মেসেজ: ${msgData.body}`;
      } else if (msgData.attachments.length > 0) {
        const type = msgData.attachments[0].type;
        if (type === "photo") msgBody = "📷 একটি ছবি আনসেন্ট করেছে!";
        else if (type === "video") msgBody = "🎥 একটি ভিডিও আনসেন্ট করেছে!";
        else if (type === "audio") msgBody = "🎧 একটি ভয়েস মেসেজ আনসেন্ট করেছে!";
        else msgBody = "📎 একটি ফাইল আনসেন্ট করেছে!";
      } else {
        msgBody = "❓ কিছু আনসেন্ট করেছে!";
      }

      // 🎨 ডিজাইন করা আউটপুট
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

      // 📩 সব অ্যাডমিনকে পাঠানো
      for (const adminID of adminIDs) {
        await api.sendMessage(alertMsg, adminID);

        // 📎 যদি কোনো ফাইল থাকে
        if (msgData.attachments.length > 0) {
          for (const att of msgData.attachments) {
            const stream = await global.utils.getStreamFromURL(att.url);
            await api.sendMessage({ attachment: stream }, adminID);
          }
        }
      }

      // 🧹 ক্লিন আপ
      delete cache[messageID];
      fs.writeFileSync(path, JSON.stringify(cache, null, 2));

    } catch (err) {
      console.error("❌ Resend Error:", err);
    }
  }
};
