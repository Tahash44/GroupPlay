from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from games.models import GameSession, GuestSession


class GuestGameApiTests(APITestCase):
    def setUp(self):
        self.guest_url = reverse("guest-session-create")
        self.spy_url = reverse("spy-session-create-v1")
        self.payload = {
            "timer_duration": 300,
            "spy_count": 1,
            "players": [
                {"name": "بازیکن یک"},
                {"name": "بازیکن دو"},
                {"name": "بازیکن سه"},
                {"name": "بازیکن چهار"},
            ],
        }

    def create_guest(self):
        response = self.client.post(self.guest_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data["guest_token"]

    def test_guest_token_can_create_spy_session(self):
        token = self.create_guest()
        response = self.client.post(
            self.spy_url,
            self.payload,
            format="json",
            HTTP_X_GUEST_TOKEN=token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        session = GameSession.objects.get(id=response.data["id"])
        self.assertIsNone(session.host)
        self.assertIsNotNone(session.guest)

    def test_guest_cannot_create_without_guest_token(self):
        response = self.client.post(self.spy_url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(GameSession.objects.count(), 0)

    def test_guest_token_cannot_read_another_guest_session(self):
        first_token = self.create_guest()
        create_response = self.client.post(
            self.spy_url,
            self.payload,
            format="json",
            HTTP_X_GUEST_TOKEN=first_token,
        )
        session_id = create_response.data["id"]
        second_token = self.create_guest()

        response = self.client.get(
            reverse("spy-session-detail-v1", kwargs={"id": session_id}),
            HTTP_X_GUEST_TOKEN=second_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_guest_has_one_active_spy_session(self):
        token = self.create_guest()
        first = self.client.post(self.spy_url, self.payload, format="json", HTTP_X_GUEST_TOKEN=token)
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        second = self.client.post(self.spy_url, self.payload, format="json", HTTP_X_GUEST_TOKEN=token)

        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(GuestSession.objects.get(token=token).game_sessions.count(), 1)
