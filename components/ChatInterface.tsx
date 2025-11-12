"use client";

import { useRef, useEffect, useState } from "react";

import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import type { DiffOperation } from "@/lib/utils/diff";
import DiffPreview from "./DiffPreview";
import { DefaultChatTransport, UIDataTypes, UIMessage, UITools } from "ai";

interface ChatInterfaceProps {
  selectedDocumentId?: number | null;
  onApplyChanges?: (operations: DiffOperation[], documentId: number) => void;
}

export default function ChatInterface({
  selectedDocumentId,
  onApplyChanges,
}: ChatInterfaceProps) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/documents/query",
      body: {
        documentId: selectedDocumentId,
      },
    }),
  });

  const [input, setInput] = useState("");
  const [pendingChanges, setPendingChanges] = useState<{
    operations: DiffOperation[];
    documentId: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractToolResults = (
    message: UIMessage<unknown, UIDataTypes, UITools>
  ): DiffOperation[] | null => {
    if (message.role !== "assistant") return null;

    const allStructuredChanges: DiffOperation[] = [];

    if (message.parts) {
      for (const part of message.parts) {
        if (part.type === "tool-provideResumeSuggestions") {
          allStructuredChanges.push(...part.output?.structuredChanges);
        }
      }
    }

    return allStructuredChanges;
  };

  const handleApplyClick = (operations: DiffOperation[]) => {
    setPendingChanges({ operations, documentId: selectedDocumentId });
  };

  const handleConfirmApply = () => {
    if (pendingChanges && onApplyChanges) {
      onApplyChanges(pendingChanges.operations, pendingChanges.documentId);
      setPendingChanges(null);
    }
  };

  const handleCancelApply = () => {
    setPendingChanges(null);
  };

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
            {messages.map((m) => {
              const toolResults = extractToolResults(m);
              const hasStructuredChanges =
                toolResults && toolResults.length > 0;
              return (
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
                          return (
                            <ReactMarkdown
                              key={index}
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside mb-2 space-y-1">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-inside mb-2 space-y-1">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="ml-2">{children}</li>
                                ),
                                code: ({ children, className }) => {
                                  const isInline = !className;
                                  return isInline ? (
                                    <code className="bg-gray-700 px-1 py-0.5 rounded text-sm">
                                      {children}
                                    </code>
                                  ) : (
                                    <code className="block bg-gray-700 p-2 rounded text-sm overflow-x-auto">
                                      {children}
                                    </code>
                                  );
                                },
                                pre: ({ children }) => (
                                  <pre className="mb-2">{children}</pre>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold">
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic">{children}</em>
                                ),
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    className="text-blue-400 hover:text-blue-300 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {children}
                                  </a>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">
                                    {children}
                                  </h3>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-gray-600 pl-4 italic my-2">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {part.text}
                            </ReactMarkdown>
                          );
                      }
                    })}
                    {hasStructuredChanges && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <button
                          onClick={() => handleApplyClick(toolResults)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Apply Changes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {status === "submitted" && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-200 border border-gray-700">
                  <div className="animate-pulse">Thinking...</div>
                </div>
              </div>
            )}
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
      {pendingChanges && (
        <DiffPreview
          operations={pendingChanges.operations}
          documentId={pendingChanges.documentId}
          onConfirm={handleConfirmApply}
          onCancel={handleCancelApply}
        />
      )}
    </div>
  );
}
