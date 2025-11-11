"use client";

import { useEffect, useState } from "react";

interface Document {
  id: number;
  name: string;
  createdAt: Date | string;
}

export default function DocumentsList() {
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

  return (
    <div className="h-full flex flex-col p-6 bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Documents</h2>
        <button
          onClick={fetchDocuments}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading documents...</div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-red-200">
            {error}
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            No documents found. Upload a document to get started.
          </div>
        </div>
      ) : (
        <div className="flex-1 border border-gray-700 rounded-lg overflow-y-auto bg-gray-900">
          <div className="divide-y divide-gray-700">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{doc.name}</h3>
                    <p className="text-sm text-gray-400">
                      Uploaded {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">ID: {doc.id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
