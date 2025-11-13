"use client";

import { useState } from "react";

interface UploadResponse {
  success: boolean;
  documentId?: number;
  chunksProcessed?: number;
  error?: string;
}

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<"resume" | "other">("other");
  const [tags, setTags] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a file" });
      return;
    }

    if (documentType === "other" && !tags.trim()) {
      setMessage({
        type: "error",
        text: "Please add at least one tag for non-resume documents (e.g., experience, certification)",
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append("type", documentType);
      if (documentType === "other" && tags.trim()) {
        formData.append("tags", tags);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: `Document uploaded successfully! Processed ${data.chunksProcessed} chunks.`,
        });
        setFile(null);
        setTags("");
        setDocumentType("other");
        const input = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        if (input) input.value = "";
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload document" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Select a file (.txt, .md, or .pdf)
          </label>
          <input
            type="file"
            accept=".txt,.md,.pdf,application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            disabled={uploading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Document Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="resume"
                checked={documentType === "resume"}
                onChange={(e) => setDocumentType(e.target.value as "resume" | "other")}
                className="mr-2"
                disabled={uploading}
              />
              <span className="text-sm text-gray-200">Resume</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="other"
                checked={documentType === "other"}
                onChange={(e) => setDocumentType(e.target.value as "resume" | "other")}
                className="mr-2"
                disabled={uploading}
              />
              <span className="text-sm text-gray-200">Other</span>
            </label>
          </div>
        </div>
        {documentType === "other" && (
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Tags (comma-separated, e.g., experience, certification, endorsement)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="experience, certification"
              className="w-full border border-gray-600 rounded-md px-3 py-2 text-sm bg-gray-900 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={uploading}
            />
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
        {message && (
          <div
            className={`p-3 rounded-md ${
              message.type === "success"
                ? "bg-green-900 text-green-200 border border-green-700"
                : "bg-red-900 text-red-200 border border-red-700"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
