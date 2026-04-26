from django.urls import path
from . import views


urlpatterns = [
    path('promocodes/', views.get_promos)
]
