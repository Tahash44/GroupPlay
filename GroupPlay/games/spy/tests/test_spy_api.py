from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class SpySessionAPITest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="12345678"
        )

        self.client.force_authenticate(user=self.user)

        self.url = reverse("spy-session-create-v1")

        self.valid_payload = {
            "timer_duration": 300,
            "spy_count": 1,
            "players": [
                {"name": "Ali", "friend_id": None},
                {"name": "Reza", "friend_id": None},
                {"name": "Sara", "friend_id": None}
            ]
        }

    def test_create_session_success(self):
        response = self.client.post(
            self.url,
            self.valid_payload,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)

    def test_create_session_unauthorized(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            self.url,
            self.valid_payload,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_session_less_than_min_players(self):
        invalid_payload = {
            "timer_duration": 300,
            "spy_count": 1,
            "players": [
                {"name": "Ali", "friend_id": None},
                {"name": "Reza", "friend_id": None}
            ]
        }

        response = self.client.post(
            self.url,
            invalid_payload,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_session_invalid_spy_count(self):
        invalid_payload = {
            "timer_duration": 300,
            "spy_count": 5,
            "players": [
                {"name": "Ali", "friend_id": None},
                {"name": "Reza", "friend_id": None},
                {"name": "Sara", "friend_id": None}
            ]
        }

        response = self.client.post(
            self.url,
            invalid_payload,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
