from django.shortcuts import get_object_or_404
from games.models import GameSession, GuestSession
from rest_framework.exceptions import NotAuthenticated


GUEST_TOKEN_HEADER = "HTTP_X_GUEST_TOKEN"


def get_guest_from_request(request):
    token = request.META.get(GUEST_TOKEN_HEADER)
    if not token:
        return None
    guest = GuestSession.objects.filter(token=token).first()
    if guest is None or not guest.is_valid():
        return None
    return guest


def get_owned_spy_session(request, session_id):
    queryset = GameSession.objects.filter(
        id=session_id,
        game_type=GameSession.GameType.SPY,
    )
    if request.user and request.user.is_authenticated:
        return get_object_or_404(queryset, host=request.user)
    guest = get_guest_from_request(request)
    if guest is None:
        raise NotAuthenticated("Authentication or a valid guest token is required.")
    return get_object_or_404(queryset, guest=guest)
