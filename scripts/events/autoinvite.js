const { getTime } = global.utils;

module.exports = {
  config: {
    name: "autoinvite",
    version: "2.0",
    author: "Mohammad Akash (Fixed by GPT-5)",
    category: "events"
  },

  onStart: async ({ api, event, usersData, message }) => {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID, logMessageData, author } = event;
    const leftID = logMessageData.leftParticipantFbId;

    // যদি কেউ নিজের ইচ্ছায় লিভ নেয় (kick না)
    if (leftID === author) {
      const userName = await usersData.getName(leftID);
      const form = {
        body: `━━━━━━━━━━━━━━━━━━━━━
@${userName}
তুমি অনুমতি ছাড়া লিভ নিছো 😒  
তাই তোমাকে আবার অ্যাড দিছি 😇  

💬 মনে রাখো — গ্রুপ থেকে পালানো যায় না 😉
━━━━━━━━━━━━━━━━━━━━━
𝙱𝚘𝚝 𝙾𝚠𝚗𝚎𝚛 : 𝙼𝚘𝚑𝚊𝚖𝚖𝚊𝚍 𝙰𝚔𝚊𝚜𝚑
━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [{ tag: userName, id: leftID }]
      };

      // ইউজারকে আবার গ্রুপে অ্যাড করে
      try {
        await api.addUserToGroup(leftID, threadID);
        await message.send(form);
      } catch (err) {
        message.send("⚠️ দুঃখিত, আমি ইউজারটাকে আবার অ্যাড করতে পারিনি। সম্ভবত অ্যাড ব্লক করা আছে।");
      }
    } 
    // কেউ কিক দিলে কিছু করবে না
    else return;
  }
};
