import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileUpload from "../components/FileUpload";
import { apiGetDocuments } from "../lib/api";
import { isLoggedIn, getEmail } from "../lib/auth";
import {
  MessageSquare, FileText, FolderOpen, CheckCircle,
  RefreshCw, ArrowRight, Upload as UploadIcon, Sparkles
} from "lucide-react";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const email = getEmail();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-12">
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
                <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium bg-green-50 px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Indexed
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">How it works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StepItem step={1} text="Upload your CV above (PDF or DOCX)" done={documents.length > 0} />
          <StepItem step={2} text="Go to the Chat page" />
          <StepItem step={3} text="Paste a job description" />
          <StepItem step={4} text="Get your tailored application package!" />
        </div>
      </div>
    </div>
  );
}

function StepItem({ step, text, done }: { step: number; text: string; done?: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${done ? "bg-green-50 border border-green-200" : "bg-white border border-gray-100"}`}>
      <span className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
        done ? "bg-green-500 text-white" : "bg-blue-600 text-white"
      }`}>
        {done ? "✓" : step}
      </span>
      <p className={`text-sm ${done ? "text-green-700" : "text-gray-600"}`}>{text}</p>
    </div>
  );
}
