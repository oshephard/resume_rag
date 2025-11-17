"use client";

import { useRef, useEffect, useState, useMemo } from "react";

import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import type { DiffOperation } from "@/lib/utils/diff";
import DiffPreview from "./DiffPreview";
import ContextSelector from "./ContextSelector";
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
  const [selectedContextIds, setSelectedContextIds] = useState<number[]>([]);
  const [contextDocuments, setContextDocuments] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [allDocuments, setAllDocuments] = useState<
    Array<{
      id: number;
      name: string;
      type: "resume" | "other";
      tags: string[];
    }>
  >([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [explicitlyRemovedIds, setExplicitlyRemovedIds] = useState<Set<number>>(
    new Set()
  );
  const explicitlyRemovedIdsRef = useRef<Set<number>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    explicitlyRemovedIdsRef.current = explicitlyRemovedIds;
  }, [explicitlyRemovedIds]);

  useEffect(() => {
    if (!allDocuments.length) return;

    if (selectedDocumentId) {
      const doc = allDocuments.find((d) => d.id === selectedDocumentId);
      if (doc) {
        setSelectedContextIds((prev) => {
          if (
            !prev.includes(selectedDocumentId) &&
            !explicitlyRemovedIdsRef.current.has(selectedDocumentId)
          ) {
            const newContextIds = [...prev, selectedDocumentId];
            updateContextDocumentsMetadata(newContextIds, allDocuments);
            return newContextIds;
          }
          return prev;
        });
      }
    }
  }, [selectedDocumentId, allDocuments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMentionDropdown(false);
        setMentionQuery("");
        setMentionStartIndex(-1);
      }
    };

    if (showMentionDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMentionDropdown]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents/list");
      const data = await response.json();
      if (data.success) {
        const allDocs = [
          ...(data.resumes || []),
          ...(data.otherDocuments || []),
        ];
        setAllDocuments(allDocs);
        updateContextDocumentsMetadata(selectedContextIds, allDocs);
      }
    } catch (err: any) {
      console.error("Failed to fetch documents: ", err);
    }
  };

  const updateContextDocumentsMetadata = (
    ids: number[],
    docs: Array<{
      id: number;
      name: string;
      type: "resume" | "other";
      tags: string[];
    }>
  ) => {
    const metadata = ids
      .map((id) => {
        const doc = docs.find((d) => d.id === id);
        return doc ? { id: doc.id, name: doc.name } : null;
      })
      .filter((d): d is { id: number; name: string } => d !== null);
    setContextDocuments(metadata);
  };

  const filteredDocumentsForMention = useMemo(() => {
    if (!mentionQuery.trim()) return allDocuments;
    const query = mentionQuery.toLowerCase();
    return allDocuments.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [allDocuments, mentionQuery]);

  const extractToolResults = (
    message: UIMessage<unknown, UIDataTypes, UITools>
  ): DiffOperation[] | null => {
    if (message.role !== "assistant") return null;

    const allStructuredChanges: DiffOperation[] = [];

    if (message.parts) {
      for (const part of message.parts) {
        if (part.type === "tool-provideResumeSuggestions") {
          const output = part.output as
            | { structuredChanges?: DiffOperation[] }
            | undefined;
          allStructuredChanges.push(...(output?.structuredChanges ?? []));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        setShowMentionDropdown(true);
        return;
      }
    }

    if (showMentionDropdown) {
      setShowMentionDropdown(false);
      setMentionQuery("");
      setMentionStartIndex(-1);
    }
  };

  const handleMentionSelect = (docId: number) => {
    const doc = allDocuments.find((d) => d.id === docId);
    if (!doc) return;

    const startIdx = mentionStartIndex;
    let newInput = input;
    let newCursorPos = input.length;

    if (startIdx !== -1) {
      const beforeAt = input.substring(0, startIdx);
      const afterAt = input.substring(startIdx + 1 + mentionQuery.length);
      newInput = `${beforeAt}${afterAt}`;
      newCursorPos = startIdx;
      setInput(newInput);
    }

    setShowMentionDropdown(false);
    setMentionQuery("");
    setMentionStartIndex(-1);

    if (!selectedContextIds.includes(docId)) {
      const newContextIds = [...selectedContextIds, docId];
      setSelectedContextIds(newContextIds);
      updateContextDocumentsMetadata(newContextIds, allDocuments);
    }

    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleRemoveContext = (docId: number) => {
    const newContextIds = selectedContextIds.filter((id) => id !== docId);
    setSelectedContextIds(newContextIds);
    updateContextDocumentsMetadata(newContextIds, allDocuments);

    if (docId === selectedDocumentId) {
      setExplicitlyRemovedIds((prev) => new Set(prev).add(docId));
    }
  };

  const handleContextSelectionChange = (ids: number[]) => {
    setSelectedContextIds(ids);
    updateContextDocumentsMetadata(ids, allDocuments);

    if (selectedDocumentId && !ids.includes(selectedDocumentId)) {
      setExplicitlyRemovedIds((prev) => new Set(prev).add(selectedDocumentId));
    } else if (selectedDocumentId && ids.includes(selectedDocumentId)) {
      setExplicitlyRemovedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(selectedDocumentId);
        return newSet;
      });
    }
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
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
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
              </div>
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
          <button
            type="button"
            onClick={() => {
              setInput("/job-posting ");
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
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Job Posting
            <div className="relative group">
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                aria-label="Information about Job Posting"
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
              </div>
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-gray-900 text-gray-200 text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-700 w-64">
                  <p>
                    Click to save a job posting. Paste the job posting text and
                    optionally include a link to the posting. It will be saved
                    as a document with the "job" tag.
                  </p>
                  <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-gray-900 border-l border-b border-gray-700 transform rotate-45"></div>
                </div>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setShowContextSelector(true)}
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Add Context
            {selectedContextIds.length > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                {selectedContextIds.length}
              </span>
            )}
          </button>
        </div>
        <div className="relative">
          {contextDocuments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-900 border border-gray-700 rounded-md">
              {contextDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-1.5 px-2 py-1 bg-blue-600 text-white text-xs rounded-md"
                >
                  <span>{doc.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveContext(doc.id)}
                    className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${doc.name}`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(
                { text: input },
                {
                  body: {
                    documentId: selectedDocumentId,
                    contextIds:
                      selectedContextIds.length > 0
                        ? selectedContextIds
                        : undefined,
                  },
                }
              );
              setInput("");
            }}
            className="flex gap-2"
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (
                    showMentionDropdown &&
                    (e.key === "ArrowDown" ||
                      e.key === "ArrowUp" ||
                      e.key === "Enter")
                  ) {
                    e.preventDefault();
                  }
                }}
                placeholder="Ask a question, type @ to mention a document, or use /new-experience or /job-posting..."
                className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={status === "submitted"}
              />
              {showMentionDropdown && (
                <div
                  ref={mentionDropdownRef}
                  className="absolute bottom-full left-0 mb-1 w-full max-h-60 overflow-y-auto bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50"
                  style={{
                    top: "auto",
                    bottom: "100%",
                  }}
                >
                  {filteredDocumentsForMention.length === 0 ? (
                    <div className="p-3 text-gray-400 text-sm text-center">
                      No documents found
                    </div>
                  ) : (
                    filteredDocumentsForMention.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleMentionSelect(doc.id)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm truncate">
                            {doc.name}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {doc.type === "resume" ? "Resume" : "Document"}
                          </div>
                        </div>
                        {selectedContextIds.includes(doc.id) && (
                          <svg
                            className="w-4 h-4 text-blue-500 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || status === "submitted"}
              className="bg-blue-600 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>
      {showContextSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowContextSelector(false)}
          />
          <ContextSelector
            selectedIds={selectedContextIds}
            onSelectionChange={handleContextSelectionChange}
            onClose={() => setShowContextSelector(false)}
          />
        </div>
      )}
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
