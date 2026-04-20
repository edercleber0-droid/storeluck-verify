const axios = require("axios");

/**
 * 🔑 Verificador de key
 * Usa sua API do store-key-system
 */

async function verifyKey(key) {
  try {
    const res = await axios.get(
      `https://SEU-SITE.onrender.com/check?key=${key}`
    );

    if (res.data.valid) {
      return true; // liberado
    }

    return false; // bloqueado
  } catch (err) {
    return false; // erro = bloqueia por segurança
  }
}

module.exports = verifyKey;