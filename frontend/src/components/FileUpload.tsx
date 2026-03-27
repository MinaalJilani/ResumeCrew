import { useState, useRef } from "react";
import { getToken } from "../lib/auth";
import { API_BASE } from "../lib/api";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

type Props = {
  onSuccess?: () => void;
};

export default function FileUpload({ onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("cv");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", message: data.detail || "Upload successful!" });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onSuccess?.();
      } else {
        setStatus({ type: "error", message: data.detail || "Upload failed" });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Upload failed. Is the backend running?" });
    } finally {
      setUploading(false);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : file
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3 text-green-700">
            <FileText className="w-8 h-8" />
            <div className="text-left">
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-green-600">
                {(file.size / 1024).toFixed(1)} KB — Click to change
              </p>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">
            <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">Drop your file here or click to browse</p>
            <p className="text-xs mt-1 text-gray-400">PDF, DOCX, TXT, MD — Max 10MB</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="cv">📄 CV / Resume</option>
            <option value="project">🛠️ Project Description</option>
            <option value="certificate">🏆 Certificate</option>
            <option value="cover_letter">✉️ Cover Letter</option>
          </select>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap flex items-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload
            </>
          )}
        </button>
      </div>

      {/* Status */}
      {status && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm slide-up ${
            status.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {status.message}
        </div>
      )}
    </div>
  );
}
