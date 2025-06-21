import React from "react";

function ChatBubble({ message }) {
  const { role, content, isTyping } = message;
  const isUser = role === "user";

  const bubbleClasses = isUser
    ? "bg-green-600 text-white self-end rounded-br-none"
    : "bg-gray-50 text-gray-800 self-start rounded-bl-none";

  const avatar = isUser ? "You" : "AI";

  return (
    <div className={`flex items-start gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md ${isUser ? 'bg-blue-500' : 'bg-green-600'}`}>
        {avatar}
      </div>
      <div className={`max-w-[75%] p-3 rounded-lg ${bubbleClasses}`}>
        {isTyping ? (
          <div className="flex items-center space-x-1 pt-2">
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></span>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        )}
      </div>
    </div>
  );
}

export default ChatBubble; 