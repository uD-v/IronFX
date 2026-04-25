from django.apps import AppConfig
import os
from openai import OpenAI as ai

class OpenAI(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'user'
    openai_client = None

    def ready(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            OpenAI.openai_client = ai(api_key=api_key)
            print("✅ OpenAI client initialized successfully")
        else:
            print("⚠️ OpenAI API Key not found in environment variables")