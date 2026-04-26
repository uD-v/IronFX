from user.models import Users
from parser.models import PromoCode
from parser.utils import parse_and_extract_codes  # Тут буде логіка Selenium + AI
import logging

logger = logging.getLogger(__name__)

def nightly_sync():
  all_users = Users.objects.filter(limit__lt=20)
  for user in all_users:
    user.limit = 20
    user.save()

def monthly_promo_parser():
      """Функція для щомісячного збору промокодів"""
      logger.info("Запуск щомісячного парсингу промокодів...")
      
      try:
          # Припустимо, він повертає список діктів: [{'code': 'BONUS50', 'desc': '50% deposit'}, ...]
          new_codes = parse_and_extract_codes()
          
          if not new_codes:
              logger.warning("Парсер не знайшов жодного коду.")
              return

          added_count = 0
          for item in new_codes:
              obj, created = PromoCode.objects.get_or_create(
                  code=item['code'].strip(),
                  defaults={'description': item.get('desc', 'Промокод з парсера')}
              )
              if created:
                  added_count += 1
          
          logger.info(f"Парсинг завершено. Додано нових кодів: {added_count}")

      except Exception as e:
          logger.error(f"Помилка під час парсингу: {e}")