from django.db import models
import uuid
class statsmodel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.ForeignKey(to="pp", on_delete=models.CASCADE)
    currency_pair = models.CharField(max_length=30)
    lost = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Статистика'
        verbose_name_plural = 'Статистики'
