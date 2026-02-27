import json
from groq import Groq


PROMPT_TEMPLATE = """You are an expert educator. Given the following study material, extract a structured list of key topics and subtopics a student must understand for their exam on: {exam_topic}.

Return ONLY valid JSON with no extra text or markdown:
{{ "topics": [{{ "name": "", "subtopics": [], "importance": "high|medium|low" }}] }}

Study material:
{material}"""


async def run(client: Groq, material: str, exam_topic: str) -> dict:
    prompt = PROMPT_TEMPLATE.format(exam_topic=exam_topic, material=material[:8000])

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
                raise ValueError("Knowledge Map Agent failed to return valid JSON after retry.")
    return {}
