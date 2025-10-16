const fs = require("fs-extra");

module.exports = {
  config: {
    name: "autoseen",
    version: "3.0",
    author: "Mohammad Akash",
    countDown: 5,
    role: 0,
    shortDescription: "Auto seen messages",
    longDescription: "Automatically mark all incoming messages as seen (always active).",
    category: "system",
  },

  // onStart দরকার নেই, কারণ এখানে on/off কমান্ড বাদ দেওয়া হয়েছে
  onChat: async function ({ api, event }) {
    try {
      // প্রতিটা মেসেজ এলেই seen করবে
      api.markAsReadAll(() => {});
    } catch (err) {
      console.log("AutoSeen Error:", err);
    }
  }
};
