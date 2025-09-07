import React from 'react';
import Modal from '../../atoms/Modal/Modal';
import { FaCheckCircle } from 'react-icons/fa';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, title = '¡Operación exitosa!', message = 'La operación se completó correctamente.', buttonText = 'Aceptar' }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="success-modal">
        <div className="success-modal__icon">
          <FaCheckCircle />
        </div>
        <h2 className="success-modal__title">{title}</h2>
        <p className="success-modal__message">{message}</p>
        <button 
          className="success-modal__button"
          onClick={onClose}
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
};

export default SuccessModal;
