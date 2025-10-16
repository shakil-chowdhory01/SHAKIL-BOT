module.exports = {
  config: {
    name: "autoinvite",
    version: "1.0.0",
    author: "Mohammad Akash (Modified by GPT-5)",
    category: "events",
    description: "যে কেউ leave নিলে বট তাকে আবার add করে দেয়!"
  },

  onStart: async function ({ api, event, usersData }) {
    // যখন কেউ লিভ নেয়
    if (event.logMessageType === "log:unsubscribe") {
      const { threadID, logMessageData } = event;
      const leftUser = logMessageData.leftParticipantFbId;
      const botID = api.getCurrentUserID();

      // যদি বট নিজে লিভ করে তাহলে কিছু করবে না
      if (leftUser === botID) return;

      try {
        // ইউজারের নাম নেওয়া
        const userName = await usersData.getName(leftUser);

        // প্রথমে আবার অ্যাড করা
        await api.addUserToGroup(leftUser, threadID);

        // মেসেজ তৈরি
        const msg = `
━━━━━━━━━━━━━━━━━━━━━
@${userName}  
তুমি অনুমতি ছাড়া গ্রুপ ছেড়ে গেছো 😒  
তাই তোমাকে আবার অ্যাড করে দিলাম 😇  

💬 মনে রাখো — Family Group থেকে পালানো যায় না 😉
━━━━━━━━━━━━━━━━━━━━━
𝙱𝚘𝚝 𝙾𝚠𝚗𝚎𝚛 : 𝙼𝚘𝚑𝚊𝚖𝚖𝚊𝚍 𝙰𝚔𝚊𝚜𝚑
━━━━━━━━━━━━━━━━━━━━━
`;

        // মেসেজ সেন্ড (mention সহ)
        api.sendMessage(
          {
            body: msg,
            mentions: [
              {
                tag: `@${userName}`,
                id: leftUser
              }
            ]
          },
          threadID
        );
      } catch (err) {
        console.error("❌ Auto Invite Error:", err);
      }
    }
  }
};
