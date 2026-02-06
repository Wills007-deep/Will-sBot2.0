const axios = require('axios');

module.exports = {
    name: "translate",
    description: "Traduire un texte (Ex: !translate en bonjour)",
    aliases: ["tr", "trad", "traduction"],
    async execute(sock, m, { args, remoteJid }) {
        let targetLang = 'fr';
        let textToTranslate = "";

        // Détection de la langue de destination
        if (args[0] && args[0].length === 2) {
            targetLang = args[0].toLowerCase();
            textToTranslate = args.slice(1).join(" ");
        } else {
            textToTranslate = args.join(" ");
        }

        // Si on répond à un message sans texte
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted && !textToTranslate) {
            textToTranslate = quoted.conversation ||
                quoted.extendedTextMessage?.text ||
                quoted.imageMessage?.caption || "";
        }

        if (!textToTranslate || textToTranslate.trim() === "") {
            return sock.sendMessage(remoteJid, { text: "❌ Usage: *!translate <lang> <texte>* ou répondez à un message avec *!translate <lang>*." }, { quoted: m });
        }

        try {
            await sock.sendMessage(remoteJid, { react: { text: "🌐", key: m.key } });

            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
            const res = await axios.get(url, { timeout: 10000 });

            if (!res.data || !res.data[0]) throw new Error("Réponse vide de Google");

            const translation = res.data[0].map(item => item[0]).join("");
            const detectedLang = res.data[2];

            const responseText = `🌐 *Traduction (${detectedLang.toUpperCase()} → ${targetLang.toUpperCase()})*\n━━━━━━━━━━━━━━\n${translation}`;

            await sock.sendMessage(remoteJid, { text: responseText }, { quoted: m });

        } catch (error) {
            console.error("Erreur Traduction:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Erreur de traduction. Vérifiez que le code langue est correct." }, { quoted: m });
        }
    }
};
