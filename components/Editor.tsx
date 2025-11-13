"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Crepe, type CrepeBuilder } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import type { DiffOperation } from "@/lib/utils/diff";
import { applyDiffOperations } from "@/lib/utils/diff";

const EDITOR_CONTAINER_ID = "editorjs-container";

export interface EditorRef {
  applyChanges: (operations: DiffOperation[]) => Promise<void>;
}

export interface EditorProps {
  documentId?: number | null;
  onDocumentDeleted?: () => void;
  editorRef?: React.MutableRefObject<EditorRef | null>;
}

const Editor: React.FC<EditorProps> = ({
  documentId,
  onDocumentDeleted,
  editorRef: externalEditorRef,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const editorRef = useRef<CrepeBuilder | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const getMarkdown = useCallback((): string => {
    if (!editorRef.current) {
      throw new Error("Editor not initialized");
    }
    return editorRef.current.getMarkdown();
  }, []);

  const setMarkdown = useCallback(async (markdown: string): Promise<void> => {
    if (!containerRef.current) {
      throw new Error("Container not initialized");
    }

    if (editorRef.current) {
      await editorRef.current.destroy();
    }

    editorRef.current = new Crepe({
      root: containerRef.current,
      defaultValue: markdown,
    });
    await editorRef.current.create();
    setIsEditorReady(true);
  }, []);

  const applyChanges = useCallback(
    async (operations: DiffOperation[]): Promise<void> => {
      if (!editorRef.current || !isEditorReady) {
        throw new Error("Editor not initialized");
      }

      try {
        const currentContent = getMarkdown();
        const newContent = applyDiffOperations(currentContent, operations);
        await setMarkdown(newContent);

        setSuccessMessage("Changes applied successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        console.error("Failed to apply changes: ", err);
        setError(err.message || "Failed to apply changes");
        throw err;
      }
    },
    [getMarkdown, setMarkdown, isEditorReady]
  );

  useEffect(() => {
    if (isEditorReady && externalEditorRef) {
      externalEditorRef.current = { applyChanges };
    }
  }, [isEditorReady, externalEditorRef, applyChanges]);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) {
      return;
    }

    const initializeEditor = async () => {
      try {
        editorRef.current = new Crepe({
          root: containerRef.current!,
          defaultValue: "",
        });
        await editorRef.current.create();
        setIsEditorReady(true);
      } catch (error) {
        console.error("Failed to initialize editor: ", error);
        setError("Failed to initialize editor");
      }
    };

    initializeEditor();
  }, []);

  const handleSave = async () => {
    if (!documentId || !editorRef.current || !isEditorReady) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const content = getMarkdown();

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
      if (!editorRef.current || !isEditorReady) {
        return;
      }

      if (!documentId) {
        try {
          await setMarkdown("");
          setError(null);
          setSuccessMessage(null);
        } catch (err: any) {
          console.error("Failed to clear editor: ", err);
        }
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

        await setMarkdown(data.document.content || "");
      } catch (err: any) {
        console.error("Failed to load document: ", err);
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId, isEditorReady, setMarkdown]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy().catch((error) => {
          console.error("Failed to destroy editor: ", error);
        });
        editorRef.current = null;
        setIsEditorReady(false);
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
      <div
        id={EDITOR_CONTAINER_ID}
        ref={containerRef}
        className="flex-1 p-4 min-h-0 [&_.milkdown]:text-gray-100 [&_svg]:text-gray-300 [&_svg]:fill-gray-300 [&_button]:text-gray-200 [&_.crepe-toolbar_button]:text-gray-200 [&_.crepe-toolbar_button_svg]:text-gray-200 [&_path]:stroke-gray-300 [&_circle]:stroke-gray-300 [&_rect]:stroke-gray-300 [&_line]:stroke-gray-300"
      />
    </div>
  );
};

Editor.displayName = "Editor";

export default Editor;
