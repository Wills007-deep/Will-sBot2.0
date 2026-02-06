const axios = require('axios');

module.exports = {
    name: "llama",
    description: "Parler avec Meta Llama 3 (Alternative IA)",
    aliases: ["llama3"],
    async execute(sock, m, { args, remoteJid }) {
        const query = args.join(" ");
        if (!query) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Pose-moi une question ! Ex: !llama Qui es-tu ?" }, { quoted: m });
        }

        try {
            await sock.sendMessage(remoteJid, { react: { text: "🦙", key: m.key } });

            // Utilisation d'un proxy public stable
            const url = `https://api.bk9.site/ai/llama3?q=${encodeURIComponent(query)}`;
            const res = await axios.get(url, { timeout: 15000 });

            if (res.data && res.data.BK9) {
                await sock.sendMessage(remoteJid, { text: `🦙 *Llama 3 :*\n\n${res.data.BK9.trim()}` }, { quoted: m });
            } else {
                throw new Error("Réponse vide.");
            }

            await sock.sendMessage(remoteJid, { react: { text: "✅", key: m.key } });

        } catch (error) {
            console.error("Erreur Llama:", error);
            await sock.sendMessage(remoteJid, { text: "❌ L'IA Llama est indisponible." }, { quoted: m });
        }
    }
};
