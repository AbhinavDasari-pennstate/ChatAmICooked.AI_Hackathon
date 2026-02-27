import json
from groq import Groq


PROMPT_TEMPLATE = """You are a tough but fair examiner. Given these topics: {topics}, generate 2-3 exam-style questions per topic ranging from recall to application level.

Return ONLY valid JSON with no extra text or markdown:
{{ "questions": [{{ "topic": "", "question": "", "ideal_answer": "", "difficulty": "easy|medium|hard" }}] }}"""


async def run(client: Groq, topics: list) -> dict:
    topics_str = json.dumps(topics)
    prompt = PROMPT_TEMPLATE.format(topics=topics_str)

    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except json.JSONDecodeError:
            if attempt == 1:
                raise ValueError("Stress Test Agent failed to return valid JSON after retry.")
    return {}
