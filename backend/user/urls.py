from django.urls import path
from . import views


urlpatterns = [
    path('stats/', views.get_stats_info, name='get_stats_info')
]