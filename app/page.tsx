"use client";

import { useState } from "react";
import DocumentUpload from "./components/DocumentUpload";
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <main className="flex h-screen overflow-hidden bg-gray-800">
      <aside
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 ease-in-out overflow-hidden border-r border-gray-700 bg-slate-100 shadow-sm`}
      >
        <div className="h-full overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Upload Document</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-200 rounded-md transition-colors text-gray-800"
              aria-label="Close sidebar"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <DocumentUpload />
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="p-4 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-md transition-colors text-white"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
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
              ) : (
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
              )}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Document RAG System</h1>
              <p className="text-sm text-gray-400">
                Upload documents and ask questions using AI-powered retrieval.
              </p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}

