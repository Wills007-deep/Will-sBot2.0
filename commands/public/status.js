const os = require('os');

module.exports = {
    name: "status",
    description: "Afficher l'état du système et du bot",
    aliases: ["stats", "info"],
    async execute(sock, m, { remoteJid }) {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const ramTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

        const statusText = `📊 *ÉGAT DU SYSTÈME*\n\n` +
            `⏱️ *Uptime :* ${hours}h ${minutes}m ${seconds}s\n` +
            `🧠 *RAM Utilisée :* ${ramUsed} MB\n` +
            `💻 *OS :* ${os.platform()} (${os.arch()})\n` +
            `🔋 *Mémoire Totale :* ${ramTotal} GB\n\n` +
            `✅ Bot en ligne et opérationnel.`;

        await sock.sendMessage(remoteJid, { text: statusText }, { quoted: m });
    }
};
