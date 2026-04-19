const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

function loadKeys() {
    return JSON.parse(fs.readFileSync("./keys.json"));
}

function saveKeys(data) {
    fs.writeFileSync("./keys.json", JSON.stringify(data, null, 2));
}

// 🔑 GERAR KEY (1D / 3D / PERM)
app.get("/generate", (req, res) => {
    const type = req.query.type;

    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    const now = Date.now();

    let expiresAt = null;

    if (type === "1d") expiresAt = now + 24 * 60 * 60 * 1000;
    if (type === "3d") expiresAt = now + 3 * 24 * 60 * 60 * 1000;
    if (type === "perm") expiresAt = null;

    const data = loadKeys();

    data.keys.push({
        key,
        type,
        createdAt: now,
        expiresAt
    });

    saveKeys(data);

    res.json({ key, type, expiresAt });
});

// 🔍 CHECK KEY
app.get("/check", (req, res) => {
    const key = req.query.key;

    const data = loadKeys();

    const found = data.keys.find(k => k.key === key);

    if (!found) {
        return res.json({ valid: false });
    }

    if (found.type === "perm") {
        return res.json({ valid: true });
    }

    if (found.expiresAt && Date.now() > found.expiresAt) {
        return res.json({ valid: false, reason: "expired" });
    }

    return res.json({ valid: true });
});

app.listen(PORT, () => {
    console.log("StoreLuck API rodando na porta " + PORT);
});
