from openai import AsyncOpenAI
from config import get_settings

settings = get_settings()

class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.api_key,
            base_url=settings.api_base_url
        )

    async def generate_response(self, messages):
        try:
            response = await self.client.chat.completions.create(
                model=settings.api_model,
                messages=messages,
                max_tokens=settings.max_tokens,
                temperature=settings.temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating AI response: {e}")
            raise