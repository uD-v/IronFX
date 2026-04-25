import os
from django.apps import AppConfig
from django.conf import settings
from pytz import timezone

class ParserConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'parser' 

    def ready(self):
        if os.environ.get('RUN_MAIN') == 'true':
            self.start_scheduler()

    def start_scheduler(self):
        from apscheduler.schedulers.background import BackgroundScheduler
        from django_apscheduler.jobstores import DjangoJobStore, register_events
        from core.tasks import monthly_promo_parser
        
        tz = timezone(settings.TIME_ZONE)
        
        scheduler = BackgroundScheduler(timezone=tz)
        scheduler.add_jobstore(DjangoJobStore(), "default")
        
        scheduler.add_job(
            monthly_promo_parser,
            trigger='cron',
            day=1,         
            hour=0,        
            minute=5,      
            id="monthly_promo_parsing",
            max_instances=1,
            replace_existing=True,
        )
        
        register_events(scheduler)
        scheduler.start()
        print("--- Шедулер парсера промокодів запущено (щомісячно) ---")