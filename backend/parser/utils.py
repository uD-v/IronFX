from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from dotenv import load_dotenv
import os
import undetected_chromedriver as uc
import random
import string
import time
import logging
import re
import json
from datetime import datetime

# Налаштування логування для виводу в консоль
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ПРИМІТКА ДЛЯ UBUNTU (СЕРВЕР):
# Для роботи на сервері без графіки використовуйте Xvfb:
# xvfb-run --server-args="-screen 0 1920x1080x24" python3 main.py

load_dotenv()

POCKET_PASSWORD = os.getenv("POCKET_PASSWORD")


def generate_random_string(length=10):
    letters = string.ascii_letters
    return ''.join(random.choice(letters) for _ in range(length))


def parse_and_extract_codes():
    """
    Реєструє новий акаунт на PocketOption, відкриває меню промокодів
    і парсить всі доступні промокоди з карток `.card--available`.
    
    Повертає список діктів: [{'code': 'MPLAZA', 'info': 'Бонус 100% к депозиту', 'expiration': '26.04.2026'}, ...]
    """
    driver = None
    try:
        # Шлях до папки профілю всередині проекту
        profile_path = os.path.join(os.getcwd(), "parser_chrome_profile")
        
        options = uc.ChromeOptions()
        options.add_argument(f'--user-data-dir={profile_path}')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')

        driver = uc.Chrome(options=options, version_main=147)
        wait = WebDriverWait(driver, 30)

        # ──────────────────────────────────────────────
        # 1. Перехід на сайт
        # ──────────────────────────────────────────────
        logger.info("Крок 1: Відкриваю PocketOption...")
        driver.get("https://pocketoption.com/uk/cabinet/quick-high-low/")

        # Перевіряємо, чи ми вже залогінені (чи є аватар)
        try:
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, "user-avatar__img")))
            logger.info("Вже авторизовані, пропускаємо логін.")
        except:
            logger.info("Потрібна авторизація...")
            driver.get("https://pocketoption.com/uk/login/")
            
            email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
            email_input.send_keys(os.getenv("POCKET_EMAIL"))
            
            password_input = driver.find_element(By.NAME, "password")
            password_input.send_keys(POCKET_PASSWORD)
            
            # Тут ти можеш зупинити скрипт, якщо з'явиться каптча, розв'язати її вручну, 
            # і куки збережуться в профіль назавжди.
            login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_button.click()
            
            # Чекаємо успішного входу
            wait.until(EC.presence_of_element_located((By.CLASS_NAME, "user-avatar__img")))
            logger.info("Логін успішний.")

        # Решта логіку з ESC та мегафоном залишаємо...

        # Закриваємо можливі модалки/попапи
        time.sleep(3)
        body = driver.find_element(By.TAG_NAME, "body")
        for _ in range(5):
            body.send_keys(Keys.ESCAPE)
            time.sleep(0.3)

        # ──────────────────────────────────────────────
        # 3. Навігація до промокодів: Шукаємо мегафон напряму
        # ──────────────────────────────────────────────
        logger.info("Крок 3: Шукаю мегафон (промокоди)...")
        # Шукаємо мегафон за класом banner__image або за alt="megaphone"
        try:
            megaphone = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "img.banner__image, img[alt='megaphone']")))
            
            # Використовуємо JavaScript для кліку, щоб уникнути "ElementClickInterceptedException"
            driver.execute_script("arguments[0].click();", megaphone)
            logger.info("Клікнув по мегафону через JS.")
        except Exception as e:
            logger.error(f"Не вдалося знайти або клікнути мегафон: {e}")
            # Спробуємо ще раз після ESC (можливо, щось заважає)
            body.send_keys(Keys.ESCAPE)
            time.sleep(1)
            megaphone = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "img.banner__image")))
            driver.execute_script("arguments[0].click();", megaphone)

        # ──────────────────────────────────────────────
        # 4. Чекаємо на завантаження промо-секції (AJAX)
        # ──────────────────────────────────────────────
        logger.info("Крок 4: Чекаю на завантаження промо-секції...")
        time.sleep(5) # Даємо сайту трохи більше часу "подумати"

        cards_wait = WebDriverWait(driver, 30)
        try:
            # Шукаємо картки і за CSS, і за XPath (що швидше спрацює)
            cards_wait.until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(@class, 'card--available')] | //div[contains(@data-promo-id, '')]"))
            )
        except Exception:
            logger.warning("Картки не знайдені в DOM. Можливо, вони в iframe?")
            # Тут можна додати перемикання на iframe, якщо він є

        # Даємо час на рендер тексту
        time.sleep(2)

        # ──────────────────────────────────────────────
        # 5. Парсинг промокодів з DOM
        # ──────────────────────────────────────────────
        cards = driver.find_elements(By.CSS_SELECTOR, ".card.card--available")
        logger.info(f"Знайдено {len(cards)} потенційних карток")

        promo_codes = []
        for index, card in enumerate(cards):
            try:
                try:
                    code_el = card.find_element(By.CSS_SELECTOR, ".card__title")
                    code = code_el.text.strip()
                except: 
                    continue

                # ФІЛЬТР: Справжній промокод зазвичай:
                # 1. Не має пробілів
                # 2. Тільки великі літери / цифри (без "Відкрийте...", "Новини" тощо)
                # 3. Не порожній
                if not code or " " in code or not code.isupper():
                    continue

                info = ""
                try:
                    tagline_el = card.find_element(By.CSS_SELECTOR, ".card__tagline")
                    info = tagline_el.text.strip()
                except: pass

                expiration = ""
                try:
                    date_el = card.find_element(By.CSS_SELECTOR, ".date--available")
                    date_text = date_el.text.strip()
                    expiration = date_text.split("—")[-1].strip() if "—" in date_text else date_text
                except: pass

                promo_codes.append({
                    'code': code,
                    'info': info,
                    'expiration': expiration,
                })

            except Exception:
                continue

        # Вивід у консоль та запис у JSON
        print("\n" + "═"*40)
        print(f" 🚀 ПАРСИНГ ЗАВЕРШЕНО. ЗНАЙДЕНО {len(promo_codes)} РЕАЛЬНИХ КОДІВ:")
        
        for p in promo_codes:
            print(f" 💎 {p['code']} | {p['info']} | до {p['expiration']}")
        
        # Зберігаємо в JSON
        with open("promo_codes.json", "w", encoding="utf-8") as f:
            json.dump(promo_codes, f, ensure_ascii=False, indent=4)
        
        print("═"*40)
        logger.info("Результати збережено у файл promo_codes.json")

        return promo_codes

    except Exception as e:
        logger.error(f"Критична помилка парсера: {e}", exc_info=True)
        return []

    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass