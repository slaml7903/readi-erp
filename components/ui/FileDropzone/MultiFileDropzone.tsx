"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

type MultiFileDropzoneProps = {
  label: string;
  required?: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: Record<string, string[]>;
  disabled?: boolean;
  maxFiles?: number;
  maxSize?: number;
  helperText?: string;
};

export default function MultiFileDropzone({
  label,
  required = false,
  files,
  onFilesChange,
  accept,
  disabled = false,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024,
  helperText,
}: MultiFileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return;
      onFilesChange([...files, ...acceptedFiles].slice(0, maxFiles));
    },
    [disabled, files, maxFiles, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      multiple: true,
      disabled,
      accept,
      maxFiles,
      maxSize,
    });

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </div>

      <div
        {...getRootProps()}
        className={[
          "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white hover:bg-gray-50",
          disabled ? "cursor-not-allowed bg-gray-100 opacity-60" : "",
        ].join(" ")}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? "여기에 파일을 놓으세요." : "파일을 드래그하거나 클릭하여 선택"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, JPG, PNG, WEBP · 파일당 최대 5MB · 최대 {maxFiles}개
        </p>
      </div>

      {helperText ? <p className="text-xs text-gray-500">{helperText}</p> : null}
      {fileRejections.length > 0 ? (
        <p className="text-xs text-red-600">
          허용되지 않은 형식이거나 5MB를 초과한 파일은 추가되지 않았습니다.
        </p>
      ) : null}

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              className="flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))}
                className="ml-3 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

