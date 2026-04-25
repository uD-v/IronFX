from selenium import webdriver
from user.apps import OpenAI
from django.conf import settings

def parse_and_extract_codes():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless') 
    driver = webdriver.Chrome(options=options)
    
    driver.get("URL_STORY_OR_SITE_WITH_PROMO")
    page_source = driver.page_source 
    driver.quit()

    ai_client = OpenAI.openai_client
    response = ai_client.chat.completions.create(
        model="gpt-4o", # або gpt-3.5-turbo
        messages=[{"role": "system", "content": f"Витягни всі робочі промокоди для PocketOption з цього тексту: {page_source}. Поверни тільки список кодів через кому."}]
    )
    
    codes_string = response.choices[0].message.content
    return codes_string.split(",")