module.exports = {
    name: 'ping',
    description: 'Vérifie si le bot répond',
    aliases: ['pong'],
    async execute(sock, m, { remoteJid }) {
        await sock.sendMessage(remoteJid, { text: 'Pong! 🏓 Mission réussie !' }, { quoted: m });
    }
};
