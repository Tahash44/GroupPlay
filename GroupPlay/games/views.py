from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .models import GuestSession


class GuestSessionCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        guest = GuestSession.create()
        return Response(
            {"guest_token": guest.token, "expires_at": guest.expires_at},
            status=status.HTTP_201_CREATED,
        )
