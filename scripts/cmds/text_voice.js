const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "text_voice",
    version: "1.1.0",
    author: "Mohammad Akash",
    countDown: 5,
    role: 0,
    shortDescription: "নির্দিষ্ট টেক্সটে কিউট মেয়ের ভয়েস প্লে করে 😍",
    longDescription: "যখন কেউ নির্দিষ্ট টেক্সট লিখবে, তখন বট সেই টেক্সট অনুযায়ী ভয়েস পাঠাবে। (ইমোজি ছাড়া)",
    category: "noprefix"
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const msg = body.trim().toLowerCase();

    // 🎧 নির্দিষ্ট টেক্সট অনুযায়ী ভয়েস URL (partial match system)
    const textAudioMap = [
      { key: "i love you", url: "https://files.catbox.moe/npy7kl.mp3" },
      { key: "mata beta", url: "https://files.catbox.moe/5rdtc6.mp3" },
    ];

    // যেকোনো key যদি মেসেজের মধ্যে থাকে
    const match = textAudioMap.find(item => msg.includes(item.key));
    if (!match) return;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `${encodeURIComponent(match.key)}.mp3`);

    try {
      const response = await axios({
        method: "GET",
        url: match.url,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          fs.unlink(filePath, err => {
            if (err) console.error("Error deleting file:", err);
          });
        }, messageID);
      });

      writer.on("error", err => {
        console.error("Error writing file:", err);
        api.sendMessage("ভয়েস প্লে হয়নি 😅", threadID, messageID);
      });

    } catch (error) {
      console.error("Error downloading audio:", error);
      api.sendMessage("ভয়েস প্লে হয়নি 😅", threadID, messageID);
    }
  }
};
