from django.urls import path
from . import views


urlpatterns = [
    path('verify/', views.verify_user),
    path('stats/', views.get_user_stats, name='get_stats_info')
]
