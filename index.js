require('dotenv').config();
const dns = require('dns');
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    Browsers
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const chalk = require("chalk");
const qrcode = require("qrcode-terminal");
const cfonts = require("cfonts");
const logger = require("./utils/logger");
const handleMessage = require("./utils/handler");
const checkAntilink = require("./utils/antilink");
const handleViewOnceData = require("./utils/viewOnceHandler");
const { askGroq } = require("./utils/groq");
const axios = require("axios");

// --- PERSISTANCE RENDER ---
async function syncSessionToRender() {
    const apiKey = process.env.RENDER_API_KEY;
    const serviceId = process.env.RENDER_SERVICE_ID;
    if (!apiKey || !serviceId) return;

    try {
        const credsPath = path.join(__dirname, 'auth_info', 'creds.json');
        if (!fs.existsSync(credsPath)) return;

        const creds = fs.readFileSync(credsPath, 'utf-8');
        const sessionBase64 = Buffer.from(creds).toString('base64');

        if (process.env.SESSION_DATA === sessionBase64) return;

        logger.info("📤 [Render] Sauvegarde de la session...");
        await axios.patch(`https://api.render.com/v1/services/${serviceId}/env-vars`,
            [{ key: "SESSION_DATA", value: sessionBase64 }],
            { headers: { Authorization: `Bearer ${apiKey}`, "Accept": "application/json", "Content-Type": "application/json" } }
        );
        logger.info("✅ [Render] Session synchronisée.");
    } catch (error) {
        logger.error("[Render Sync] Error:", error.message);
    }
}

// -- GESTION DE L'ÉTAT (SETTINGS) --
let antideleteGroups = new Set();
let antilinkGroups = new Set();
const SETTINGS_FILE = path.resolve(__dirname, "./data/settings.json");
let lastOwnerActionTime = Date.now(); // Pour le mode AFK

function isOwner(m, sock) {
    const ownerNum = process.env.OWNER_NUMBER;
    const sender = m.key.participant || m.key.remoteJid || "";
    const senderClean = sender.split('@')[0].split(':')[0];
    const botClean = sock.user?.id?.split('@')[0]?.split(':')[0];

    return m.key.fromMe ||
        senderClean === ownerNum ||
        senderClean === botClean ||
        (m.participant || m.key.participant || "").includes(ownerNum);
}

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = JSON.parse(fs.readFileSync(SETTINGS_FILE));
            antideleteGroups = new Set(data.antidelete || []);
            antilinkGroups = new Set(data.antilink_groups || []);
            logger.info(`Paramètres chargés: ${antideleteGroups.size} Anti-Faz, ${antilinkGroups.size} Anti-Lien`);
        }
    } catch (e) { }
}
loadSettings();

// -- CACHE --
const antideletePool = new Map();
const messageCache = new Map();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

function showBanner() {
    cfonts.say("Will's Bot|2.0", {
        font: 'block',
        align: 'center',
        colors: ['cyan', 'blue'],
        letterSpacing: 1,
        lineHeight: 1,
        space: true,
        maxLength: '0',
    });
    console.log(chalk.blue.bold("\n--- Système de Bot WhatsApp Intelligent (Psychobot v2 Integration) ---\n"));
}

async function startBot() {
    showBanner();

    const AUTH_FOLDER = path.join(__dirname, "auth_info");
    if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER);

    // Restauration Render
    if (process.env.SESSION_DATA) {
        logger.info("🔹 Restauration de la session depuis SESSION_DATA...");
        try {
            const credsPath = path.join(AUTH_FOLDER, 'creds.json');
            const sessionBuffer = Buffer.from(process.env.SESSION_DATA, 'base64').toString('utf-8');
            JSON.parse(sessionBuffer);
            fs.writeFileSync(credsPath, sessionBuffer);
        } catch (e) {
            logger.error("❌ Échec restauration session:", e.message);
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    logger.info(`Démarrage de Will's Bot 2.0 (Baileys v${version.join(".")})`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Will's Bot 2.0", "MacOS", "Desktop"],
        getMessage: async (key) => {
            if (messageCache.has(key.id)) {
                const msg = messageCache.get(key.id);
                return msg.message || undefined;
            }
            return { conversation: 'hello' };
        }
    });

    if (process.argv.includes("--pairing") && !sock.authState.creds.registered) {
        const phoneNumber = await question(chalk.cyan("\nEntrez votre numéro de téléphone : "));
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
            console.log(chalk.black.bgGreen.bold(`\n CODE DE COUPLAGE : ${code} \n`));
        }, 3000);
    }

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr && !process.argv.includes("--pairing")) {
            qrcode.generate(qr, { small: true });
        }
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ?
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            logger.success("✅ Connecté !");
        }
    });

    sock.ev.on("creds.update", async () => {
        await saveCreds();
        if (sock?.user) await syncSessionToRender();
    });

    // --- ANTI-DELETE ---
    sock.ev.on("messages.update", async (updates) => {
        for (const update of updates) {
            const proto = update.update?.message?.protocolMessage || update.update?.protocolMessage;
            if (proto?.type === 0) {
                const jid = update.key.remoteJid;
                if (!antideleteGroups.has(jid)) {
                    logger.debug(`Suppression ignorée: groupe ${jid} non présent dans Anti-Faz`);
                    continue;
                }
                logger.info(`🔍 Détection suppression dans ${jid}`);
                const targetId = proto.key?.id;
                const archived = antideletePool.get(targetId);
                if (archived && !archived.key.fromMe) {
                    const sender = archived.key.participant || archived.key.remoteJid;
                    await sock.sendMessage(jid, {
                        text: `🕵️ *Anti-Faz* \n@${sender.split('@')[0]} a supprimé ce message :`,
                        mentions: [sender]
                    }, { quoted: archived });
                    await sock.sendMessage(jid, { forward: archived });
                }
            }
        }
    });

    // --- VIEWONCE RÉACTION ---
    sock.ev.on("messages.reaction", async (reactions) => {
        for (const reaction of reactions) {
            const sender = reaction.key.participant || reaction.key.remoteJid;
            const senderClean = sender.split('@')[0].split(':')[0];
            const ownerNum = process.env.OWNER_NUMBER;
            const botClean = sock.user?.id?.split('@')[0]?.split(':')[0];

            // On autorise si c'est le bot ou le numéro proprio défini
            const isAuthorized = reaction.key.fromMe || senderClean === ownerNum || senderClean === botClean;

            if (isAuthorized && reaction.reaction?.text === '👀') {
                logger.info(`🎯 Réaction 👀 détectée de ${senderClean}. Extraction ViewOnce...`);
                await handleViewOnceData(reaction, sock, messageCache, sock.user?.id);
            }
        }
    });

    // --- SECRÉTAIRE IA ---
    sock.ev.on('call', async (callEvents) => {
        for (const call of callEvents) {
            if (call.status === 'offer') {
                try {
                    await sock.rejectCall(call.id, call.from); // Rejeter l'appel proprement
                    const sysPrompt = "Tu es le secrétaire IA de Will. Un contact vient d'appeler. Dis poliment que Will est occupé et demande de laisser un message écrit. Sois bref (max 15 mots).";
                    const excuse = await askGroq("Génère une excuse pour un appel manqué.", sysPrompt);
                    await sock.sendMessage(call.from, { text: `📞 *Secrétaire IA*\n\n${excuse}` });
                } catch (e) { }
            }
        }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;
        const msg = messages[0];

        // --- 0. AUTO-VIEW & AUTO-LIKE STATUS ---
        if (msg.key.remoteJid === 'status@broadcast') {
            const statusOwner = msg.key.participant || msg.participant;
            await sock.readMessages([msg.key]);
            try {
                await sock.sendMessage('status@broadcast', {
                    react: { text: '❤️', key: msg.key }
                }, { statusJidList: [statusOwner] });
            } catch (err) { }
            return;
        }

        if (!msg.message) return;

        // Mise à jour de l'activité du proprio (AFK check)
        const isOwnerMsg = isOwner(msg, sock);
        if (isOwnerMsg) lastOwnerActionTime = Date.now();

        // --- 1. IA AUTO-REPLY POUR LES SALUTATIONS (Mode AFK) ---
        const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || "").toLowerCase().trim();
        const greetings = ['hello', 'hi', 'bonjour', 'salut', 'yo', 'coucou', 'hey', 'cc', 'bjr', 'bsr'];

        if (!isOwnerMsg && greetings.includes(text)) {
            const isAFK = (Date.now() - lastOwnerActionTime) > 60000; // Pas d'action depuis 1 min
            if (isAFK) {
                const sysPrompt = "Tu es Will's Bot 2.0. Réponds poliment à la salutation et précise que Will n'est pas disponible pour l'instant mais que je suis là pour aider. Réponds en moins de 15 mots.";
                const reply = await askGroq(text, sysPrompt);
                await sock.sendMessage(msg.key.remoteJid, { text: `🤖 *Auto-Reply AFK*\n\n${reply}` }, { quoted: msg });
            }
        }

        // Cache pour Anti-Delete
        if (!msg.message.protocolMessage) {
            antideletePool.set(msg.key.id, msg);
            if (antideletePool.size > 1000) antideletePool.delete(antideletePool.keys().next().value);
        }

        // Cache pour ViewOnce
        const realMsg = msg.message?.ephemeralMessage?.message || msg.message;
        const isViewOnce = realMsg?.viewOnceMessage || realMsg?.viewOnceMessageV2 || realMsg?.viewOnceMessageV2Extension;

        messageCache.set(msg.key.id, msg);
        setTimeout(() => messageCache.delete(msg.key.id), isViewOnce ? 24 * 3600 * 1000 : 3600 * 1000);

        // 1. Antilink
        if (await checkAntilink(sock, msg)) return;

        // 2. Ninja Extraction (Réponse à un ViewOnce sans commande)
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted && isOwnerMsg) {
            let qContent = quoted;
            if (qContent.ephemeralMessage) qContent = qContent.ephemeralMessage.message;
            const isQViewOnce = qContent.viewOnceMessage || qContent.viewOnceMessageV2 || qContent.viewOnceMessageV2Extension;
            if (isQViewOnce) {
                // On simule une réaction 👀 pour déclencher handleViewOnceData
                const fakeReaction = {
                    key: { remoteJid: msg.key.remoteJid, id: msg.message.extendedTextMessage.contextInfo.stanzaId },
                    reaction: { text: "👀" },
                    participant: msg.key.participant || msg.key.remoteJid
                };
                handleViewOnceData(fakeReaction, sock, messageCache, sock.user.id);
            }
        }

        // 3. Commandes
        msg.antideleteGroups = antideleteGroups;
        msg.antilinkGroups = antilinkGroups;
        await handleMessage(sock, msg);
    });
}

startBot().catch(err => logger.error("Erreur fatale:", err));
