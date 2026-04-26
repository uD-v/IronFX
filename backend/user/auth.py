import hmac
import hashlib
import json
from urllib.parse import parse_qsl
from django.conf import settings
from user.models import Users
from rest_framework import authentication, exceptions

class TelegramWebAppAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        tg_init_data = request.headers.get('tgInitData')
        
        if not tg_init_data:
            raise exceptions.AuthenticationFailed('Telegram data is missing')

        if not self._verify_telegram_data(tg_init_data):
            raise exceptions.AuthenticationFailed('Invalid Telegram data')

        try:
            init_data_dict = dict(parse_qsl(tg_init_data))
            user_data = json.loads(init_data_dict.get('user', '{}'))
            tg_id = user_data.get('id')
        except (ValueError, KeyError):
            raise exceptions.AuthenticationFailed('Invalid JSON in user data')

        if not tg_id:
            raise exceptions.AuthenticationFailed('Telegram ID missing')

        user, created = Users.objects.get_or_create(
            tgid=tg_id,
            defaults={
                'language': 'en',
            }
        )
        return (user, None)

    def _verify_telegram_data(self, init_data):
        vals = dict(parse_qsl(init_data))
        received_hash = vals.pop('hash', None)
        if not received_hash: return False
        
        data_check_string = '\n'.join(f"{k}={v}" for k, v in sorted(vals.items()))
        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_KEY.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        return hmac.compare_digest(calculated_hash, received_hash)