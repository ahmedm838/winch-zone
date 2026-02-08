import { useRef, useState } from "react";

export function UploadBox({
  label,
  accept,
  maxFiles = 1,
  onFiles,
  hint,
}: {
  label: string;
  accept?: string;
  maxFiles?: number;
  onFiles: (files: File[]) => void;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [names, setNames] = useState<string[]>([]);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</div>
      {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-xl px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white dark:bg-slate-900"
          onClick={() => ref.current?.click()}
        >
          Choose file{maxFiles > 1 ? "s" : ""}
        </button>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          {names.length ? names.join(", ") : "No file selected"}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).slice(0, maxFiles);
          setNames(files.map((f) => f.name));
          onFiles(files);
        }}
      />
    </div>
  );
}
