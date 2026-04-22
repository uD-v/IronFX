from django.shortcuts import render
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST, HTTP_401_UNAUTHORIZED, HTTP_404_NOT_FOUND, HTTP_405_METHOD_NOT_ALLOWED, HTTP_409_CONFLICT
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes
from .auth import TelegramWebAppAuthentication
from django.shortcuts import render, HttpResponse
import json
from decimal import Decimal as dou
from rest_framework.permissions import AllowAny
from .models import Users
from datetime import datetime
from stats.models import statsmodel as Stats
from .serializers import StatsSerializer



@api_view(['GET'])
@authentication_classes([TelegramWebAppAuthentication]) 
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

@api_view(['GET', 'POST'])
@authentication_classes([TelegramWebAppAuthentication]) 
def user_stats(request):
    user = request.user
    if request.method == "GET":
        stats = Stats.objects.filter(user_id=user)
        if not stats.exists():
            return Response(
                data={"ok": False, "message": "User stats not found."}, 
                status=HTTP_404_NOT_FOUND
            )

        serializer = StatsSerializer(stats, many=True)
        return Response(data={
            "ok": True,
            "message": "User stats found.", 
            "stats": serializer.data
        })
    elif request.method == "POST":
        data = request.data
        currency_pair, is_lost = data.get("currency_pair"), data.get("is_lost")
        if not currency_pair or not is_lost:
            return Response(data = {"ok": False, "message": "Currency pair or deal status is missing"}, status = HTTP_400_BAD_REQUEST)
        stats = Stats(
            user_id = user,
            currency_pair = currency_pair,
            lost = is_lost
        )

        stats.save()
        return Response(data = {"ok": True}, status = HTTP_201_CREATED)


@api_view(["POST"])
@authentication_classes([TelegramWebAppAuthentication])
def change_lang(request):
    data = request.data
    new_lang = data.get("language")
    if not new_lang or new_lang not in ["ru", "en"]:
        return Response(data = {"ok": False, "message": "Language is missing or consist of incorrect format"}, status = HTTP_400_BAD_REQUEST)
    user = Users.objects.get(tgid= request.user.tgid)
    user.language = new_lang
    user.save()
    return Response({
        'ok': True, 
        'user': {
            'id': request.user.id,
            'tgid': request.user.tgid,
            'language': new_lang,
            'limit': request.user.limit,
            'created_at': request.user.created_at
        }
    })
