const { askGroq } = require("../../utils/groq");

module.exports = {
    name: "ai",
    description: "Discuter avec l'IA (Llama 3 via Groq)",
    aliases: ["gpt", "bot"],
    async execute(sock, m, { args, body, prefix }) {
        if (args.length === 0) {
            return sock.sendMessage(m.key.remoteJid, { text: `⚠️ Pose-moi une question ! Exemple : *${prefix}ai Raconte une blague*` }, { quoted: m });
        }

        const prompt = args.join(" ");

        // Indicateur de chargement (réaction)
        await sock.sendMessage(m.key.remoteJid, { react: { text: "🧠", key: m.key } });

        const response = await askGroq(prompt);

        await sock.sendMessage(m.key.remoteJid, { text: response }, { quoted: m });

        // Fin du chargement
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
    }
};
