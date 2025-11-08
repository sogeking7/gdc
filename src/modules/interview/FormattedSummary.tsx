// components/FormattedSummary.tsx
"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const FormattedSummary: React.FC<{ summary: string }> = ({
  summary,
}) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-300">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
    </div>
  );
};
