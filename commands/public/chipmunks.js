const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const os = require('os');

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
    name: "chipmunks",
    description: "Appliquer un effet voix d'écureuil à un audio",
    aliases: ["ecureuil", "chipmunk"],
    async execute(sock, m, { remoteJid }) {
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.audioMessage) {
            return sock.sendMessage(remoteJid, { text: "⚠️ Répondez à une note vocale avec *!chipmunks*." }, { quoted: m });
        }

        const tempDir = os.tmpdir();
        const uniqueId = Date.now();
        const inputPath = path.join(tempDir, `in_${uniqueId}.opus`);
        const outputPath = path.join(tempDir, `out_${uniqueId}.opus`);

        try {
            await sock.sendMessage(remoteJid, { react: { text: "🐿️", key: m.key } });

            // 1. Télécharger
            const stream = await downloadContentFromMessage(quoted.audioMessage, 'audio', {});
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            fs.writeFileSync(inputPath, buffer);

            // 2. Transformer
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .outputOptions([
                        "-af", "asetrate=44100*1.6,aresample=44100,atempo=0.9",
                        "-c:a", "libopus",
                        "-b:a", "64k"
                    ])
                    .save(outputPath)
                    .on("end", resolve)
                    .on("error", reject);
            });

            // 3. Envoyer
            await sock.sendMessage(remoteJid, {
                audio: fs.readFileSync(outputPath),
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: m });

            await sock.sendMessage(remoteJid, { react: { text: "✅", key: m.key } });

        } catch (error) {
            console.error("Erreur Chipmunks:", error);
            await sock.sendMessage(remoteJid, { text: "❌ Erreur lors de la transformation audio." }, { quoted: m });
        } finally {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }
    }
};
