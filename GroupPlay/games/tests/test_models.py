from django.test import TestCase

from accounts.models import User, Friend
from games.models import GameSession, Player


class GameSessionModelTest(TestCase):
    """Tests for the GameSession model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            password="pass1234",
        )
        self.session = GameSession.objects.create(
            host=self.user,
            game_type=GameSession.GameType.SPY,
            timer_duration=300,
        )

    def test_session_created_successfully(self):
        """Session should be created successfully"""
        self.assertEqual(GameSession.objects.count(), 1)

    def test_session_default_status_is_created(self):
        """Default status should be CREATED"""
        self.assertEqual(self.session.status, GameSession.Status.CREATED)

    def test_session_str(self):
        """__str__ should display session info correctly"""
        self.assertEqual(
            str(self.session),
            f"Session #{self.session.id} (spy) — CREATED",
        )

    def test_session_host_is_user(self):
        """Session host should be the correct user"""
        self.assertEqual(self.session.host, self.user)

    def test_session_timer_elapsed_default_zero(self):
        """timer_elapsed should default to 0"""
        self.assertEqual(self.session.timer_elapsed, 0)

    def test_session_winner_default_null(self):
        """winner should default to None"""
        self.assertIsNone(self.session.winner)

    def test_session_status_transitions(self):
        """Session status should be updatable"""
        self.session.status = GameSession.Status.IN_PROGRESS
        self.session.save()
        updated = GameSession.objects.get(pk=self.session.pk)
        self.assertEqual(updated.status, GameSession.Status.IN_PROGRESS)


class PlayerModelTest(TestCase):
    """Tests for the Player model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            password="pass1234",
        )
        self.friend = Friend.objects.create(
            user=self.user,
            name="Sarah",
        )
        self.session = GameSession.objects.create(
            host=self.user,
            game_type=GameSession.GameType.SPY,
            timer_duration=300,
        )
        self.player = Player.objects.create(
            session=self.session,
            friend=self.friend,
        )

    def test_player_created_successfully(self):
        """Player should be created successfully"""
        self.assertEqual(Player.objects.count(), 1)

    def test_player_name_comes_from_friend(self):
        """Player name should come from the linked friend"""
        self.assertEqual(self.player.friend.name, "Sarah")

    def test_player_str(self):
        """__str__ should show the friend name and session number"""
        self.assertEqual(
            str(self.player),
            f"Sarah in Session #{self.session.id}",
        )

    def test_player_belongs_to_session(self):
        """Player should be linked to the correct session"""
        self.assertEqual(self.player.session, self.session)

    def test_session_can_have_multiple_players(self):
        """A session should be able to have multiple players"""
        friend2 = Friend.objects.create(user=self.user, name="Mike")
        friend3 = Friend.objects.create(user=self.user, name="Emily")
        Player.objects.create(session=self.session, friend=friend2)
        Player.objects.create(session=self.session, friend=friend3)
        self.assertEqual(self.session.players.count(), 3)