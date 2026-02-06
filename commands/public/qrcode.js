const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

module.exports = {
    name: "qrcode",
    description: "Transforme un texte ou lien en QR Code",
    aliases: ["qr"],
    async execute(sock, m, { args, prefix }) {
        const text = args.join(" ");

        if (!text) {
            return sock.sendMessage(m.key.remoteJid, { text: `⚠️ Il faut du texte ! Exemple : *${prefix}qr https://google.com*` }, { quoted: m });
        }

        const randomName = crypto.randomBytes(4).toString('hex');
        const outputPath = path.join(__dirname, `../../temp/${randomName}.png`);

        try {
            await QRCode.toFile(outputPath, text, {
                color: {
                    dark: '#000000',  // Points noirs
                    light: '#FFFFFF'  // Fond blanc
                },
                width: 500
            });

            await sock.sendMessage(m.key.remoteJid, {
                image: { url: outputPath },
                caption: `📱 QR Code pour : *${text}*`
            }, { quoted: m });

            fs.unlinkSync(outputPath);

        } catch (error) {
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Erreur : ${error.message}` }, { quoted: m });
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }
    }
};
