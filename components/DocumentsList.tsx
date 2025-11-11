"use client";

import { useEffect, useState, useImperativeHandle, forwardRef } from "react";

interface Document {
  id: number;
  name: string;
  createdAt: Date | string;
}

interface DocumentsListProps {
  selectedDocumentId?: number | null;
  onSelectDocument?: (documentId: number) => void;
}

export interface DocumentsListRef {
  refresh: () => void;
}

const DocumentsList = forwardRef<DocumentsListRef, DocumentsListProps>(
  ({ selectedDocumentId, onSelectDocument }, ref) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/documents/list");
        const data = await response.json();

        if (data.success) {
          setDocuments(data.documents);
        } else {
          setError(data.error || "Failed to fetch documents");
        }
      } catch (err: any) {
        console.error("Failed to fetch documents: ", err);
        setError("Failed to fetch documents");
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refresh: fetchDocuments,
    }));

    useEffect(() => {
      fetchDocuments();
    }, []);

    const formatDate = (date: Date | string) => {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const handleDocumentClick = (docId: number) => {
      onSelectDocument?.(docId);
    };

    return (
      <div className="h-full flex flex-col bg-gray-800">
        <div className="flex items-center justify-end mb-2 flex-shrink-0">
          <button
            onClick={fetchDocuments}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="text-gray-400 text-sm">Loading documents...</div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="bg-red-900 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="text-gray-400 text-center text-sm">
              No documents found. Upload a document to get started.
            </div>
          </div>
        ) : (
          <div className="flex-1 border border-gray-700 rounded-lg overflow-y-auto bg-gray-900 min-h-0">
            <div className="divide-y divide-gray-700">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedDocumentId === doc.id
                      ? "bg-blue-900 border-l-4 border-blue-500"
                      : "hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium mb-1 text-sm truncate">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Uploaded {formatDate(doc.createdAt)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      ID: {doc.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

DocumentsList.displayName = "DocumentsList";

export default DocumentsList;
