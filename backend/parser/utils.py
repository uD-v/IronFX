from selenium import webdriver
#from user.apps import OpenAI
from django.conf import settings
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
#from core.settings import POCKET_EMAIL, POCKET_PASSWORD
from dotenv import load_dotenv
import os
import undetected_chromedriver as uc

load_dotenv()

POCKET_EMAIL = os.getenv("POCKET_EMAIL")
POCKET_PASSWORD = os.getenv("POCKET_PASSWORD")

def parse_and_extract_codes():
  
    options = uc.ChromeOptions()
    # options.add_argument('--headless') # UC підтримує headless, але краще спочатку без нього
    user_path = os.path.expanduser("~") + r"\AppData\Local\Google\Chrome\User Data"
    options.add_argument(f"--user-data-dir={user_path}")
    options.add_argument("--profile-directory=Default")
    # Ініціалізація драйвера (UC автоматично знайде/завантажить потрібний chromedriver)
    driver = uc.Chrome(options=options, version_main=147)
    wait = WebDriverWait(driver, 20)
    
    driver.get("https://pocketoption.com/uk/login/")
    email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
    email_input.send_keys(POCKET_EMAIL)

        # 3. Знаходимо поле пароля та вводимо дані
    password_input = driver.find_element(By.NAME, "password")
    password_input.send_keys(POCKET_PASSWORD)

        # 4. Тиснемо кнопку "Увійти"
        # Використовуємо селектор за типом кнопки всередині форми
    login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    login_button.click()

        # 5. КРИТИЧНО: Чекаємо, поки завантажиться внутрішня сторінка після логіну
        # Наприклад, чекаємо появу якогось елемента кабінету (наприклад, балансу або іконки профілю)
        # Тут я поставлю очікування на зміну URL або наявність специфічного елемента
    wait.until(lambda d: d.current_url != "https://pocketoption.com/uk/login/")
    page_source = driver.page_source 
    print(page_source)
    driver.quit()

    #ai_client = OpenAI.openai_client
    #response = ai_client.chat.completions.create(
    #    model="gpt-4o", # або gpt-3.5-turbo
    #    messages=[{"role": "system", "content": f"Витягни всі робочі промокоди для PocketOption з цього тексту: {page_source}. Поверни тільки список кодів через кому."}]
    #)
    
    #codes_string = response.choices[0].message.content
    #return codes_string.split(",")