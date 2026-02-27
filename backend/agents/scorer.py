import json
from groq import Groq


PROMPT_TEMPLATE = """You are an academic advisor. Given this study material and questions generated from it, assess how well the material prepares the student for each topic. Exam is in {days_until_exam} days.

Scoring rubric (use this scale — never give single-digit scores):
- 95-100: Excellent coverage, student is very well prepared
- 85-94: Good coverage, minor gaps only
- 70-84: Decent coverage, some gaps worth reviewing
- 50-69: Partial coverage, significant gaps
- 30-49: Poor coverage, major topics missing
- 10-29: Very poor coverage, material barely addresses the topic

All scores MUST be integers between 10 and 100. Do NOT return scores below 10.

Return ONLY valid JSON with no extra text or markdown:
{{ "overall_score": 75, "topics": [{{ "name": "", "score": 75, "gap": "", "priority": "urgent|soon|ok" }}] }}

Study material (excerpt):
{material}

Questions generated:
{questions}"""


async def run(client: Groq, material: str, questions: list, days_until_exam: int) -> dict:
    prompt = PROMPT_TEMPLATE.format(
        days_until_exam=days_until_exam,
        material=material[:4000],
        questions=json.dumps(questions),
    )

    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except json.JSONDecodeError:
            if attempt == 1:
                raise ValueError("Confidence Scorer Agent failed to return valid JSON after retry.")
    return {}
