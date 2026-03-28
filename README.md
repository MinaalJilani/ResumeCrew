# ResumeCrew: AI-Powered Career Suite 🚀

**ResumeCrew** is a state-of-the-art multi-agent system designed to give job seekers an unfair advantage. By orchestrating a specialized "Crew" of AI agents, it transforms a generic CV and a job description into a perfectly tailored application package in under 2 minutes.

## 🤖 The Agent Crew

The system is powered by **CrewAI**, coordinated across several specialized agents:

1. **The Chat Router (Intent Guru)**
   - **File**: `chat_router.py`
   - **Mission**: The entry point for all interactions. It parses natural language to decide if you need a quick answer or a full agent execution.
   - **Capability**: Detects Job Descriptions with high precision and manages long-term memory via conversation history.

2. **The Research Analyst (Sherlock)**
   - **File**: `researcher.py`
   - **Mission**: Performs deep-dive research into the hiring company and the specific requirements of the role.
   - **Capability**: Identifies "hidden" requirements and company culture markers that are crucial for successful tailoring.

3. **The Materials Architect (The Tailor)**
   - **File**: `application_materials.py`
   - **Mission**: The core engine that generates your **Tailored Resume** and **Cover Letter**.
   - **Capability**: Merges your real-world experience (retrieved semantically from Pinecone) with the job's needs to ensure maximum ATS compatibility and human appeal.

4. **The Interview Coach (The Preparer)**
   - **File**: `interview.py`
   - **Mission**: Predicts the exact questions you'll face based on the JD and your background.
   - **Capability**: Provides sample answers and technical talking points specific to the role.

---

## 🛠️ Core Technology Stack

- **Large Language Models**: Powered by **Groq** (Llama-3.1-70B/8B) for lightning-fast, intelligent reasoning.
- **Agent Orchestration**: **CrewAI** for sequential and hierarchical task management.
- **Vector Database**: **Pinecone** for semantic retrieval and long-term storage of your career profile.
- **Auth & Database**: **Supabase** for secure user management, OAuth (Google/GitHub), and metadata storage.
- **Frontend**: **Vite + React** with a premium "Dark-Neon" glassmorphic UI.
- **Backend**: **FastAPI** with asynchronous streaming for a real-time "thinking" feel.

## ✨ Key Functionalities

- **Semantic Profiling**: Don't just upload a file; our Agents "understand" your career. We split your CV into meaningful chunks and store them as mathematical vectors.
- **One-Click Tailoring**: Simply paste a URL or text from LinkedIn/Indeed, and the Crew builds your entire application suite.
- **Interactive Chat**: Ask questions like "What skills should I learn for this role?" or "Rewrite my summary for senior positions."
- **Professional Exports**: Download your tailored resume as a polished **DOCX** file, ready for submission.
- **Data Privacy**: Every user's data is isolated in a private namespace, ensuring your career history stays YOURS.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python 3.10+
- Supabase Project (Database & Auth)
- Pinecone Account (Vector Database)
- Groq API Key

### 2. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create and activate a Python virtual environment.
3. Install dependencies: `pip install -r requirements.txt`
4. Configure your environment variables in `backend/.env`.
5. Start the FastAPI server: `uvicorn main:app --reload` (Runs on `http://localhost:8000`)

### 3. Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install Node dependencies: `npm install`
3. Start the development server: `npm run dev` (Runs on `http://localhost:5173`)

---

*Built with ❤️ for the next generation of job seekers.*
