import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileUpload from "../components/FileUpload";
import LinksPanel from "../components/LinksPanel";
import { apiGetDocuments, apiDeleteDocument } from "../lib/api";
import { isLoggedIn, getEmail } from "../lib/auth";
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
    
    // Check if we need to ask for their full name
    const storedName = localStorage.getItem("full_name");
    if (!storedName) {
      setShowNameModal(true);
    }
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-12">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Welcome / Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full border text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to ResumeCrew!</h3>
            <p className="text-gray-500 text-sm mb-6">
              Please enter your full name. We'll use this automatically at the top of the resumes we generate for you.
            </p>
            <form onSubmit={handleSaveName}>
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="E.g. John Doe"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center font-medium"
              />
              <button
                type="submit"
                disabled={!newFullName.trim()}
                className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Save & Continue
              </button>
            </form>
          </div>
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{email}</p>
        </div>
        <button
          onClick={() => navigate("/chat")}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          Open Chat
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <UploadIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Upload Documents</h2>
            <p className="text-gray-500 text-xs">
              Upload your CV, project descriptions, or certificates. Supported: PDF, DOCX, TXT
            </p>
          </div>
        </div>
        <FileUpload onSuccess={loadDocuments} />
      </div>

      {/* Profile Links */}
      <LinksPanel />

      {/* Documents List */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Your Documents</h2>
              <p className="text-gray-500 text-xs">{documents.length} document{documents.length !== 1 ? "s" : ""} indexed</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-400 hover:text-blue-600 transition p-2 rounded-lg hover:bg-blue-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No documents uploaded yet</p>
            <p className="text-sm mt-1">Upload your CV above to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 p-4 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">{doc.doc_id}</p>
                    <p className="text-gray-400 text-xs">
                      Type: {doc.doc_type} · {doc.chunk_count} chunks indexed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium bg-green-50 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Indexed
                  </div>
                  <button
                    onClick={() => setConfirmDoc(doc.doc_id)}
                    disabled={deleting === doc.doc_id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                    title="Delete document"
                  >
                    {deleting === doc.doc_id
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
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
