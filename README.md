# AI Incident Triage & Root-Cause Analysis Platform
## 🚀 Overview
A full-stack proof-of-concept (PoC) for incident triage and root-cause analysis (RCA) using AI, real-time updates via WebSocket, and synthetic data. Designed for IT/network engineers to streamline incident management.
## 🧱 Tech Stack
- **Frontend**: React + Tailwind CSS + Next.js  
- **Backend**: Spring Boot (Java) + FastAPI (Python)  
- **AI/ML**: Simulated LLM (Groq API mock) + Qdrant RAG  
- **Real-Time**: WebSocket for live incident updates  
- **Database**: TiDB (SQL) + Qdrant (Vector DB)  
## 🛠️ Requirements
- Docker (for local development)  
- Node.js 18+ (for React build)  
- Python 3.12 (for FastAPI backend)  
- Java 17+ (for Spring Boot backend)  
## 🧪 Setup Steps
### 1. Clone the Repository
```bash
git clone https://github.com/Swapnil26-art/AI-Incident-Triage-Root-Cause-Analysis-Platform.git
cd AI-Incident-Triage-Root-Cause-Analysis-Platform
2. Build Docker Images
docker-compose build
3. Start the App Locally
docker-compose up --detach  # Runs frontend, backend, AI, Qdrant, and Redis
4. Access the Platform
- 
Frontend: http://localhost:3000  
- 
Backend APIs: http://localhost:8080 (Spring Boot)  
- 
AI Service: http://localhost:8000
🌐 Deploy to Production
🟢 Vercel (Frontend)
1. 
Push frontend code to a Vercel repo  
2. 
Deploy with:
vercel
🟡 Render (Backend + AI)
1. 
Push backend/AI code to a Render app  
2. 
Set environment variables:  
- 
DB_URL (TiDB connection string)  
- 
QDRANT_URL (free Qdrant instance URL)  
- 
GROQ_API_KEY (use free tier key)
3. 
Scale dynos as needed
⚠️ Notes
- 
Synthetic data is preloaded for immediate demo.  
- 
No paid services used (all free tiers).  
- 
Replace .env.example placeholder keys with real ones in production.
