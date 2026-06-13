from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from games.spy.serializers import (
    SpySessionCreateSerializer,
    SpySessionResponseSerializer,
)
from games.spy.services import SpyGameService


class SpySessionCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = SpySessionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = SpyGameService.create_session(
            host=request.user,
            player_data=serializer.validated_data["players"],
            spy_count=serializer.validated_data["spy_count"],
            timer_duration=serializer.validated_data["timer_duration"],
        )

        response_serializer = SpySessionResponseSerializer(session)

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
