from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.generics import RetrieveAPIView
from games.models import GameSession
from rest_framework.pagination import PageNumberPagination
from games.spy.serializers import (
    SpySessionCreateSerializer,
    SpySessionResponseSerializer,
    SpySessionDetailSerializer,
    TimerResponseSerializer,
    TimerPauseResponseSerializer,
    TimerResumeResponseSerializer,
    SpySessionHistorySerializer,
    TimerStopResponseSerializer,
)
from games.spy.services import SpyGameService,SpyVoteService, SpyGuessService,SpyTimerService

from .models import SpyGameState
from .services import SpyRevealService
from .serializers import (
    PendingPlayerSerializer,
    RevealRoleRequestSerializer,
    VoteRequestSerializer,
    VoteResultResponseSerializer,
    SpyGuessRequestSerializer,
    GameResultResponseSerializer,
)

class SpySessionHistoryPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50

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

    def get(self, request):
        queryset = GameSession.objects.filter(
            host=request.user,
            game_type=GameSession.GameType.SPY
        ).order_by("-created_at")

        status_param = request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(spy_state__status=status_param)

        paginator = SpySessionHistoryPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = SpySessionHistorySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

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

class SpySessionTimerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        session = get_object_or_404(
            GameSession.objects.filter(game_type=GameSession.GameType.SPY),
            id=id
        )

        result = SpyTimerService.get_timer_status(session)
        serializer = TimerResponseSerializer(result)

        return Response(serializer.data, status=status.HTTP_200_OK)

class SpySessionTimerPauseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        session = get_object_or_404(
            GameSession.objects.filter(game_type=GameSession.GameType.SPY),
            id=id
        )

        result = SpyTimerService.pause_timer(session)
        serializer = TimerPauseResponseSerializer(result)

        return Response(serializer.data, status=status.HTTP_200_OK)

class SpySessionTimerResumeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        session = get_object_or_404(
            GameSession.objects.filter(game_type=GameSession.GameType.SPY),
            id=id
        )

        result = SpyTimerService.resume_timer(session)
        serializer = TimerResumeResponseSerializer(result)

        return Response(serializer.data, status=status.HTTP_200_OK)

class SpySessionTimerStopView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        session = get_object_or_404(
            GameSession.objects.filter(game_type=GameSession.GameType.SPY),
            id=id
        )

        result = SpyTimerService.stop_timer(session)
        serializer = TimerStopResponseSerializer(result)

        return Response(serializer.data, status=status.HTTP_200_OK)



class SpySessionVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        session = get_object_or_404(
            GameSession.objects.filter(game_type=GameSession.GameType.SPY),
            id=id
        )

        serializer = VoteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = SpyVoteService.vote(
            session=session,
            voted_player_id=serializer.validated_data["voted_player_id"],
        )

        return Response(VoteResultResponseSerializer(result).data, status=status.HTTP_200_OK)


class SpySessionGuessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        session = get_object_or_404(
            GameSession.objects.filter(game_type=GameSession.GameType.SPY),
            id=id
        )

        spy_game = SpyGameState.objects.get(session=session)
        if spy_game.status != SpyGameState.Status.SPY_GUESS:
            return Response(
                {"detail": "Session is not in SPY_GUESS state."},
                status=status.HTTP_409_CONFLICT
            )

        serializer = SpyGuessRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = SpyGuessService.guess_location(
            session=session,
            is_correct=serializer.validated_data["is_correct"],
        )

        return Response(GameResultResponseSerializer(result).data, status=status.HTTP_200_OK)