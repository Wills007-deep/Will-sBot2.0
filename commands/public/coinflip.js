module.exports = {
    name: "coinflip",
    description: "Lancer une pièce (Pile ou Face)",
    aliases: ["flip", "pileface"],
    async execute(sock, m, { remoteJid }) {
        const result = Math.random() > 0.5 ? "PILE 🪙" : "FACE 🪙";
        await sock.sendMessage(remoteJid, { text: `🎯 Le résultat est : *${result}*` }, { quoted: m });
    }
};
