from django.shortcuts import render
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST, HTTP_401_UNAUTHORIZED, HTTP_404_NOT_FOUND, HTTP_405_METHOD_NOT_ALLOWED, HTTP_409_CONFLICT
from rest_framework.response import Response
from rest_framework.decorators import api_view
from parser.models import PromoCode as Promo
from .serializers import PromoSerializer



@api_view(['GET'])
def get_promos(request):
    promos = Promo.objects.filter()
    promo_serializer = PromoSerializer(promos, many = True)
    return Response({
        'ok': True, 
        'promos': promo_serializer.data
    })
