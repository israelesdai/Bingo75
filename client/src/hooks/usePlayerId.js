/**
 * usePlayerId.js
 * Genera o recupera el UUID del jugador desde localStorage.
 * El playerId es la identidad permanente del jugador (sobrevive reconexiones).
 */

import { useState, useEffect } from 'react';

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function usePlayerId() {
    const [playerId] = useState(() => {
        let id = localStorage.getItem('bingo75_playerId');
        if (!id) {
            id = generateUUID();
            localStorage.setItem('bingo75_playerId', id);
        }
        return id;
    });

    return playerId;
}
