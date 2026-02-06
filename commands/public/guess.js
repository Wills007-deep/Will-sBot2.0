const sessions = new Map();

module.exports = {
    name: "guess",
    description: "Deviner le nombre choisi par le bot (1-10)",
    aliases: ["devine"],
    async execute(sock, m, { remoteJid }) {
        if (sessions.has(remoteJid)) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Une partie est déjà en cours dans ce chat !" }, { quoted: m });
        }

        const randomNumber = Math.floor(Math.random() * 10) + 1;
        sessions.set(remoteJid, randomNumber);

        await sock.sendMessage(remoteJid, {
            text: "🎲 *JEU DU NOMBRE* 🎲\n\nJ'ai choisi un nombre entre *1 et 10*.\nRépondez simplement avec le chiffre !\n\n_(Vous avez 15 secondes)_"
        }, { quoted: m });

        // Timer de fin
        setTimeout(() => {
            if (sessions.has(remoteJid)) {
                sock.sendMessage(remoteJid, { text: `⏰ Temps écoulé ! Le nombre était *${randomNumber}*.` });
                sessions.delete(remoteJid);
            }
        }, 15000);
    },

    /**
     * Écoute passive pour les réponses
     */
    async onMessage(sock, m, body) {
        const remoteJid = m.key.remoteJid;
        if (!sessions.has(remoteJid)) return false;

        const guess = parseInt(body.trim());
        if (isNaN(guess)) return false;

        const answer = sessions.get(remoteJid);
        if (guess === answer) {
            await sock.sendMessage(remoteJid, { text: `🎉 *BRAVO !* C'était bien le ${answer}.` }, { quoted: m });
            sessions.delete(remoteJid);
            return true; // Stop processing
        } else if (guess > 0 && guess <= 10) {
            // Optionnel: on peut laisser plusieurs chances ou une seule
            // Ici on fait une seule chance pour le côté "rapide"
            await sock.sendMessage(remoteJid, { text: `❌ Raté ! C'était le *${answer}*.` }, { quoted: m });
            sessions.delete(remoteJid);
            return true;
        }

        return false;
    }
};
