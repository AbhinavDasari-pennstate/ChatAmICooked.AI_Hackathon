import json
from groq import Groq


PROMPT_TEMPLATE = """You are a study coach. Given topic scores and {days_until_exam} days until exam, create a daily study plan focusing on weak areas first.

Return ONLY valid JSON with no extra text or markdown:
{{ "plan": [{{ "day": 1, "date": "", "focus": "", "tasks": [], "hours": 0 }}] }}

Topic scores:
{topic_scores}"""


async def run(client: Groq, topic_scores: list, days_until_exam: int) -> dict:
    prompt = PROMPT_TEMPLATE.format(
        days_until_exam=days_until_exam,
        topic_scores=json.dumps(topic_scores),
    )

    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except json.JSONDecodeError:
            if attempt == 1:
                raise ValueError("Study Plan Agent failed to return valid JSON after retry.")
    return {}
