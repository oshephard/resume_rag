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
    }),
  });

  const isStreaming = status === "submitted" || status === "streaming";

  const [input, setInput] = useState("");
  const [pendingChanges, setPendingChanges] = useState<{
    operations: DiffOperation[];
    documentId: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
          allStructuredChanges.push(...(part.output?.structuredChanges ?? []));
        }
      }
    }

    return allStructuredChanges;
  };

  const handleApplyClick = (operations: DiffOperation[]) => {
    if (!selectedDocumentId) return;
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
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-800 text-gray-200 border border-gray-700">
              How can I help you today?
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, index) => {
              const toolResults = extractToolResults(m);
              const hasStructuredChanges =
                toolResults && toolResults.length > 0;
              const isLastMessage = index === messages.length - 1;
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
                    {m.role === "assistant" && isLastMessage && isStreaming && (
                      <div className="animate-pulse">...</div>
                    )}
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        <div className="flex flex-wrap gap-2 mb-2 items-center">
          <button
            type="button"
            onClick={() => {
              setInput("/new-experience ");
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }}
            disabled={status === "submitted"}
            className="px-3 py-1.5 text-xs bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Experience
            <div className="relative group">
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                aria-label="Information about New Experience"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-gray-900 text-gray-200 text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-700 w-64">
                  <p>
                    Click to add a new experience to your history. This will
                    insert the command and prompt you to describe your
                    experience, including details like date, description,
                    company, position, and more.
                  </p>
                  <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-gray-900 border-l border-b border-gray-700 transform rotate-45"></div>
                </div>
              </div>
            </div>
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(
              { text: input },
              { body: { documentId: selectedDocumentId } }
            );
            setInput("");
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
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
