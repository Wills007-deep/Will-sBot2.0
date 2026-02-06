const { askGroq } = require('../../utils/groq');

module.exports = {
    name: "av",
    description: "Jeu Action ou Vérité pimenté par l'IA",
    aliases: ["verite", "action"],
    async execute(sock, m, { args, remoteJid }) {
        const type = args[0]?.toLowerCase();

        if (type !== 'action' && type !== 'verite' && type !== 'vérité') {
            const menu = `*🔞 JEU ACTION OU VÉRITÉ 🔞*\n\n` +
                `Prêt à pimenter le groupe ?\n` +
                `👉 *!av action* : Pour un défi.\n` +
                `👉 *!av verite* : Pour une question.\n\n` +
                `🤖 _Défis générés aléatoirement par l'IA._`;
            return sock.sendMessage(remoteJid, { text: menu }, { quoted: m });
        }

        try {
            await sock.sendMessage(remoteJid, { react: { text: "🎲", key: m.key } });

            const prompt = `Génère un défi de type "${type}" pour un jeu Action ou Vérité entre amis sur WhatsApp. 
            Le défi doit être soit très drôle, soit un peu osé, soit culturellement intéressant. 
            Donne UNIQUEMENT le texte du défi en français. Pas de blabla autour.`;

            const challenge = await askGroq(prompt, "Tu es l'animateur provocateur d'un jeu Action ou Vérité.");

            const finalMsg = `*🔞 ACTION OU VÉRITÉ 🔞*\n\n` +
                `*Type:* ${type.toUpperCase()}\n` +
                `*Challenge:* ${challenge}\n\n` +
                `Alors, cap ou pas cap ? 😏`;

            await sock.sendMessage(remoteJid, { text: finalMsg }, { quoted: m });

        } catch (error) {
            console.error("Erreur Jeu AV:", error);
            await sock.sendMessage(remoteJid, { text: "❌ L'arbitre IA est fatigué, réessayez !" }, { quoted: m });
        }
    }
};
