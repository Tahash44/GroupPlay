from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from games.models import GameSession
from games.spy.models import SpyGameState
from django.utils import timezone


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

    def test_get_session_detail_success(self):

        create_response = self.client.post(self.url, self.valid_payload, format="json")
        session_id = create_response.data['id']


        detail_url = reverse("spy-session-detail-v1", kwargs={'id': session_id})
        response = self.client.get(detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], session_id)
        self.assertIn('players', response.data)
        self.assertIn('location', response.data)

    def test_reveal_role_success(self):
        create_response = self.client.post(self.url, self.valid_payload, format="json")
        session_id = create_response.data["id"]

        detail_url = reverse("spy-session-detail-v1", kwargs={"id": session_id})
        detail_response = self.client.get(detail_url)

        player_id = detail_response.data["players"][0]["id"]

        reveal_url = reverse("spy-session-reveal-v1", kwargs={"id": session_id})
        response = self.client.post(
            reveal_url,
            {"player_id": player_id},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("role", response.data)

    def test_get_pending_players(self):
        create_response = self.client.post(self.url, self.valid_payload, format="json")
        session_id = create_response.data["id"]

        reveal_url = reverse("spy-session-reveal-v1", kwargs={"id": session_id})
        response = self.client.get(reveal_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("players", response.data)

    def test_get_timer_status_success(self):
        create_response = self.client.post(self.url, self.valid_payload, format="json")
        session_id = create_response.data["id"]

        url = reverse("spy-session-timer-v1", kwargs={"id": session_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("timer_duration", response.data)
        self.assertIn("timer_elapsed", response.data)
        self.assertIn("timer_started_at", response.data)
        self.assertIn("remaining_time", response.data)
        self.assertIn("is_running", response.data)

    def test_get_timer_status_session_not_found(self):
        url = reverse("spy-session-timer-v1", kwargs={"id": 999999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_timer_status_requires_authentication(self):
        create_response = self.client.post(self.url, self.valid_payload, format="json")
        session_id = create_response.data["id"]

        self.client.force_authenticate(user=None)

        url = reverse("spy-session-timer-v1", kwargs={"id": session_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_pause_timer_success(self):
        create_response = self.client.post(self.url, self.valid_payload, format="json")
        session_id = create_response.data["id"]

        session = GameSession.objects.get(id=session_id)
        spy_state = SpyGameState.objects.get(session=session)
        spy_state.timer_started_at = timezone.now()
        spy_state.save(update_fields=["timer_started_at"])

        url = reverse("spy-session-timer-pause-v1", kwargs={"id": session_id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Timer paused")
        self.assertEqual(response.data["is_running"], False)

        spy_state.refresh_from_db()
        self.assertIsNone(spy_state.timer_started_at)

    def test_pause_timer_when_not_started(self):
        create_response = self.client.post(self.url, self.valid_payload, format="json")
        session_id = create_response.data["id"]

        url = reverse("spy-session-timer-pause-v1", kwargs={"id": session_id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["is_running"], False)

    def test_resume_timer_success(self):
        create_response = self.client.post(self.url, self.valid_payload, format="json")
        session_id = create_response.data["id"]

        session = GameSession.objects.get(id=session_id)
        spy_state = SpyGameState.objects.get(session=session)

        spy_state.timer_elapsed = 30
        spy_state.save(update_fields=["timer_elapsed"])

        url = reverse("spy-session-timer-resume-v1", kwargs={"id": session_id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_running"])

    def test_stop_timer_success(self):
        create_response = self.client.post(self.url, self.valid_payload, format="json")
        session_id = create_response.data["id"]

        session = GameSession.objects.get(id=session_id)
        spy_state = SpyGameState.objects.get(session=session)

        spy_state.timer_started_at = timezone.now()
        spy_state.status = SpyGameState.Status.IN_PROGRESS
        spy_state.save()

        url = reverse("spy-session-timer-stop-v1", kwargs={"id": session_id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], SpyGameState.Status.VOTING)

        spy_state.refresh_from_db()
        self.assertEqual(spy_state.status, SpyGameState.Status.VOTING)
        self.assertIsNone(spy_state.timer_started_at)
