import React from "react";
import "./ModalConfirmacion.css";

export default function ModalConfirmacion({ open, onClose, onConfirm, mensaje = "¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer.", titulo = "Eliminar registro", textoBotonEliminar = "Eliminar", textoBotonCancelar = "Cancelar" }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-container delete-modal" style={{ maxWidth: 340, padding: 0 }}>
        <div className="modal-content" style={{ padding: '24px 20px 16px 20px', borderRadius: 14 }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', textAlign: 'center', color: '#dc3545' }}>{titulo}</h2>
          <p style={{ fontSize: '0.95rem', color: '#333', marginBottom: 18, textAlign: 'center' }}>{mensaje}</p>
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button onClick={onConfirm} className="btn-modal-action btn-eliminar" style={{ minWidth: 90 }}>{textoBotonEliminar}</button>
            <button onClick={onClose} className="btn-modal-action" style={{ minWidth: 90 }}>{textoBotonCancelar}</button>
          </div>
          <button onClick={onClose} className="btn-close-modal" style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>✕</button>
        </div>
      </div>
    </div>
  );
}
