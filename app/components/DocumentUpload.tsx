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

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

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
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Select a file (.txt, .md, or .pdf)
          </label>
          <input
            type="file"
            accept=".txt,.md,.pdf,application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            disabled={uploading}
          />
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
        {message && (
          <div
            className={`p-3 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-900 border border-green-300"
                : "bg-red-100 text-red-900 border border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
