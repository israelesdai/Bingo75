/**
 * NicknameEditor.jsx
 * Editor inline del apodo del número actual.
 */

import { useState, useEffect } from 'react';
import styles from './Admin.module.css';

export default function NicknameEditor({ currentBall, onUpdateNickname }) {
    const [editing, setEditing] = useState(false);
    const [nickname, setNickname] = useState('');

    useEffect(() => {
        if (currentBall) setNickname(currentBall.nickname || '');
        setEditing(false);
    }, [currentBall?.number]);

    if (!currentBall) return null;

    const handleSave = () => {
        if (nickname.trim()) {
            onUpdateNickname(currentBall.number, nickname.trim());
        }
        setEditing(false);
    };

    return (
        <div className={`card-glass ${styles.nicknameCard} animate-fade-in`}>
            <p className="label">✏️ Apodo del número actual</p>
            <div className={styles.nicknameRow}>
                <span
                    className={styles.nicknameBall}
                    style={{ color: `var(--color-${currentBall.column})` }}
                >
                    {currentBall.column}-{currentBall.number}
                </span>

                {editing ? (
                    <>
                        <input
                            id="input-nickname"
                            className={`input ${styles.nicknameInput}`}
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            autoFocus
                            maxLength={50}
                        />
                        <button id="btn-save-nickname" className="btn btn-primary btn-sm" onClick={handleSave}>
                            Guardar
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                            Cancelar
                        </button>
                    </>
                ) : (
                    <>
                        <span className={styles.nicknameText}>{currentBall.nickname}</span>
                        <button
                            id="btn-edit-nickname"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditing(true)}
                        >
                            ✏️ Editar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
