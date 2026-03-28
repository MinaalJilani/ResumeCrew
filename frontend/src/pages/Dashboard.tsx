import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import LinksPanel from "@/components/LinksPanel";
import { apiGetDocuments, apiDeleteDocument } from "@/lib/api";
import { isLoggedIn, getEmail } from "@/lib/auth";
import {
  MessageSquare, FileText, FolderOpen, CheckCircle, User,
  RefreshCw, ArrowRight, Upload as UploadIcon, Trash2, AlertTriangle, X
} from "lucide-react";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDoc, setConfirmDoc] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadDocuments();
  }, [navigate]);

  async function loadDocuments() {
    try {
      const data = await apiGetDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    loadDocuments();
  }

  async function confirmDelete() {
    if (!confirmDoc) return;
    setDeleting(confirmDoc);
    setConfirmDoc(null);
    try {
      await apiDeleteDocument(confirmDoc);
      await loadDocuments();
      showToast("Document deleted successfully.", "success");
    } catch (err) {
      showToast("Failed to delete document. Please try again.", "error");
    } finally {
      setDeleting(null);
    }
  }

  function showToast(msg: string, type: "error" | "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!newFullName.trim()) return;
    localStorage.setItem("full_name", newFullName.trim());
    setShowNameModal(false);
    showToast("Name saved successfully!", "success");
  }

  const email = getEmail();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 mt-24 pb-12 animate-slide-up relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-24 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "error" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"
        }`}>
          {toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Document</h3>
                <p className="text-gray-500 text-xs">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5 bg-gray-50 rounded-lg px-3 py-2 font-mono break-all">
              {confirmDoc}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDoc(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">{email}</p>
        </div>
        <button
          onClick={() => navigate("/chat")}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <MessageSquare className="w-4 h-4" />
          Open Chat
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Section */}
      <div className="glass rounded-2xl border-primary/10 p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <UploadIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Upload Documents</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Upload your CV, project descriptions, or certificates. Supported: PDF, DOCX, TXT
            </p>
          </div>
        </div>
        <FileUpload onSuccess={loadDocuments} />
      </div>

      {/* Profile Links */}
      <LinksPanel />

      {/* Documents List */}
      <div className="glass rounded-2xl border-primary/10 p-8 mb-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Your Documents</h2>
              <p className="text-muted-foreground text-sm mt-1">{documents.length} document{documents.length !== 1 ? "s" : ""} indexed</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-muted-foreground hover:text-primary transition-all p-2.5 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/20"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 bg-secondary/10 rounded-2xl border border-dashed border-border/50">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="font-bold text-lg text-foreground">No documents uploaded yet</p>
            <p className="text-muted-foreground mt-2">Upload your CV above to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-5 rounded-2xl glass border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base">{doc.doc_id}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Type: {doc.doc_type} · {doc.chunk_count} chunks indexed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Indexed
                  </div>
                  <button
                    onClick={() => setConfirmDoc(doc.doc_id)}
                    disabled={deleting === doc.doc_id}
                    className="p-2.5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    title="Delete document"
                  >
                    {deleting === doc.doc_id
                      ? <RefreshCw className="w-5 h-5 animate-spin" />
                      : <Trash2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
