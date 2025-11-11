"use client";

import React, { useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";

import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";

const EDITOR_CONTAINER_ID = "editorjs-container";

interface EditorProps {
  initialData?: any;
}

const Editor: React.FC<EditorProps> = ({ initialData }) => {
  const editorInstance = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!editorInstance.current) {
      editorInstance.current = new EditorJS({
        holder: EDITOR_CONTAINER_ID,
        data: initialData,
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
  }, [initialData]);

  return (
    <div
      id={EDITOR_CONTAINER_ID}
      className="flex-1 border border-gray-700 rounded-lg overflow-y-auto p-4 bg-gray-900 min-h-0 h-full"
    />
  );
};

export default Editor;
