/**
 * qrGenerator.js
 * Genera un QR como string base64 (data URL) a partir de una URL de sala.
 * Usa la librería 'qrcode'.
 */

const QRCode = require('qrcode');

/**
 * Genera un QR en formato data URL (base64 PNG).
 * @param {string} url - URL completa de la sala (ej: http://192.168.1.15:3000/play?room=ABCD)
 * @returns {Promise<string>} Data URL base64 del QR.
 */
async function generateQR(url) {
    try {
        const dataUrl = await QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            color: { dark: '#1a1a2e', light: '#ffffff' },
        });
        return dataUrl;
    } catch (err) {
        throw new Error(`[qrGenerator] Error generando QR: ${err.message}`);
    }
}

module.exports = { generateQR };
