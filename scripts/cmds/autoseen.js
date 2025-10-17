const fs = require("fs-extra");

module.exports = {
  config: {
    name: "autoseen",
    version: "3.1",
    author: "Mohammad Akash",
    countDown: 5,
    role: 0,
    shortDescription: "Auto seen messages (debug-enabled)",
    longDescription: "Automatically mark all incoming messages as seen (always active). Debug logs enabled.",
    category: "system",
  },

  onChat: async function ({ api, event }) {
    try {
      // debug logs to ensure handler is fired
      console.log("[autoseen] onChat fired. threadID:", event && event.threadID, "messageID:", event && event.messageID);

      // 1) Try markAsReadAll if available
      if (typeof api.markAsReadAll === "function") {
        try {
          api.markAsReadAll(() => {
            console.log("[autoseen] markAsReadAll() called (callback).");
          });
          return;
        } catch (e) {
          console.log("[autoseen] markAsReadAll() threw:", e);
        }
      } else {
        console.log("[autoseen] api.markAsReadAll is not a function.");
      }

      // 2) Try markAsRead(threadID)
      if (typeof api.markAsRead === "function" && event && event.threadID) {
        try {
          api.markAsRead(event.threadID, (err) => {
            if (err) console.log("[autoseen] markAsRead(threadID) error:", err);
            else console.log("[autoseen] markAsRead(threadID) success for", event.threadID);
          });
          return;
        } catch (e) {
          console.log("[autoseen] markAsRead(threadID) threw:", e);
        }
      } else {
        console.log("[autoseen] api.markAsRead not available or no threadID.");
      }

      // 3) Try markAsRead for messageIDs (some libs accept messageID)
      if (typeof api.markAsRead === "function" && event && event.messageID) {
        try {
          api.markAsRead(event.messageID, (err) => {
            if (err) console.log("[autoseen] markAsRead(messageID) error:", err);
            else console.log("[autoseen] markAsRead(messageID) success for", event.messageID);
          });
          return;
        } catch (e) {
          console.log("[autoseen] markAsRead(messageID) threw:", e);
        }
      }

      // 4) As a last fallback, try set presence (some libs auto-read on typing/presence)
      if (typeof api.setOptions === "function") {
        try {
          api.setOptions({ selfListen: false });
          console.log("[autoseen] setOptions called (fallback).");
        } catch (e) {
          console.log("[autoseen] setOptions threw:", e);
        }
      }

      console.log("[autoseen] no read-method succeeded. Check API methods and restart bot.");
    } catch (err) {
      console.log("[autoseen] Unexpected error:", err);
    }
  }
};
