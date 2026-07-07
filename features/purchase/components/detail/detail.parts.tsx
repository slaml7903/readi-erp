import type { ReactNode } from "react";

import type { AirtableAttachment } from "../../types/purchase.type";

export function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-3 py-2 text-sm font-medium ${
        active
          ? "border-gray-900 text-gray-900"
          : "border-transparent text-gray-500 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}

export function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-medium text-gray-900">{value || "-"}</p>
    </div>
  );
}

export function DetailList({
  label,
  values,
}: {
  label: string;
  values?: string[];
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-medium text-gray-900">
        {values && values.length > 0 ? values.join(", ") : "-"}
      </p>
    </div>
  );
}

export function AttachmentList({
  label,
  files,
}: {
  label: string;
  files?: AirtableAttachment[];
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>

      {files && files.length > 0 ? (
        <div className="mt-1 space-y-1">
          {files.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="block truncate rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
              title={file.filename}
            >
              {file.filename}
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm font-medium text-gray-900">-</p>
      )}
    </div>
  );
}