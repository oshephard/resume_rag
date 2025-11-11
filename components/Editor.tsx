"use client";

import React, { useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";

const EDITOR_CONTAINER_ID = "editorjs-container";

interface EditorProps {
  documentId?: number | null;
  onDocumentDeleted?: () => void;
}

const Editor: React.FC<EditorProps> = ({ documentId, onDocumentDeleted }) => {
  const editorInstance = useRef<EditorJS | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const convertTextToEditorJSBlocks = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    return lines.map((line) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("# ")) {
        return {
          type: "header",
          data: {
            text: trimmedLine.substring(2),
            level: 1,
          },
        };
      } else if (trimmedLine.startsWith("## ")) {
        return {
          type: "header",
          data: {
            text: trimmedLine.substring(3),
            level: 2,
          },
        };
      } else if (trimmedLine.startsWith("### ")) {
        return {
          type: "header",
          data: {
            text: trimmedLine.substring(4),
            level: 3,
          },
        };
      } else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        return {
          type: "list",
          data: {
            style: "unordered",
            items: [trimmedLine.substring(2)],
          },
        };
      } else {
        return {
          type: "paragraph",
          data: {
            text: trimmedLine,
          },
        };
      }
    });
  };

  const convertEditorJSBlocksToText = async (): Promise<string> => {
    if (!editorInstance.current) {
      throw new Error("Editor not initialized");
    }

    const outputData = await editorInstance.current.save();
    const blocks = outputData.blocks || [];

    return blocks
      .map((block: any) => {
        switch (block.type) {
          case "header":
            const level = block.data.level || 1;
            const prefix = "#".repeat(level) + " ";
            return prefix + block.data.text;
          case "list":
            return block.data.items
              .map((item: string) => `- ${item}`)
              .join("\n");
          case "paragraph":
            return block.data.text;
          default:
            return "";
        }
      })
      .filter((line: string) => line.trim().length > 0)
      .join("\n\n");
  };

  const handleSave = async () => {
    if (!documentId || !editorInstance.current) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const content = await convertEditorJSBlocksToText();

      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save document");
      }

      setSuccessMessage("Document saved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Failed to save document: ", err);
      setError(err.message || "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!documentId) {
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this document? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete document");
      }

      onDocumentDeleted?.();
    } catch (err: any) {
      console.error("Failed to delete document: ", err);
      setError(err.message || "Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDocument = async () => {
      if (!documentId) {
        if (editorInstance.current) {
          editorInstance.current.clear();
        }
        setError(null);
        setSuccessMessage(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        const response = await fetch(`/api/documents/${documentId}`);
        const data = await response.json();

        if (!data.success || !data.document) {
          throw new Error(data.error || "Failed to load document");
        }

        const blocks = convertTextToEditorJSBlocks(data.document.content);

        if (editorInstance.current) {
          await editorInstance.current.render({ blocks });
        }
      } catch (err: any) {
        console.error("Failed to load document: ", err);
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  useEffect(() => {
    if (!editorInstance.current) {
      editorInstance.current = new EditorJS({
        holder: EDITOR_CONTAINER_ID,
        data: { blocks: [] },
        tools: {
          header: Header,
          list: List,
          paragraph: Paragraph,
        },
      });
    }

    return () => {
      if (editorInstance.current && editorInstance.current.destroy) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="flex-1 border border-gray-700 rounded-lg overflow-y-auto bg-gray-900 min-h-0 h-full flex flex-col">
      {documentId && (
        <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save
                </>
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || saving}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
      {loading && (
        <div className="p-4 text-gray-400 text-sm">Loading document...</div>
      )}
      {error && (
        <div className="p-4 bg-red-900 border border-red-700 rounded-lg m-4 text-red-200 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-900 border border-green-700 rounded-lg m-4 text-green-200 text-sm">
          {successMessage}
        </div>
      )}
      <div id={EDITOR_CONTAINER_ID} className="flex-1 p-4 min-h-0" />
    </div>
  );
};

export default Editor;
