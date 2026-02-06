module.exports = {
    name: 'ping',
    description: 'Vérifie si le bot répond',
    aliases: ['pong'],
    async execute(sock, m, { remoteJid }) {
        const start = Date.now();
        await sock.sendMessage(remoteJid, { react: { text: "⚡", key: m.key } });
        const latency = Date.now() - start;
        await sock.sendMessage(remoteJid, { text: `🟢 *Bot En Ligne*\n\nLatence : ${latency}ms\nTout fonctionne parfaitement ! 🚀` }, { quoted: m });
    }
};
