const { generateImage } = require('../../utils/imageGen');

module.exports = {
    name: "imagine",
    description: "Génère une image via IA (Hugging Face)",
    aliases: ["img", "dalle"],
    async execute(sock, m, { args, prefix }) {
        if (args.length === 0) {
            return sock.sendMessage(m.key.remoteJid, { text: `⚠️ Décris l'image ! Exemple : *${prefix}imagine un chat cyberpunk*` }, { quoted: m });
        }

        const prompt = args.join(" ");
        await sock.sendMessage(m.key.remoteJid, { react: { text: "🎨", key: m.key } });

        try {
            const buffer = await generateImage(prompt);

            await sock.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: `🎨 Image pour : *${prompt}*`
            }, { quoted: m });

            await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

        } catch (error) {
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Erreur : ${error.message}` }, { quoted: m });
        }
    }
};
