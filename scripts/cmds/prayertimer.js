const moment = require("moment-timezone");
const schedule = require("node-schedule");

module.exports.config = {
  name: "prayertimer",
  version: "2.0",
  role: 0,
  author: "Mohammad Akash",
  description: "🕌 নির্দিষ্ট নামাজের সময় সব গ্রুপে বার্তা পাঠাবে",
  category: "AutoTime",
};

module.exports.onLoad = async function ({ api }) {
  const timezone = "Asia/Dhaka";

  // 🕋 নামাজের সময়সূচি (Bangladesh Standard)
  const prayerTimes = [
    { name: "ফজর 🌅", time: "4:30 AM", message: "নামাজের মাধ্যমে দিনের শুরু হোক আল্লাহর রহমতে 🤲" },
    { name: "যোহর ☀️", time: "1:00 PM", message: "দিনের ব্যস্ততার মাঝে একটু বিরতি নিন, নামাজ পড়ুন 🕋" },
    { name: "আসর 🌇", time: "4:45 PM", message: "বিকেলের এই সময়টাতে নামাজের মাধ্যমে শান্তি পান 🌿" },
    { name: "মাগরিব 🌆", time: "6:15 PM", message: "সূর্য অস্তের সাথে নামাজে মন দিন 🌅" },
    { name: "এশা 🌙", time: "8:00 PM", message: "ঘুমানোর আগে নামাজ পড়ুন, আল্লাহর কাছে শান্তি চাইুন 🤲" },
  ];

  // 🔁 প্রতিটি নামাজের জন্য জব সেট করা
  for (const prayer of prayerTimes) {
    const hour24 = moment(prayer.time, ["h:mm A"]).format("H");
    const minute = parseInt(prayer.time.split(":")[1]);

    schedule.scheduleJob({ hour: hour24, minute, tz: timezone }, async () => {
      try {
        const allThreads = await api.getThreadList(100, null, ["INBOX"]);
        const groupThreads = allThreads.filter(t => t.isGroup);
        const date = moment().tz(timezone).format("DD-MM-YYYY");

        const message = `
━━━━━━━━━━━━━━━━━━━━━
🕌 নামাজের সময়: ${prayer.name}
🕒 সময়: ${prayer.time}
📖 ${prayer.message}
━━━━━━━━━━━━━━━━━━━━━
📅 DATE : ${date}
🤖 𝙱𝚘𝚝 𝙾𝚠𝚗𝚎𝚛 : 𝙼𝚘𝚑𝚊𝚖𝚖𝚊𝚍 𝙰𝚔𝚊𝚜𝚑
━━━━━━━━━━━━━━━━━━━━━`;

        console.log(`🕋 ${prayer.name} (${prayer.time}) → ${groupThreads.length} গ্রুপে পাঠানো হচ্ছে...`);

        for (const thread of groupThreads) {
          await api.sendMessage(message, thread.threadID);
        }

        console.log(`✅ সফলভাবে "${prayer.name}" বার্তা সব গ্রুপে পাঠানো হয়েছে!`);
      } catch (err) {
        console.error("❌ PrayerTimer Error:", err);
      }
    });
  }

  console.log("✅ PrayerTimer System Loaded — নামাজের সময় অটো বার্তা শুরু হয়েছে...");
};
