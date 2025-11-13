"use client";

import { useEffect, useState, useImperativeHandle, forwardRef, useMemo } from "react";

interface Document {
  id: number;
  name: string;
  type: "resume" | "other";
  tags: string[];
  createdAt: Date | string;
}

interface DocumentsListProps {
  selectedDocumentId?: number | null;
  selectedResumeId?: number | null;
  onSelectDocument?: (documentId: number) => void;
  onSelectResume?: (resumeId: number) => void;
}

export interface DocumentsListRef {
  refresh: () => void;
}

const DocumentsList = forwardRef<DocumentsListRef, DocumentsListProps>(
  (
    {
      selectedDocumentId,
      selectedResumeId,
      onSelectDocument,
      onSelectResume,
    },
    ref
  ) => {
    const [resumes, setResumes] = useState<Document[]>([]);
    const [otherDocuments, setOtherDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/documents/list");
        const data = await response.json();

        if (data.success) {
          setResumes(data.resumes || []);
          setOtherDocuments(data.otherDocuments || []);
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

    const handleResumeClick = (resumeId: number) => {
      onSelectResume?.(resumeId);
    };

    const handleDocumentClick = (docId: number) => {
      onSelectDocument?.(docId);
    };

    const filteredResumes = useMemo(() => {
      if (!searchQuery.trim()) return resumes;
      const query = searchQuery.toLowerCase();
      return resumes.filter((doc) =>
        doc.name.toLowerCase().includes(query)
      );
    }, [resumes, searchQuery]);

    const filteredOtherDocuments = useMemo(() => {
      if (!searchQuery.trim()) return otherDocuments;
      const query = searchQuery.toLowerCase();
      return otherDocuments.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }, [otherDocuments, searchQuery]);

    const documentsByTag = useMemo(() => {
      const grouped: Record<string, Document[]> = {};
      const untagged: Document[] = [];

      filteredOtherDocuments.forEach((doc) => {
        if (doc.tags.length === 0) {
          untagged.push(doc);
        } else {
          doc.tags.forEach((tag) => {
            if (!grouped[tag]) {
              grouped[tag] = [];
            }
            if (!grouped[tag].find((d) => d.id === doc.id)) {
              grouped[tag].push(doc);
            }
          });
        }
      });

      return { grouped, untagged };
    }, [filteredOtherDocuments]);

    const sortedTags = useMemo(() => {
      return Object.keys(documentsByTag.grouped).sort();
    }, [documentsByTag.grouped]);

    const renderDocumentItem = (
      doc: Document,
      isSelected: boolean,
      onClick: () => void
    ) => (
      <div
        key={doc.id}
        onClick={onClick}
        className={`p-3 cursor-pointer transition-colors ${
          isSelected
            ? "bg-blue-900 border-l-4 border-blue-500"
            : "hover:bg-gray-800"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium mb-1 text-sm truncate">
              {doc.name}
            </h3>
            {doc.type === "other" && doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {doc.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">
              Uploaded {formatDate(doc.createdAt)}
            </p>
          </div>
        </div>
      </div>
    );

    return (
      <div className="h-full flex flex-col bg-gray-800">
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full px-3 py-1.5 pl-8 text-sm bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
            <svg
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            onClick={fetchDocuments}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
            title="Refresh documents"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
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
        ) : resumes.length === 0 && otherDocuments.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="text-gray-400 text-center text-sm">
              No documents found. Upload a document to get started.
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            {filteredResumes.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-2 text-sm px-2">
                  Resumes
                </h3>
                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                  <div className="divide-y divide-gray-700">
                    {filteredResumes.map((resume) =>
                      renderDocumentItem(
                        resume,
                        selectedResumeId === resume.id,
                        () => handleResumeClick(resume.id)
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
            {sortedTags.map((tag) => {
              const docs = documentsByTag.grouped[tag];
              if (docs.length === 0) return null;
              return (
                <div key={tag}>
                  <h3 className="text-white font-semibold mb-2 text-sm px-2">
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </h3>
                  <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                    <div className="divide-y divide-gray-700">
                      {docs.map((doc) =>
                        renderDocumentItem(
                          doc,
                          selectedDocumentId === doc.id,
                          () => handleDocumentClick(doc.id)
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {documentsByTag.untagged.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-2 text-sm px-2">
                  Untagged
                </h3>
                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                  <div className="divide-y divide-gray-700">
                    {documentsByTag.untagged.map((doc) =>
                      renderDocumentItem(
                        doc,
                        selectedDocumentId === doc.id,
                        () => handleDocumentClick(doc.id)
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
            {filteredResumes.length === 0 &&
              sortedTags.length === 0 &&
              documentsByTag.untagged.length === 0 &&
              searchQuery.trim() && (
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <div className="text-gray-400 text-center text-sm">
                    No documents match your search.
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    );
  }
);

DocumentsList.displayName = "DocumentsList";

export default DocumentsList;
