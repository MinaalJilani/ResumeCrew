import { useState, useRef } from "react";
import { getToken } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
          localStorage.removeItem("email");
          window.location.href = "/login";
        }
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
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group overflow-hidden ${
          dragActive
            ? "border-primary bg-primary/10"
            : file
            ? "border-green-500/50 bg-green-500/5"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center gap-3 text-green-500 relative z-10">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-2">
              <FileText className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">{file.name}</p>
              <p className="text-xs text-green-500 font-medium mt-1">
                {(file.size / 1024).toFixed(1)} KB — Click to change
              </p>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground relative z-10">
            <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform group-hover:text-primary">
              <Upload className="w-8 h-8" />
            </div>
            <p className="font-bold text-foreground text-lg">Drop your file here</p>
            <p className="text-sm mt-1">or click to browse from your device</p>
            <p className="text-[10px] uppercase tracking-widest mt-6 opacity-40 font-bold">PDF, DOCX, TXT, MD — Max 10MB</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">Document Type</label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="w-full bg-secondary/50 border-border h-[46px] rounded-xl focus:ring-primary/50 text-foreground btn-hover">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="glass border-border/50">
              <SelectItem value="cv">📄 CV / Resume</SelectItem>
              <SelectItem value="project">🛠️ Project Description</SelectItem>
              <SelectItem value="certificate">🏆 Certificate</SelectItem>
              <SelectItem value="cover_letter">✉️ Cover Letter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full sm:w-auto bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 h-[46px]"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </>
          )}
        </button>
      </div>

      {/* Status */}
      {status && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${
            status.type === "success"
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {status.message}
        </div>
      )}
    </div>
  );
}
