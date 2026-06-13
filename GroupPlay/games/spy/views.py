from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.generics import RetrieveAPIView
from games.models import GameSession
from games.spy.serializers import (
    SpySessionCreateSerializer,
    SpySessionResponseSerializer,
    SpySessionDetailSerializer,
)
from games.spy.services import SpyGameService


from .services import SpyRevealService
from .serializers import (
    PendingPlayerSerializer,
    RevealRoleRequestSerializer
)

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

from django.shortcuts import get_object_or_404
from rest_framework.generics import RetrieveAPIView

class SpySessionDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SpySessionDetailSerializer
    queryset = GameSession.objects.filter(game_type=GameSession.GameType.SPY)
    lookup_field = 'id'

    def get_object(self):

        return get_object_or_404(self.queryset, id=self.kwargs["id"])





class SpySessionRevealView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, id):

        session = get_object_or_404(GameSession, id=id)

        players = SpyRevealService.get_pending_players(session)

        serializer = PendingPlayerSerializer(players, many=True)

        return Response({
            "players": serializer.data
        })


    def post(self, request, id):

        session = get_object_or_404(GameSession, id=id)

        serializer = RevealRoleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = SpyRevealService.reveal_role(
            session=session,
            player_id=serializer.validated_data["player_id"]
        )

        return Response(result)
