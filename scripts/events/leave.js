const { getTime, drive } = global.utils;

module.exports = {
  config: {
    name: "leave",
    version: "3.0",
    author: "Mehedi Hassan (Modified by GPT-5)",
    category: "events"
  },

  langs: {
    en: {
      session1: "🌅 সকাল",
      session2: "🌞 দুপুর",
      session3: "🌇 বিকেল",
      session4: "🌃 রাত",

      defaultLeaveMessage: `
━━━━━━━━━━━━━━━━━━━━━
😢 প্রিয় {userName},
আপনি "{threadName}" গ্রুপটি ছেড়ে গেছেন।

🕒 এখন সময়: {session} {time}

🌸 আপনার উপস্থিতি সবসময়ই ছিল আনন্দের।
💬 সবাই আপনাকে মিস করবে 💖  

আপনার ভবিষ্যৎ যাত্রা হোক সফল ও সুন্দর 🌈  
আল্লাহ হাফেজ 🤲

━━━━━━━━━━━━━━━━━━━━━
🤖 𝙱𝚘𝚝 𝙾𝚠𝚗𝚎𝚛 : Mehedi Hassan
━━━━━━━━━━━━━━━━━━━━━
`
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    if (event.logMessageType !== "log:unsubscribe") return;
    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (!threadData.settings.sendLeaveMessage) return;

    const { leftParticipantFbId } = event.logMessageData;
    if (leftParticipantFbId == api.getCurrentUserID()) return;

    const bdTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const current = new Date(bdTime);
    let hours = current.getHours();
    const minutes = current.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = ((hours + 11) % 12) + 1;

    const threadName = threadData.threadName;
    const userName = await usersData.getName(leftParticipantFbId);

    const session =
      hours < 10
        ? getLang("session1")
        : hours < 13
        ? getLang("session2")
        : hours < 18
        ? getLang("session3")
        : getLang("session4");

    let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;

    leaveMessage = leaveMessage
      .replace(/\{userName\}/g, userName)
      .replace(/\{threadName\}/g, threadName)
      .replace(/\{session\}/g, session)
      .replace(/\{time\}/g, `${hour12}:${minutes} ${ampm}`);

    const form = {
      body: leaveMessage,
      mentions: [{ tag: userName, id: leftParticipantFbId }]
    };

    // 📎 যদি গ্রুপে Leave Attachment থাকে, সেটাও পাঠাবে
    if (threadData.data.leaveAttachment) {
      const files = threadData.data.leaveAttachment;
      const attachments = files.reduce((acc, file) => {
        acc.push(drive.getFile(file, "stream"));
        return acc;
      }, []);
      form.attachment = (await Promise.allSettled(attachments))
        .filter(({ status }) => status == "fulfilled")
        .map(({ value }) => value);
    }

    message.send(form);
  }
};
