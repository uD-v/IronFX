from django.shortcuts import render
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST, HTTP_401_UNAUTHORIZED, HTTP_404_NOT_FOUND, HTTP_405_METHOD_NOT_ALLOWED, HTTP_409_CONFLICT
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from .auth import TelegramWebAppAuthentication




@api_view(['GET'])
@authentication_classes([TelegramWebAppAuthentication]) # Використовуємо наш клас
def verify_user(request):
    return Response({
        'ok': True, 
        'user': {
            'id': request.user.id,
            'tgid': request.user.tgid,
            'language': request.user.language,
            'limit': request.user.limit,
            'created_at': request.user.created_at
        }
    })