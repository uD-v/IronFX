from django.urls import path
from . import views


urlpatterns = [
    path('verify/', views.verify_user),
    path('stats/', views.user_stats, name='get_stats_info'),
    path('change-lang/', views.change_lang),
    path('signal/', views.receive_signal)
]
