from django.db import models
import uuid


class PromoCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    info = models.TextField(blank=True, null=True)
    code = models.CharField(max_length=50, unique=True)
    expiration = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code
