import React from 'react';
import ChatWindow from './ChatWindow';
import { motion, AnimatePresence } from 'framer-motion';

function ChatModal({ isOpen, onClose, messages, onAskAI }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 모달 배경 (오른쪽 패널만 덮도록 absolute로 변경) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          
          {/* 모달 컨텐츠 */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl h-[90%] flex flex-col z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">AI 영양 코치</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <ChatWindow messages={messages} onAskAI={onAskAI} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ChatModal; 