const { getTime, drive } = global.utils;

module.exports = {
  config: {
    name: "leave",
    version: "2.1",
    author: "Mohammad Akash (Modified by GPT-5)",
    category: "events"
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",

      defaultLeaveMessage: `
━━━━━━━━━━━━━━━━━━━━━
💔 __বিদায় {userName}__ 💔
═════════════════════

🌙 আল্লাহ হাফেজ!  
আপনি {threadName} গ্রুপটি ছেড়ে গেছেন।

🕒 এখন সময়: {session} ({time}:00)

✨ আমরা সবাই আপনার সুন্দর উপস্থিতি আর কথা মনে রাখব ❤️  
যেখানেই থাকেন — সুস্থ ও ভালো থাকুন,  
জীবনটা হোক আনন্দ ও বরকতময় 💫  

🕌 ইনশাআল্লাহ, আবার দেখা হবে!  
━━━━━━━━━━━━━━━━━━━━━
Bot Owner : Mohammad Akash
━━━━━━━━━━━━━━━━━━━━━
`
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    if (event.logMessageType == "log:unsubscribe")
      return async function () {
        const { threadID } = event;
        const threadData = await threadsData.get(threadID);
        if (!threadData.settings.sendLeaveMessage) return;

        const { leftParticipantFbId } = event.logMessageData;
        if (leftParticipantFbId == api.getCurrentUserID()) return;

        const hours = getTime("HH");
        const threadName = threadData.threadName;
        const userName = await usersData.getName(leftParticipantFbId);

        let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;

        const session =
          hours <= 10
            ? getLang("session1")
            : hours <= 12
            ? getLang("session2")
            : hours <= 18
            ? getLang("session3")
            : getLang("session4");

        leaveMessage = leaveMessage
          .replace(/\{userName\}/g, userName)
          .replace(/\{threadName\}/g, threadName)
          .replace(/\{session\}/g, session)
          .replace(/\{time\}/g, hours);

        const form = {
          body: leaveMessage,
          mentions: [
            {
              tag: userName,
              id: leftParticipantFbId
            }
          ]
        };

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
      };
  }
};
