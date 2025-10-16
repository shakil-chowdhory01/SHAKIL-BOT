const { getTime, drive } = global.utils;

if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "2.0",
		author: "Mehedi Hassan",
		category: "events"
	},

	langs: {
		bn: {
			session1: "সকাল",
			session2: "দুপুর",
			session3: "বিকেল",
			session4: "রাত",

			// যখন বট নিজে অ্যাড হয়
			welcomeMessage: `
━━━━━━━━━━━━━━━━━━━━━
🤖 ধন্যবাদ আমাকে এই গ্রুপে অ্যাড করার জন্য 💖

⚙️ Bot Prefix :  %1
📜 সব কমান্ড দেখতে লিখুন :  %1help

চলুন একসাথে এই গ্রুপটা আরও মজার করে তুলি! 😄

👑 Bot Owner : Mohammad Akash
━━━━━━━━━━━━━━━━━━━━━
			`,

			// যখন নতুন মেম্বার যোগ হয়
			defaultWelcomeMessage: `
__আসসালামু আলাইকুম__
═══════════════
__Welcome ➤ {userName}__

_আমাদের {boxName}_
_এর পক্ষ থেকে আপনাকে_
       __!! স্বাগতম !!__
__আপনি এই__
        __গ্রুপের {memberCount} নাম্বার মেম্বার__!!

___Added By : {inviterName}___

Bot Owner : Mohammad Akash
			`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const hours = getTime("HH");
				const { threadID } = event;
				const prefix = global.utils.getPrefix(threadID);
				const { nickNameBot } = global.GoatBot.config;
				const dataAddedParticipants = event.logMessageData.addedParticipants;

				// 🟢 যদি বট নিজে অ্যাড হয়
				if (dataAddedParticipants.some((i) => i.userFbId == api.getCurrentUserID())) {
					if (nickNameBot)
						api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
					return message.send(getLang("welcomeMessage", prefix));
				}

				// 🟢 নতুন মেম্বারদের জন্য
				if (!global.temp.welcomeEvent[threadID])
					global.temp.welcomeEvent[threadID] = {
						joinTimeout: null,
						dataAddedParticipants: []
					};

				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
				clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

				global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
					const threadData = await threadsData.get(threadID);
					if (threadData.settings.sendWelcomeMessage == false)
						return;

					const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
					const threadName = threadData.threadName || "এই গ্রুপে";
					const userName = [],
						mentions = [];

					for (const user of dataAddedParticipants) {
						userName.push(user.fullName);
						mentions.push({ tag: user.fullName, id: user.userFbId });
					}

					if (userName.length == 0) return;

					let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;

					// 🧮 মেম্বার কাউন্ট বের করা
					const threadInfo = await api.getThreadInfo(threadID);
					const memberCount = threadInfo.participantIDs.length;

					// 🧍‍♂️ যিনি অ্যাড করেছেন
					const inviterID = event.author;
					let inviterName = "Unknown";
					try {
						const info = await api.getUserInfo(inviterID);
						inviterName = info[inviterID]?.name || "Unknown";
					} catch { }

					let session;
					if (hours <= 10) session = getLang("session1");
					else if (hours <= 12) session = getLang("session2");
					else if (hours <= 18) session = getLang("session3");
					else session = getLang("session4");

					welcomeMessage = welcomeMessage
						.replace(/\{userName\}/g, userName.join(", "))
						.replace(/\{boxName\}/g, threadName)
						.replace(/\{memberCount\}/g, memberCount)
						.replace(/\{inviterName\}/g, inviterName)
						.replace(/\{session\}/g, session);

					message.send({ body: welcomeMessage, mentions });
					delete global.temp.welcomeEvent[threadID];
				}, 1500);
			};
	}
};
