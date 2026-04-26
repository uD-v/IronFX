from django.shortcuts import render
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST, HTTP_401_UNAUTHORIZED, HTTP_404_NOT_FOUND, HTTP_405_METHOD_NOT_ALLOWED, HTTP_409_CONFLICT
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from .auth import TelegramWebAppAuthentication
from django.shortcuts import render, HttpResponse
from decimal import Decimal as dou
from rest_framework.permissions import AllowAny
from .models import Users
from datetime import datetime
from stats.models import statsmodel as Stats
from .serializers import StatsSerializer
import base64, json
from .apps import OpenAI


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


@api_view(["POST"])
@authentication_classes([TelegramWebAppAuthentication])
def receive_signal(request):
    data = request.data
    timeframe = data.get("timeframe")
    if not timeframe or timeframe not in ["1min", "5min", "15min", "30min", "1H", "4H", "1D"]:
        return Response(data = {"ok": False, "message": "Timeframe is missing or consist of incorrect format"}, status = HTTP_400_BAD_REQUEST)  
    photo = request.FILES.get('photo')
    if not photo:
        return Response(data = {"ok": False, "message": "Photo of chart is missing"}, status = HTTP_400_BAD_REQUEST)  

    user = Users.objects.get(tgid= request.user.tgid)
    if user.limit == 0:
        return Response({"ok": False, 'message' : "You have used your signal limit for today"}, HTTP_401_UNAUTHORIZED)

    photo_base64 = base64.b64encode(photo.read()).decode('utf-8')

    ai_client = OpenAI.openai_client
    if not ai_client:
        return Response({"ok": False, "message": "OpenAI client not initialized"}, status=500)
    print(user.language)

    ERROR_MESSAGES = {
        'ua': {
            'no_photo': "Ти не надіслав фото графіка",
            'no_pair': "Валютна пара не розпізнана",
            'no_quote': "Котирування не розпізнано"
        },
        'en': {
            'no_photo': "You didn't send a chart photo",
            'no_pair': "Currency pair not recognized",
            'no_quote': "Quote not recognized"
        },
        'ru': {
            'no_photo': "Ты не отправил фото графика",
            'no_pair': "Валютная пара не распознана",
            'no_quote': "Котировка не распознана"
        }
    }
    msg = ERROR_MESSAGES[user.language]
    response = ai_client.chat.completions.create(
        model = "gpt-4o-mini",
        response_format = { "type": "json_object" },
        messages = [
            {
                "role": "system",
                "content": (f"""You are a professional binary options analyst with 10 years of experience, specializing in the Smart Money Concept (SMC) and Price Action. Your task is to conduct a deep technical analysis of a screenshot and provide an accurate signal for the Pocket Option platform.

INPUT DATA:
User language: {user.language}
Timeframe: {timeframe}
ANALYSIS ALGORITHM:

Market Structure (MS): Determine the current nature of movement — BOS (Break of Structure) or CHOCH (Change of Character).

Liquidity & POI: Find liquidity clusters (EQL/EQH), FVG (Imbalance), and valid Order Blocks (OB).

Premium/Discount: Evaluate entries only in favorable zones according to the Fibonacci grid (OTE 0.62-0.79).

Timing & Expiration: - If the timeframe (TF) on the chart is M1 — expiration is 2-3 minutes.

If the TF on the chart is M5 — expiration is 10-15 minutes.

SIGNAL ISSUANCE RULES:

Priority — trades for 1-5 candles of the current timeframe.

Issue "WAIT" if the chart shows a flat market without a clear structure.

Write the justification (comment) strictly in the following language: {user.language}.

RESPONSE FORMAT (STRICT JSON):

JSON
{{
  "pair": "Pair name (specify OTC if applicable)",
  "timeframe": "M1/M5/M15/M30/H1/H4/D1",
  "direction": "UP / DOWN",
  "entry_section": "Be sure to write the quote for entry.",
  "expiration": "Expiration time in seconds as a number",
  "confidence": "Signal confidence from 1 to 100 (as a percentage)",
  "comment": "Brief recommendation."
}}

IMPORTANT: The "comment" field MUST be written strictly in the following language: {user.language}. Do not use any other language.


HIERARCHY:

SMC Setup (BOS + OB + FVG) = Confidence 9/10.

Price Action (Level + Engulfing) = Confidence 7/10.

Do not be too conservative; look for local confirmations for entry on the image.
If the user did not send a photo of the chart, write about it in the comment strictly in the format: "{msg['no_photo']}", everything else - None.
If the currency pair is not visible on the chart photo, write about it in the comment strictly in the format: "{msg['no_pair']}", everything else - None.
If the quote is not visible on the chart photo, write about it in the comment strictly in the format: "{msg['no_quote']}", everything else - None."""
                )
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{photo_base64}", "detail": "high"}
                    }
                ]
            }
        ],
        temperature=0
    )
    
    content_str = response.choices[0].message.content
    try:
        parsed_data = json.loads(content_str)
        result = {"ok": True, **parsed_data}
        result["limit"] = user.limit - 1
        user.limit = user.limit - 1
        user.save()

        return Response(result, HTTP_200_OK)
    except Exception:
        return {"ok": False, "message": "Failed to parse json"}
        
    