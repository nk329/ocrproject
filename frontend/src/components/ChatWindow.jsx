import React, { useState, useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";

function ChatWindow({ messages, onAskAI }) {
  const [question, setQuestion] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onAskAI(question);
    setQuestion("");
  };
  
  return (
    <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[60vh]">
      <div className="p-4 border-b">
         <h4 className="text-md font-semibold text-gray-800 flex items-center">
          <span className="text-xl mr-2">💬</span> AI 영양 코치와 대화하기
        </h4>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: 단백질이 부족한데 어떤 음식을 먹을까요?"
          className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
          전송
        </button>
      </form>
    </div>
  );
}

export default ChatWindow; 