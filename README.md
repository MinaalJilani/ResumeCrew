# 🤖 ResumeCrew

**ResumeCrew** is a full-stack AI-powered job application assistant. It uses a swarm of specialized AI agents to help you land your dream job by automatically generating highly tailored resumes, cover letters, company research, and interview preparation materials based on your real experience.

## ✨ Features

- **ATS Resume Builder**: Tailored, ATS-optimized resume using your real experience matched to the job description keywords.
- **Cover Letter Writer**: Personalized cover letters referencing company values, news, and your top achievements.
- **Company Researcher**: Culture, recent news, tech stack, and interview insights generated from live web research.
- **Interview Coach**: Likely interview questions with strong STAR-format answer frameworks tailored to you.

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 
- **Backend**: Python + FastAPI
- **Authentication**: Supabase (Email/Password Auth)
- **AI / LLMs**: Groq (Llama-3 models)
- **Agent Framework**: CrewAI
- **Vector Database**: Pinecone
- **Embeddings**: Local HuggingFace Models (`sentence-transformers/all-MiniLM-L6-v2`)

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python 3.10+
- Supabase Project (Database & Auth)
- Pinecone Account (Vector Database)
- Groq API Key

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your environment variables in `backend/.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX=job-agent
   PINECONE_CLOUD=aws
   PINECONE_REGION=us-east-1
   SERPER_API_KEY=your_serper_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```
   *(Note: Ensure your Pinecone index has dimensions set to **384** and metric strictly set to **cosine**)*

5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   *(The API runs on `http://localhost:8000`)*

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *(The UI runs on `http://localhost:5173`)*

## 🔒 Privacy First
Your data is securely isolated. Because ResumeCrew relies entirely on a localized Vector Search index for your CV, your historical work experience is passed directly (and only) into the generation pipeline when building a tailored resume. No hallucinated experiences, and complete privacy context.
