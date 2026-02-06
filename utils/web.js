const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const SETTINGS_FILE = path.resolve(__dirname, "../data/settings.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Keep Alive Endpoint
app.get('/ping', (req, res) => res.send('pong'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));

// Middleware d'authentification simple
function checkAuth(req, res, next) {
    // Pour l'instant, on fait simple : le mot de passe est stocké dans settings
    // Dans une vraie prod, on utiliserait des sessions/cookies
    next();
}

// 1. Loader API
app.get('/api/settings', (req, res) => {
    if (fs.existsSync(SETTINGS_FILE)) {
        res.json(JSON.parse(fs.readFileSync(SETTINGS_FILE)));
    } else {
        res.json({});
    }
});

// 2. Save API
app.post('/api/settings', (req, res) => {
    const { password, ...newSettings } = req.body;

    if (!fs.existsSync(SETTINGS_FILE)) return res.status(500).send("Config missing");

    const current = JSON.parse(fs.readFileSync(SETTINGS_FILE));

    // Vérification mot de passe basique
    if (password !== current.dashboard_password) {
        return res.status(403).json({ error: "Mot de passe incorrect" });
    }

    // Merge settings
    const updated = { ...current, ...newSettings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2));

    res.json({ success: true });
});

// 3. Sync Session API (Manuelle)
app.post('/api/sync-session', async (req, res) => {
    const { password } = req.body;
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE));

    if (password !== settings.dashboard_password) {
        return res.status(403).json({ error: "Mot de passe incorrect" });
    }

    // On délègue la synchro à une fonction qui sera injectée depuis index.js
    if (global.manualSyncSession) {
        try {
            await global.manualSyncSession();
            res.json({ success: true, message: "Synchro lancée (Redémarrage Render imminent)" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        res.status(500).json({ error: "Fonction de synchro non initialisée" });
    }
});

module.exports = (port) => {
    app.listen(port, () => {
        console.log(`🌍 Dashboard accessible sur le port ${port}`);
    });
};
