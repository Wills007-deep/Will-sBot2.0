const sessions = new Map();

module.exports = {
    name: "motgame",
    description: "Jeu du mot mélangé (Remettez les lettres dans l'ordre)",
    aliases: ["mot", "game"],
    async execute(sock, m, { remoteJid }) {
        const words = ["WHATSAPP", "BOT", "TELEPHONE", "ORDINATEUR", "INTERNET", "CAMEROUN", "MUSIQUE", "ANTIGRAVITY", "INTELLIGENCE", "CHAMPION"];
        const word = words[Math.floor(Math.random() * words.length)];
        const scrambled = word.split('').sort(() => 0.5 - Math.random()).join('');

        sessions.set(remoteJid, word);

        const text = `🎯 *JEU DU MOT MÉLANGÉ* 🎯\n\nRemettez les lettres dans l'ordre :\n👉 *${scrambled}*\n\n_(Répondez directement avec le mot ! 30s)_`;
        await sock.sendMessage(remoteJid, { text }, { quoted: m });

        // Timer de 30 secondes
        setTimeout(async () => {
            if (sessions.has(remoteJid) && sessions.get(remoteJid) === word) {
                await sock.sendMessage(remoteJid, { text: `⏰ *Temps écoulé !* Le mot était : *${word}*` });
                sessions.delete(remoteJid);
            }
        }, 30000);
    },

    // Cette fonction sera appelée par le handler global
    onMessage: async (sock, m, text) => {
        const from = m.key.remoteJid;
        if (!sessions.has(from)) return false;

        const answer = sessions.get(from);
        if (text.toUpperCase().trim() === answer) {
            await sock.sendMessage(from, { text: `🎉 *Bravo @${m.key.participant?.split('@')[0] || from.split('@')[0]} !* \nC'était bien *${answer}* !`, mentions: [m.key.participant || from] }, { quoted: m });
            sessions.delete(from);
            return true;
        }
        return false;
    }
};
