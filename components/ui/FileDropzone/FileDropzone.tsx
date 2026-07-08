"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

type FileDropzoneProps = {
  label: string;
  required?: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: Record<string, string[]>;
  disabled?: boolean;
  helperText?: string;
};

export function FileDropzone({
  label,
  required = false,
  file,
  onFileChange,
  accept,
  disabled = false,
  helperText,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled) return;

      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      onFileChange(selectedFile);
    },
    [disabled, onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled,
    accept,
  });

  const handleRemoveFile = () => {
    if (disabled) return;
    onFileChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
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

        <div className="text-sm text-gray-600">
          {isDragActive ? (
            <p>여기에 파일을 놓으세요.</p>
          ) : (
            <>
              <p className="font-medium text-gray-700">
                파일을 드래그하거나 클릭하여 선택
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, 이미지 파일을 첨부할 수 있습니다.
              </p>
            </>
          )}
        </div>
      </div>

      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}

      {file && (
        <div className="flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2 text-sm">
          <div>
            <p className="text-xs text-gray-500">선택됨</p>
            <p className="font-medium text-gray-800">{file.name}</p>
          </div>

          <button
            type="button"
            onClick={handleRemoveFile}
            className="text-xs font-medium text-red-500 hover:text-red-700"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}