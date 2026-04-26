from rest_framework import serializers
from parser.models import PromoCode as Promos

class PromoSerializer(serializers.ModelSerializer):
  class Meta:
    model = Promos

    fields = ['id', 'code', 'info', 'expiration', 'created_at']