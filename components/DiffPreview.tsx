"use client";

import { useState, useEffect } from "react";
import type { DiffOperation } from "@/lib/utils/diff";
import { generateDiffPreview, applyDiffOperations } from "@/lib/utils/diff";

interface DiffPreviewProps {
  operations: DiffOperation[];
  documentId: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DiffPreview({
  operations,
  documentId,
  onConfirm,
  onCancel,
}: DiffPreviewProps) {
  const [oldContent, setOldContent] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/documents/${documentId}`);
        const data = await response.json();

        if (!data.success || !data.document) {
          throw new Error(data.error || "Failed to load document");
        }

        const currentContent = data.document.content;
        setOldContent(currentContent);

        const newContent = applyDiffOperations(currentContent, operations);
        setNewContent(newContent);
      } catch (err: any) {
        console.error("Failed to load document for diff preview: ", err);
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId, operations]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-200">Loading preview...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-md">
          <div className="text-red-200 mb-4">{error}</div>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const diffLines = generateDiffPreview(oldContent, newContent);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Preview Changes</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
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
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1 font-mono text-sm">
            {diffLines.map((line, index) => {
              let bgColor = "bg-gray-800";
              let textColor = "text-gray-300";
              let prefix = "  ";

              if (line.type === "added") {
                bgColor = "bg-green-900";
                textColor = "text-green-200";
                prefix = "+ ";
              } else if (line.type === "removed") {
                bgColor = "bg-red-900";
                textColor = "text-red-200";
                prefix = "- ";
              }

              return (
                <div
                  key={index}
                  className={`${bgColor} ${textColor} px-2 py-1 rounded`}
                >
                  <span className="text-gray-500 mr-2">{prefix}</span>
                  <span>{line.line || ""}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

