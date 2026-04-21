from rest_framework import serializers
from stats.models import statsmodel as Stats

class StatsSerializer(serializers.ModelSerializer):
  class Meta:
    model = Stats

    fields = ['id', 'currency_pair', 'lost', 'created_at']