import os
from pytz import timezone
from .settings import TIME_ZONE
from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        if os.environ.get('RUN_MAIN') == 'true':
            self.start_scheduler()

    def start_scheduler(self):
        from apscheduler.schedulers.background import BackgroundScheduler
        from django_apscheduler.jobstores import DjangoJobStore, register_events
        from .tasks import nightly_sync
        tz = timezone(TIME_ZONE)
        
        scheduler = BackgroundScheduler(timezone=tz) 
        scheduler.add_jobstore(DjangoJobStore(), "default")
        scheduler.add_job(
            nightly_sync,
            trigger='cron',
            hour=0,
            minute=0,
            id="nightly_task",
            max_instances=1,
            replace_existing=True,
        )
        register_events(scheduler)
        
        scheduler.start()