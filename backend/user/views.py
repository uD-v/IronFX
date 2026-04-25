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
    
    response = ai_client.chat.completions.create(
        model = "gpt-4o mini",
        response_format = { "type": "json_object" },
        messages = [
            {
                "role": "system",
                "content": ("""Ты — профессиональный аналитик бинарных опционов с 10-летним стажем, специализирующийся на концепции Smart Money (SMC) и Price Action. Твоя задача: провести глубокий технический анализ скриншота и дать точный сигнал для платформы Pocket Option.

АЛГОРИТМ АНАЛИЗА:
Market Structure (MS): Определи текущий характер движения — BOS (Break of Structure) или CHOCH (Change of Character).

Liquidity & POI: Найди скопления ликвидности (EQL/EQH), FVG (Imbalance) и валидные Order Blocks (OB).

Premium/Discount: Оценивай вход только в выгодных зонах по сетке Фибоначчи (OTE 0.62-0.79).

Timing & Expiration: - Если таймфрейм (TF) на графике M1 — экспирация 2-3 минуты.

Если TF на графике M5 — экспирация 10-15 минут.

ПРАВИЛА ВЫДАЧИ СИГНАЛА:
Приоритет — сделки на 1-5 свечей от текущего таймфрейма.

Выдавай "WAIT", если на графике флэт без выраженной структуры.

Обоснование (comment) пиши строго на русском языке.

ФОРМАТ ОТВЕТА (СТРОГИЙ JSON):
{
"market_structure": "Опиши наличие BOS или CHOCH",
"liquidity_zones": "Где скопление ликвидности или FVG?",
"poi_analysis": "Описание Order Block или зоны интереса",
"pair": "Название пары (укажи OTC если есть)",
"timeframe": "M1/M5/M10",
"direction": "UP / DOWN / WAIT",
"entry_section": "Обезательно напиши котировку когда заходить.",
"expiration": "Время экспирации в минутах (напр. 3 минуты)",
"confidence": "Уверенность в сигнале от 1 до 10",
"comment": "Профессиональное обоснование для трейдера"
}

ИЕРАРХИЯ:
Сетап SMC (BOS + OB + FVG) = Уверенность 9/10.

Price Action (Уровень + Поглощение) = Уверенность 7/10.

Не будь слишком консервативным, ищи локальные подтверждения для входа на картинке.
Если пользователь не отправил фото графика, напиши об этом в коментарии строго в формате: "Ты не отправил фото графика", все остальное - None
Если на фото графика не видно валютную пару, напиши об этом в коментарии строго в формате: "Валютная пара не распознана", все остальное - None
Если на фото графика не видно котировку, напиши об этом в коментарии строго в формате: "Котировка не распознана", все остальное - None"""
                )
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Проаналізуй цей графік. Таймфрейм: {timeframe}. Куди піде ціна (Прогноз) та дай короткий коментар російською мовою."},
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

        return result
    except Exception:
        return {"ok": False, "message": "Failed to parse json"}
    