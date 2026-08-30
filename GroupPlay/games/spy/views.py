from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from django.shortcuts import get_object_or_404
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
from games.spy.services import SpyGameService, SpyVoteService, SpyGuessService, SpyTimerService
from games.services import get_guest_from_request, get_owned_spy_session

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
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = SpySessionCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        guest = None if request.user.is_authenticated else get_guest_from_request(request)
        if not request.user.is_authenticated and guest is None:
            return Response({"detail": "Guest token is required."}, status=status.HTTP_401_UNAUTHORIZED)

        session = SpyGameService.create_session(
            host=request.user if request.user.is_authenticated else None,
            guest=guest,
            player_data=serializer.validated_data["players"],
            spy_count=serializer.validated_data["spy_count"],
            timer_duration=serializer.validated_data["timer_duration"],
        )

        response_serializer = SpySessionResponseSerializer(session)

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication is required."}, status=status.HTTP_401_UNAUTHORIZED)
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

def get_host_spy_session(request, session_id):
    return get_owned_spy_session(request, session_id)


class SpySessionDetailView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = SpySessionDetailSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return GameSession.objects.filter(game_type=GameSession.GameType.SPY)

    def get_object(self):
        return get_host_spy_session(self.request, self.kwargs["id"])





class SpySessionRevealView(APIView):

    permission_classes = [AllowAny]

    def get(self, request, id):

        session = get_host_spy_session(request, id)

        players = SpyRevealService.get_pending_players(session)

        serializer = PendingPlayerSerializer(players, many=True)

        return Response({
            "players": serializer.data
        })


    def post(self, request, id):

        session = get_host_spy_session(request, id)

        serializer = RevealRoleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = SpyRevealService.reveal_role(
            session=session,
            player_id=serializer.validated_data["player_id"]
        )

        return Response(result)

class SpySessionTimerView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id):
        session = get_host_spy_session(request, id)

        result = SpyTimerService.get_timer_status(session)
        serializer = TimerResponseSerializer(result)

        return Response(serializer.data, status=status.HTTP_200_OK)

class SpySessionTimerPauseView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, id):
        session = get_host_spy_session(request, id)

        result = SpyTimerService.pause_timer(session)
        serializer = TimerPauseResponseSerializer(result)

        return Response(serializer.data, status=status.HTTP_200_OK)

class SpySessionTimerResumeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, id):
        session = get_host_spy_session(request, id)

        result = SpyTimerService.resume_timer(session)
        serializer = TimerResumeResponseSerializer(result)

        return Response(serializer.data, status=status.HTTP_200_OK)

class SpySessionTimerStopView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, id):
        session = get_host_spy_session(request, id)

        result = SpyTimerService.stop_timer(session)
        serializer = TimerStopResponseSerializer(result)

        return Response(serializer.data, status=status.HTTP_200_OK)


class SpySessionEarlyGuessView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, id):
        session = get_host_spy_session(request, id)
        result = SpyTimerService.start_spy_guess(session)
        return Response(result, status=status.HTTP_200_OK)



class SpySessionVoteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, id):
        session = get_host_spy_session(request, id)

        serializer = VoteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = SpyVoteService.vote(
            session=session,
            voted_player_ids=serializer.validated_data.get("voted_player_ids")
            or [serializer.validated_data["voted_player_id"]],
        )

        return Response(VoteResultResponseSerializer(result).data, status=status.HTTP_200_OK)


class SpySessionGuessView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, id):
        session = get_host_spy_session(request, id)

        serializer = SpyGuessRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = SpyGuessService.guess_location(
            session=session,
            is_correct=serializer.validated_data["is_correct"],
        )

        return Response(GameResultResponseSerializer(result).data, status=status.HTTP_200_OK)
