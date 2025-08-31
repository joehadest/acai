// src/components/WhatsAppModal.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappLink: string;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, whatsappLink }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-purple-600 mb-4">Pedido Enviado!</h2>
        <p className="mb-6">Seu pedido foi recebido. Para agilizar, envie os detalhes para o nosso WhatsApp.</p>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
          onClick={onClose}
        >
          Enviar para o WhatsApp
        </a>
        <button
          onClick={onClose}
          className="mt-4 text-gray-500 hover:text-gray-700"
        >
          Fechar
        </button>
      </motion.div>
    </motion.div>
  );
};

export default WhatsAppModal;