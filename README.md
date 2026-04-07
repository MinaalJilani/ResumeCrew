# 🚀 ResumeCrew: AI-Powered Career Assistant 🤖

[![React Version](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)
[![FastAPI Version](https://img.shields.io/badge/fastapi-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**ResumeCrew** is a state-of-the-art AI agent swarm designed to automate the most painful parts of the job search. By coordinating multiple specialized agents, it transforms your raw experience into a suite of professional, ATS-optimized application materials.

---

## 🌟 Key Features

| Feature | Description |
| :--- | :--- |
| **ATS Optimizer** | Matches your CV to job description keywords to ensure you pass through recruiter filters. |
| **Cover Letter Architect** | Generates uniquely tailored letters that speak directly to company values and goals. |
| **Company Deep Dive** | Automated research on company culture, recent funding, tech stack, and news. |
| **Interview Simulator** | Predicted Q&A sessions based on your profile and the specific role. |

---

## 🛠️ The Powerhouse Backend (AI & Agents)

The intelligence of ResumeCrew is powered by a **CrewAI** multi-agent system:
- **Researcher Agent**: Scours the web for the latest company details.
- **Analyst Agent**: Deconstructs job descriptions to find critical skill gaps.
- **Writer Agent**: Polishes and formats your resume into a professional masterpieces.

### Technical Foundation:
- **Groq & Llama 3**: Lightning-fast LLM inference.
- **Pinecone**: High-performance vector retrieval (RAG) for your personalized experience database.
- **FastAPI**: Asynchronous, high-performance API layer.

---

## 💻 Modern UI/UX

Built with **React 19** and **Vite**, the interface offers a sleek, dark-mode first experience with smooth transitions and real-time agent log streaming.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Accounts/Keys for: **Supabase**, **Pinecone**, **Groq**, and **Serper**.

### Installation 

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate | Unix: source venv/bin/activate)
pip install -r requirements.txt
```
> [!IMPORTANT]
> Create a `.env` in the `backend/` folder with your keys as shown in the `.env.example`.

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security & Data Isolation
ResumeCrew uses **Supabase Auth** to ensure your data stays yours. Document embeddings are stored with strict metadata filtering in **Pinecone**, ensuring that one user's resume never informs another user's generation.

---

## 🗺️ Roadmap
- [ ] Multiple Resume Template Support
- [ ] LinkedIn Profile Optimization Agent
- [ ] Career Path Recommendation Swarm

---
*Created for the Hackathon 2026 - Revolutionizing the Job Hunt with AI.*
