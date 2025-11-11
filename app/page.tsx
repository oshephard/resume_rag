"use client";

import { useState } from "react";
import DocumentUpload from "../components/DocumentUpload";
import ChatInterface from "../components/ChatInterface";
import DocumentsList from "../components/DocumentsList";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
});

type Tab = "chat" | "editor" | "documents";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [showUpload, setShowUpload] = useState(false);

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-gray-800">
      <header className="border-b border-gray-700 bg-gray-900">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">
              My Resume Assistant
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === "chat"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === "documents"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                Documents
              </button>
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === "editor"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                Editor
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {showUpload ? "Hide Upload" : "Upload Document"}
            </button>
          </div>
        </div>
        {showUpload && (
          <div className="border-t border-gray-700 bg-slate-100 p-4">
            <DocumentUpload />
          </div>
        )}
      </header>
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <ChatInterface />
        ) : activeTab === "documents" ? (
          <DocumentsList />
        ) : (
          <div className="h-full p-6 bg-gray-800">
            <Editor />
          </div>
        )}
      </div>
    </main>
  );
}
