"use client";

import { useState, useRef } from "react";
import ChatInterface from "../components/ChatInterface";
import DocumentsList from "../components/DocumentsList";
import UploadModal from "../components/UploadModal";
import dynamic from "next/dynamic";
import type { DiffOperation } from "@/lib/utils/diff";
import type { EditorRef } from "@/components/Editor";

const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
});

export default function Home() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  );
  const [creatingResume, setCreatingResume] = useState(false);
  const documentsListRef = useRef<{ refresh: () => void } | null>(null);
  const editorRef = useRef<EditorRef | null>(null);

  const handleSelectResume = (resumeId: number) => {
    setSelectedResumeId(resumeId);
    setSelectedDocumentId(resumeId);
    setShowDocumentsModal(false);
  };

  const handleSelectDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
    setSelectedResumeId(null);
    setShowDocumentsModal(false);
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

  const handleBuildNewResume = async () => {
    setCreatingResume(true);
    try {
      const response = await fetch("/api/documents/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Resume ${new Date().toLocaleDateString()}`,
        }),
      });

      const data = await response.json();

      if (data.success && data.documentId) {
        setSelectedResumeId(data.documentId);
        setSelectedDocumentId(data.documentId);
        if (documentsListRef.current) {
          documentsListRef.current.refresh();
        }
      } else {
        console.error("Failed to create resume: ", data.error);
      }
    } catch (error) {
      console.error("Failed to create resume: ", error);
    } finally {
      setCreatingResume(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    if (documentsListRef.current) {
      documentsListRef.current.refresh();
    }
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-gray-800">
      <header className="border-b border-gray-700 bg-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-white">My Resume Assistant</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload an existing resume
            </button>
            <button
              onClick={() => setShowDocumentsModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Open document in editor
            </button>
            <button
              onClick={handleBuildNewResume}
              disabled={creatingResume}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
              {creatingResume ? "Creating..." : "Create new resume"}
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden flex">
        {selectedDocumentId && (
          <div className="flex-1 overflow-hidden">
            <Editor
              documentId={selectedDocumentId}
              onDocumentDeleted={handleDocumentDeleted}
              onClose={() => {
                setSelectedDocumentId(null);
                setSelectedResumeId(null);
              }}
              editorRef={editorRef}
            />
          </div>
        )}
        <div
          className={`overflow-hidden flex flex-col ${
            selectedDocumentId ? "w-1/2" : "w-full"
          }`}
        >
          <div className="flex-1 overflow-hidden p-6">
            <ChatInterface
              selectedDocumentId={selectedResumeId || selectedDocumentId}
              onApplyChanges={handleApplyChanges}
            />
          </div>
        </div>
      </div>
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
      {showDocumentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowDocumentsModal(false)}
          />
          <div className="relative bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Select Document
              </h2>
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
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
            <div className="flex-1 overflow-y-auto p-6">
              <DocumentsList
                ref={documentsListRef}
                selectedDocumentId={selectedDocumentId}
                selectedResumeId={selectedResumeId}
                onSelectDocument={handleSelectDocument}
                onSelectResume={handleSelectResume}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
