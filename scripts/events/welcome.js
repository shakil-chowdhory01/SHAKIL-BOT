const { getTime, drive } = global.utils;

module.exports = {
  config: {
    name: "welcome",
    version: "2.1",
    author: "Mehedi Hassan (Fix by GPT-5)",
    category: "events"
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      defaultWelcomeMessage:
        "__আসসালামু আলাইকুম__\n═══════════════\n__Welcome ➤ {userName}__\n\n_আমাদের {threadName}_\n_এর পক্ষ থেকে আপনাকে_\n       __!! স্বাগতম !!__\n__'আপনি এই__\n        __গ্রুপের {memberCount} নাম্বার মেমবার___!!\n\n___Added By : {inviterName}___\n\nBot Owner : Mehedi Hassan",
      botAddedMessage:
        "━━━━━━━━━━━━━━━━━━━━━\n🤖 ধন্যবাদ আমাকে গ্রুপে অ্যাড করার জন্য 💖\n\n⚙️ Bot Prefix :  /\n📜 সব কমান্ড দেখতে লিখুন :  /help\n\nচলুন একসাথে এই গ্রুপটা আরও মজার করে তুলি! 😄\n━━━━━━━━━━━━━━━━━━━━━"
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    if (event.logMessageType == "log:subscribe")
      return async function () {
        const { threadID } = event;
        const threadData = await threadsData.get(threadID);

        if (!threadData.settings.sendWelcomeMessage)
          return;

        const addedMembers = event.logMessageData.addedParticipants;
        const hours = getTime("HH");
        const threadName = threadData.threadName;

        for (const user of addedMembers) {
          const userID = user.userFbId;
          const botID = api.getCurrentUserID();

          // ✅ যদি বটকে অ্যাড করা হয়
          if (userID == botID) {
            return message.send(getLang("botAddedMessage"));
          }

          // ✅ অন্য ইউজার যোগ হলে
          const userName = user.fullName;
          const inviterName = await usersData.getName(event.author);
          const memberCount = event.participantIDs.length;

          let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;

          const session =
            hours <= 10
              ? getLang("session1")
              : hours <= 12
              ? getLang("session2")
              : hours <= 18
              ? getLang("session3")
              : getLang("session4");

          welcomeMessage = welcomeMessage
            .replace(/\{userName\}/g, userName)
            .replace(/\{threadName\}/g, threadName)
            .replace(/\{memberCount\}/g, memberCount)
            .replace(/\{inviterName\}/g, inviterName)
            .replace(/\{session\}/g, session)
            .replace(/\{time\}/g, hours);

          const form = {
            body: welcomeMessage,
            mentions: [
              {
                tag: userName,
                id: userID
              }
            ]
          };

          if (threadData.data.welcomeAttachment) {
            const files = threadData.data.welcomeAttachment;
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
  }
};
