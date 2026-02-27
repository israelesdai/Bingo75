import styles from '../views/Admin/Admin.module.css'; // Reusing admin styles for glass effect

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalCard} animate-scale-in`}>
                <h3 className={styles.modalTitle}>{title}</h3>
                <p className={styles.modalMessage}>{message}</p>
                <div className={styles.modalActions}>
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={onConfirm}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
