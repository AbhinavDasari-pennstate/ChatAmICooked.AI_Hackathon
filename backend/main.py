import os
from datetime import date

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel

from agents import ingestion, knowledge_map, relevance_check, scorer, stress_test, study_plan

load_dotenv()

app = FastAPI(title="ChatAmICooked.AI", description="Find out before your professor does.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# --------------------------------------------------------------------------- #
# Models
# --------------------------------------------------------------------------- #

class ChatRequest(BaseModel):
    message: str
    context: str = ""


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    exam_topic: str = Form(...),
    exam_date: date = Form(...),
):
    # --- Parse file ---
    try:
        material = await ingestion.parse_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not material.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the uploaded file.")

    days_until_exam = max((exam_date - date.today()).days, 1)

    # --- Pre-flight: Relevance Check ---
    try:
        rel = await relevance_check.run(groq_client, material, exam_topic)
    except Exception:
        rel = {"relevant": True, "confidence": 0, "reason": ""}

    # Hard stop: high-confidence mismatch
    if not rel["relevant"] and rel["confidence"] >= 80:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "mismatch",
                "message": f"Your uploaded material doesn't appear to be related to '{exam_topic}'.",
                "reason": rel["reason"],
                "suggestion": "Please upload notes, slides, or a textbook chapter that actually covers this exam topic.",
            },
        )

    # Soft warning: uncertain relevance — proceed but flag it
    mismatch_warning = None
    if not rel["relevant"] and rel["confidence"] < 80:
        mismatch_warning = {
            "message": f"Your material may not fully cover '{exam_topic}'. Results could be unreliable.",
            "reason": rel["reason"],
        }

    # --- Agent 1: Knowledge Map ---
    try:
        km_result = await knowledge_map.run(groq_client, material, exam_topic)
        topics_list = km_result.get("topics", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knowledge Map Agent error: {e}")

    # --- Agent 2: Stress Test ---
    try:
        st_result = await stress_test.run(groq_client, topics_list)
        questions_list = st_result.get("questions", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stress Test Agent error: {e}")

    # --- Agent 3: Confidence Scorer ---
    try:
        sc_result = await scorer.run(groq_client, material, questions_list, days_until_exam)
        overall_score = max(10, min(100, int(sc_result.get("overall_score", 50))))
        scored_topics = [
            {**t, "score": max(10, min(100, int(t.get("score", 50))))}
            for t in sc_result.get("topics", [])
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Confidence Scorer Agent error: {e}")

    # --- Agent 4: Study Plan ---
    try:
        sp_result = await study_plan.run(groq_client, scored_topics, days_until_exam)
        plan_list = sp_result.get("plan", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Study Plan Agent error: {e}")

    # Strip ideal_answer from questions before returning (internal grading only)
    public_questions = [
        {k: v for k, v in q.items() if k != "ideal_answer"}
        for q in questions_list
    ]

    return {
        "overall_score": overall_score,
        "topics": scored_topics,
        "questions": public_questions,
        "plan": plan_list,
        "mismatch_warning": mismatch_warning,
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    system_prompt = (
        "You are a friendly and knowledgeable study assistant for ChatAmICooked.AI. "
        "Help the student understand their study material and prepare for their exam. "
        "Be concise, encouraging, and focus on what matters most for their exam."
    )

    messages = [{"role": "system", "content": system_prompt}]

    if request.context.strip():
        messages.append({
            "role": "user",
            "content": f"Here is my study material for context:\n\n{request.context[:4000]}",
        })
        messages.append({
            "role": "assistant",
            "content": "Got it — I've reviewed your study material. What would you like to know?",
        })

    messages.append({"role": "user", "content": request.message})

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.6,
        )
        reply = response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {e}")

    return {"reply": reply}
