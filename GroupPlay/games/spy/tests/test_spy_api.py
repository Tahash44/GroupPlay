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
class SpyVoteAndGuessAPITest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="host2", password="12345678")
        self.client.force_authenticate(user=self.user)

        create_url = reverse("spy-session-create-v1")
        payload = {
            "timer_duration": 300,
            "spy_count": 1,
            "players": [
                {"name": "Ali", "friend_id": None},
                {"name": "Reza", "friend_id": None},
                {"name": "Sara", "friend_id": None},
            ],
        }
        create_response = self.client.post(create_url, payload, format="json")
        self.session_id = create_response.data["id"]

        session = GameSession.objects.get(id=self.session_id)
        self.spy_state = SpyGameState.objects.get(session=session)
        self.spy_state.status = SpyGameState.Status.VOTING
        self.spy_state.save(update_fields=["status"])

        self.spy_player = SpyPlayerState.objects.get(session=session, is_spy=True)
        self.civilian_player = SpyPlayerState.objects.filter(session=session, is_spy=False).first()

        self.vote_url = reverse("spy-session-vote-v1", kwargs={"id": self.session_id})
        self.guess_url = reverse("spy-session-spy-guess-v1", kwargs={"id": self.session_id})

    def test_vote_correct_player_opens_spy_guess(self):
        response = self.client.post(
            self.vote_url,
            {"voted_player_id": self.spy_player.player_id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["result"], "spy_caught")
        self.assertTrue(response.data["spy_can_guess"])
        self.assertEqual(response.data["status"], SpyGameState.Status.SPY_GUESS)

        self.spy_state.refresh_from_db()
        self.assertEqual(self.spy_state.status, SpyGameState.Status.SPY_GUESS)

    def test_vote_wrong_player_finishes_game_civilians_lose(self):
        response = self.client.post(
            self.vote_url,
            {"voted_player_id": self.civilian_player.player_id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["result"], "wrong_vote")
        self.assertFalse(response.data["spy_can_guess"])
        self.assertEqual(response.data["status"], SpyGameState.Status.FINISHED)
        self.assertEqual(response.data["winner"], [self.spy_player.player_id])

    def test_vote_when_not_in_voting_state_fails(self):
        self.spy_state.status = SpyGameState.Status.IN_PROGRESS
        self.spy_state.save(update_fields=["status"])

        response = self.client.post(
            self.vote_url,
            {"voted_player_id": self.spy_player.player_id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_guess_correct_spy_wins(self):
        self.spy_state.status = SpyGameState.Status.SPY_GUESS
        self.spy_state.save(update_fields=["status"])

        response = self.client.post(self.guess_url, {"is_correct": True}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["correct"])
        self.assertEqual(response.data["status"], SpyGameState.Status.FINISHED)
        self.assertEqual(response.data["winner"], [self.spy_player.player_id])

    def test_guess_wrong_civilians_win(self):
        self.spy_state.status = SpyGameState.Status.SPY_GUESS
        self.spy_state.save(update_fields=["status"])

        response = self.client.post(self.guess_url, {"is_correct": False}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["correct"])
        self.assertEqual(response.data["status"], SpyGameState.Status.FINISHED)
        civilian_ids = set(
            SpyPlayerState.objects.filter(session_id=self.session_id, is_spy=False)
            .values_list("player_id", flat=True)
        )
        self.assertEqual(set(response.data["winner"]), civilian_ids)

    def test_guess_from_wrong_state_returns_409(self):
        # spy_state هنوز روی VOTING هست، نه SPY_GUESS
        response = self.client.post(self.guess_url, {"is_correct": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        
class SpySessionHistoryAPITest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="historyuser", password="12345678")
        self.client.force_authenticate(user=self.user)
        self.create_url = reverse("spy-session-create-v1")
        self.payload = {
            "timer_duration": 300,
            "spy_count": 1,
            "players": [
                {"name": "Ali", "friend_id": None},
                {"name": "Reza", "friend_id": None},
                {"name": "Sara", "friend_id": None},
            ],
        }

    def _create_finished_session(self, spy_wins: bool):
        response = self.client.post(self.create_url, self.payload, format="json")
        session_id = response.data["id"]
        session = GameSession.objects.get(id=session_id)
        spy_state = SpyGameState.objects.get(session=session)
        spy_state.status = SpyGameState.Status.FINISHED
        spy_state.save(update_fields=["status"])

        spy_player = SpyPlayerState.objects.get(session=session, is_spy=True)
        civilians = SpyPlayerState.objects.filter(session=session, is_spy=False)

        session.winner = [spy_player.player_id] if spy_wins else [p.player_id for p in civilians]
        session.save(update_fields=["winner"])
        return session_id

    def test_list_filters_by_status(self):
        finished_id = self._create_finished_session(spy_wins=False)
        self.client.post(self.create_url, self.payload, format="json")  # سشن ناتموم

        response = self.client.get(self.create_url, {"status": "FINISHED"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertEqual(ids, [finished_id])

    def test_list_item_fields_and_winner_side_civilians(self):
        self._create_finished_session(spy_wins=False)

        response = self.client.get(self.create_url, {"status": "FINISHED"})
        item = response.data["results"][0]

        for field in ("id", "game_type", "status", "played_at", "player_count", "winner_side"):
            self.assertIn(field, item)
        self.assertEqual(item["player_count"], 3)
        self.assertEqual(item["winner_side"], "civilians")

    def test_list_winner_side_spy(self):
        self._create_finished_session(spy_wins=True)

        response = self.client.get(self.create_url, {"status": "FINISHED"})
        self.assertEqual(response.data["results"][0]["winner_side"], "spy")

    def test_list_is_paginated(self):
        self._create_finished_session(spy_wins=False)

        response = self.client.get(self.create_url, {"status": "FINISHED"})

        for field in ("count", "next", "previous", "results"):
            self.assertIn(field, response.data)

    def test_list_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.create_url, {"status": "FINISHED"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_detail_includes_history_fields(self):
        finished_id = self._create_finished_session(spy_wins=False)
        detail_url = reverse("spy-session-detail-v1", kwargs={"id": finished_id})

        response = self.client.get(detail_url)

        for field in ("played_at", "duration_seconds", "player_count", "winner_side"):
            self.assertIn(field, response.data)
        self.assertEqual(response.data["player_count"], 3)
        self.assertEqual(response.data["winner_side"], "civilians")