"use client";

import { useState, useRef } from "react";
import DocumentUpload from "../components/DocumentUpload";
import ChatInterface from "../components/ChatInterface";
import DocumentsList from "../components/DocumentsList";
import dynamic from "next/dynamic";
import type { DiffOperation } from "@/lib/utils/diff";
import type { EditorRef } from "@/components/Editor";

const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
});

export default function Home() {
  const [showUpload, setShowUpload] = useState(false);
  const [showDocumentsDrawer, setShowDocumentsDrawer] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(
    null
  );
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  );
  const documentsListRef = useRef<{ refresh: () => void } | null>(null);
  const editorRef = useRef<EditorRef | null>(null);

  const handleSelectResume = (resumeId: number) => {
    setSelectedResumeId(resumeId);
    setSelectedDocumentId(resumeId);
  };

  const handleSelectDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
    setSelectedResumeId(null);
  };

  const handleDocumentDeleted = () => {
    if (selectedResumeId === selectedDocumentId) {
      setSelectedResumeId(null);
    }
    setSelectedDocumentId(null);
    if (documentsListRef.current) {
      documentsListRef.current.refresh();
    }
  };

  const handleApplyChanges = async (
    operations: DiffOperation[],
    documentId: number
  ) => {
    if (editorRef.current && selectedDocumentId === documentId) {
      try {
        await editorRef.current.applyChanges(operations);
      } catch (error) {
        console.error("Failed to apply changes: ", error);
      }
    } else {
      console.error(
        "Failed to apply changes: editor not found or document ID mismatch"
      );
    }
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-gray-800">
      <header className="border-b border-gray-700 bg-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDocumentsDrawer(!showDocumentsDrawer)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">
              My Resume Assistant
            </h1>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden relative">
        <div
          className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
            showDocumentsDrawer
              ? "bg-opacity-50 opacity-100"
              : "bg-opacity-0 opacity-0 pointer-events-none"
          }`}
          onClick={() => setShowDocumentsDrawer(false)}
        />
        <div
          className={`fixed left-0 top-0 bottom-0 w-80 bg-gray-800 border-r border-gray-700 z-50 flex flex-col shadow-xl transition-transform duration-300 ease-in-out ${
            showDocumentsDrawer ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Documents</h2>
            <button
              onClick={() => setShowDocumentsDrawer(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close drawer"
            >
              <svg
                className="w-6 h-6"
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
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
              {showUpload ? "Hide Upload" : "Upload Document"}
            </button>
            {showUpload && (
              <div className="mt-4 bg-gray-900 rounded-lg p-4">
                <DocumentUpload />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <DocumentsList
              ref={documentsListRef}
              selectedDocumentId={selectedDocumentId}
              selectedResumeId={selectedResumeId}
              onSelectDocument={handleSelectDocument}
              onSelectResume={handleSelectResume}
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden grid grid-cols-12 gap-4 p-4 h-full">
          <div className="col-span-6 overflow-hidden flex flex-col">
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-white">Chat</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                selectedDocumentId={selectedResumeId || selectedDocumentId}
                onApplyChanges={handleApplyChanges}
              />
            </div>
          </div>
          <div className="col-span-6 overflow-hidden flex flex-col">
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-white">Editor</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                documentId={selectedDocumentId}
                onDocumentDeleted={handleDocumentDeleted}
                editorRef={editorRef}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
