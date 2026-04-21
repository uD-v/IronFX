from django.shortcuts import render, HttpResponse
import json
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST, HTTP_401_UNAUTHORIZED, HTTP_404_NOT_FOUND, HTTP_405_METHOD_NOT_ALLOWED, HTTP_409_CONFLICT
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from decimal import Decimal as dou
from rest_framework.permissions import AllowAny
from datetime import datetime
from stats.models import statsmodel as Stats
from serializers import StatsSerializer

@api_view(['GET'])
def get_user_stats(request):
  tgInitData = request.headers.get("tgInitData")
  if not tgInitData:
    return Response(data = {'ok': False, "message":"tgInitData is missing."}, status=HTTP_401_UNAUTHORIZED)
  
  try:
    user = request.user
    stats = Stats.objects.get(user_id=user.id)
    Serializer = StatsSerializer(stats, many=True)
    return Response(data={"message": "User stats found.", "stats": Serializer.data})
  except stats.DoesNotExist:
    return Response(data = {"message": "User not found."}, status=HTTP_404_NOT_FOUND)