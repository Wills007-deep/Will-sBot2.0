const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const ytSearch = require('yt-search');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const os = require('os');
const axios = require('axios');

module.exports = {
    name: "play",
    description: "Télécharger une musique depuis YouTube",
    aliases: ["p", "music", "musique"],
    async execute(sock, m, { args, remoteJid }) {
        const query = args.join(" ");
        if (!query) {
            return sock.sendMessage(remoteJid, { text: "❌ Entrez le nom d'une musique ou un lien YouTube." }, { quoted: m });
        }

        try {
            await sock.sendMessage(remoteJid, { react: { text: "🔍", key: m.key } });

            // 1. Recherche avec retry
            let search;
            let video;
            for (let i = 0; i < 3; i++) {
                try {
                    search = await ytSearch(query);
                    video = search.videos[0];
                    if (video) break;
                } catch (e) {
                    if (i === 2) throw e;
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            if (!video) {
                return sock.sendMessage(remoteJid, { text: "❌ Aucun résultat trouvé." }, { quoted: m });
            }

            const { title, url, timestamp, thumbnail } = video;

            await sock.sendMessage(remoteJid, {
                text: `🎵 *Musique trouvée !*\n\n📌 *Titre :* ${title}\n⏳ *Durée :* ${timestamp}\n🔗 *Lien :* ${url}\n\n_Téléchargement en cours..._`
            }, { quoted: m });

            const tempDir = os.tmpdir();
            const binDir = path.join(tempDir, 'bot_bin');
            if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });

            const ytDlpPath = path.join(binDir, 'yt-dlp');

            // 2. Assurer yt-dlp
            if (!fs.existsSync(ytDlpPath)) {
                await sock.sendMessage(remoteJid, { text: "⚙️ Initialisation du moteur de téléchargement... (Une seule fois)" });
                const dlUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
                const response = await axios({ url: dlUrl, method: 'GET', responseType: 'stream' });
                const writer = fs.createWriteStream(ytDlpPath);
                response.data.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                fs.chmodSync(ytDlpPath, '755');
            }

            // 3. Télécharger
            const fileName = `music_${Date.now()}.mp3`;
            const outputPath = path.join(tempDir, fileName);

            // Commande optimisée pour extraire l'audio
            // On utilise --force-overwrites pour s'assurer du nom
            const cmd = `"${ytDlpPath}" -f "bestaudio/best" -x --audio-format mp3 --ffmpeg-location "${ffmpegPath}" -o "${outputPath}" "${url}" --no-playlist`;

            await execAsync(cmd, { timeout: 300000 });

            if (!fs.existsSync(outputPath)) {
                throw new Error("Le fichier n'a pas été généré.");
            }

            // 4. Envoyer
            await sock.sendMessage(remoteJid, {
                audio: { url: outputPath },
                mimetype: 'audio/mp4',
                fileName: `${title}.mp3`
            }, { quoted: m });

            await sock.sendMessage(remoteJid, { react: { text: "✅", key: m.key } });

            // Cleanup
            setTimeout(() => {
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }, 60000);

        } catch (error) {
            console.error("Erreur Play:", error);
            await sock.sendMessage(remoteJid, { text: `❌ Erreur : ${error.message || "Échec du téléchargement"}` }, { quoted: m });
        }
    }
};
