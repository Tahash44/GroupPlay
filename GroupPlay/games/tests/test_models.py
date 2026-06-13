from django.test import TestCase

from accounts.models import Friend, User
from games.models import GameSession, Player


class GameSessionModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            password="pass1234",
        )
        self.session = GameSession.objects.create(
            host=self.user,
            game_type=GameSession.GameType.SPY,
        )

    def test_session_created_successfully(self):
        self.assertEqual(GameSession.objects.count(), 1)

    def test_session_host_is_user(self):
        self.assertEqual(self.session.host, self.user)

    def test_session_winner_default_null(self):
        self.assertIsNone(self.session.winner)

    def test_session_game_type(self):
        self.assertEqual(self.session.game_type, GameSession.GameType.SPY)


class PlayerModelTest(TestCase):

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
        )
        self.player = Player.objects.create(
            session=self.session,
            friend=self.friend,
        )

    def test_player_created_successfully(self):
        self.assertEqual(Player.objects.count(), 1)

    def test_player_name_comes_from_friend(self):
        self.assertEqual(self.player.name, "Sarah")

    def test_player_str(self):
        self.assertEqual(
            str(self.player),
            f"Sarah in Session #{self.session.id}",
        )

    def test_player_belongs_to_session(self):
        self.assertEqual(self.player.session, self.session)

    def test_session_can_have_multiple_players(self):
        friend2 = Friend.objects.create(user=self.user, name="Mike")
        friend3 = Friend.objects.create(user=self.user, name="Emily")
        Player.objects.create(session=self.session, friend=friend2)
        Player.objects.create(session=self.session, friend=friend3)
        self.assertEqual(self.session.players.count(), 3)