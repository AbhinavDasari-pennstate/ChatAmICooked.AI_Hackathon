# ChatAmICooked.AI 🔥
> "Find out before your professor does."

Upload your lecture notes, enter your exam topic and date — and find out exactly how cooked you are.

## What it does
- Parses your study material (PDF, docx, txt)
- Runs 4 AI agents to map your knowledge, generate exam questions, score your readiness, and build a study plan
- Chat with your material to drill into weak areas

## Tech Stack
- **Frontend:** React + Tailwind
- **Backend:** FastAPI + Python
- **AI:** Groq API (llama-3.3-70b-versatile)

## Running locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # add your GROQ_API_KEY
uvicorn main:app --reload --port 8000
```
API docs at `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App at `http://localhost:5173`

## Agent Pipeline
1. **Ingestion Agent** — parses uploaded files
2. **Knowledge Map Agent** — extracts key topics and subtopics
3. **Stress Test Agent** — generates exam questions per topic
4. **Confidence Scorer** — scores readiness per topic (0–100)
5. **Study Plan Agent** — builds a prioritised daily study plan

## Readiness Scale
| Score | Status |
|---|---|
| 80–100 | 🟢 Cooked to perfection |
| 60–79 | 🟡 Medium rare |
| 40–59 | 🟠 Getting cooked |
| 0–39 | 🔴 Fully cooked. RIP. |

## Environment Variables
| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Your Groq API key (free at groq.com) |