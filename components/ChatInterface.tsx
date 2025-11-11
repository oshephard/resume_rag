"use client";

import { useRef, useEffect, useState } from "react";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
export default function ChatInterface() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/documents/query",
    }),
  });

  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="flex-1 border border-gray-700 rounded-lg overflow-y-auto p-4 mb-2 bg-gray-900 min-h-0">
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-4 text-red-200">
            Error: {error.message || String(error)}
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center mt-8">
            Ask a question about your uploaded documents...
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-200 border border-gray-700"
                  }`}
                >
                  {m.parts.map((part, index) => {
                    switch (part.type) {
                      case "text":
                        return <p key={index}>{part.text}</p>;
                    }
                  })}
                  {status === "streaming" && (
                    <div className="animate-pulse">...</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
        className="flex gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or use /new-experience to add an experience..."
          className="flex-1 border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={status === "submitted"}
        />
        <button
          type="submit"
          disabled={!input.trim() || status === "submitted"}
          className="bg-blue-600 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
