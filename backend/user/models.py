from django.db import models
import uuid


class Users(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tgid = models.BigIntegerField(unique=True)
    language = models.CharField(max_length=4, default="en")
    limit = models.IntegerField(default=20)
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"User {self.tgid} - Created: {self.created_at}"
    
    class Meta:
        verbose_name = 'Користувач'
        verbose_name_plural = 'Користувачі'


# Create your models here.
