import json
from groq import Groq


PROMPT_TEMPLATE = """You are a content alignment checker. Your job is to determine whether a student's study material is relevant to their exam topic.

Exam topic: {exam_topic}

Study material excerpt (first 2000 characters):
{material}

Assess the relevance honestly. Consider:
- Does the material mention or discuss the exam topic or closely related subjects?
- Could this material realistically help a student prepare for this exam topic?
- Or is this material from a completely different domain?

Return ONLY valid JSON with no extra text or markdown:
{{ "relevant": true, "confidence": 85, "reason": "one sentence explanation" }}

Where:
- "relevant": true if the material is reasonably aligned with the exam topic, false if clearly mismatched
- "confidence": integer 0-100 representing how confident you are in this assessment
- "reason": one clear sentence explaining your assessment"""


async def run(client: Groq, material: str, exam_topic: str) -> dict:
    prompt = PROMPT_TEMPLATE.format(
        exam_topic=exam_topic,
        material=material[:2000],
    )

    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            result = json.loads(raw)
            # Ensure expected keys are present with safe defaults
            return {
                "relevant": bool(result.get("relevant", True)),
                "confidence": max(0, min(100, int(result.get("confidence", 50)))),
                "reason": result.get("reason", ""),
            }
        except (json.JSONDecodeError, ValueError, TypeError):
            if attempt == 1:
                # Fail open — don't block the pipeline if the check itself errors
                return {"relevant": True, "confidence": 0, "reason": "Relevance check could not be completed."}
    return {"relevant": True, "confidence": 0, "reason": ""}
