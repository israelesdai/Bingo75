/**
 * ipDetector.js
 * Detecta automáticamente la IPv4 local (LAN) del servidor.
 * Prioriza interfaces de red activas sobre loopback.
 */

const os = require('os');

/**
 * Retorna la primera IPv4 local no-loopback encontrada.
 * Si no hay red disponible, retorna '127.0.0.1' como fallback.
 * @returns {string}
 */
function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }

    return '127.0.0.1';
}

module.exports = { getLocalIP };
