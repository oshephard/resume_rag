"use client";

import { useState, useMemo, useEffect } from "react";

interface Document {
  id: number;
  name: string;
  type: "resume" | "other";
  tags: string[];
}

interface ContextSelectorProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onClose?: () => void;
}

export default function ContextSelector({
  selectedIds,
  onSelectionChange,
  onClose,
}: ContextSelectorProps) {
  const [resumes, setResumes] = useState<Document[]>([]);
  const [otherDocuments, setOtherDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [localSelectedIds, setLocalSelectedIds] =
    useState<number[]>(selectedIds);

  useEffect(() => {
    setLocalSelectedIds(selectedIds);
  }, [selectedIds]);

  useEffect(() => {
    fetchDocuments();
  }, []);

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

  const filteredResumes = useMemo(() => {
    if (!searchQuery.trim()) return resumes;
    const query = searchQuery.toLowerCase();
    return resumes.filter((doc) => doc.name.toLowerCase().includes(query));
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

  const handleToggleDocument = (docId: number) => {
    const newSelected = localSelectedIds.includes(docId)
      ? localSelectedIds.filter((id) => id !== docId)
      : [...localSelectedIds, docId];
    setLocalSelectedIds(newSelected);
  };

  const handleApply = () => {
    onSelectionChange(localSelectedIds);
    onClose?.();
  };

  const handleCancel = () => {
    setLocalSelectedIds(selectedIds);
    onClose?.();
  };

  const renderDocumentItem = (doc: Document) => {
    const isSelected = localSelectedIds.includes(doc.id);
    return (
      <div
        key={doc.id}
        onClick={() => handleToggleDocument(doc.id)}
        className={`p-3 cursor-pointer transition-colors ${
          isSelected ? "bg-blue-900 border-l-4 border-blue-500" : "hover:bg-gray-800"
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleToggleDocument(doc.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
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
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
        <h2 className="text-xl font-semibold text-white">Select Context Documents</h2>
        <button
          onClick={handleCancel}
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

      <div className="px-6 py-4 border-b border-gray-700">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full px-3 py-2 pl-8 text-sm bg-gray-900 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
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
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400 text-sm">Loading documents...</div>
          </div>
        ) : error ? (
          <div className="bg-red-900 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResumes.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-2 text-sm px-2">
                  Resumes
                </h3>
                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                  <div className="divide-y divide-gray-700">
                    {filteredResumes.map((resume) => renderDocumentItem(resume))}
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
                      {docs.map((doc) => renderDocumentItem(doc))}
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
                      renderDocumentItem(doc)
                    )}
                  </div>
                </div>
              </div>
            )}
            {filteredResumes.length === 0 &&
              sortedTags.length === 0 &&
              documentsByTag.untagged.length === 0 &&
              searchQuery.trim() && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-400 text-center text-sm">
                    No documents match your search.
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Apply ({localSelectedIds.length})
        </button>
      </div>
    </div>
  );
}

