from django.test import TestCase

from accounts.models import User, Friend
from games.models import GameSession, Player
from games.spy.models import SpyGameState, SpyPlayerState


class SpyGameStateModelTest(TestCase):
    """Tests for the SpyGameState model"""

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
        self.spy_state = SpyGameState.objects.create(
            session=self.session,
            location="Hospital",
            spy_count=1,
        )

    def test_spy_state_created_successfully(self):
        """SpyGameState should be created successfully"""
        self.assertEqual(SpyGameState.objects.count(), 1)

    def test_spy_state_str(self):
        """__str__ should display the correct information"""
        self.assertEqual(
            str(self.spy_state),
            f"SpyState for Session #{self.session.id} — Hospital",
        )

    def test_spy_state_linked_to_session(self):
        """SpyGameState should be linked to the correct session"""
        self.assertEqual(self.spy_state.session, self.session)

    def test_session_has_one_spy_state(self):
        """Each session should have only one SpyGameState (OneToOne)"""
        self.assertEqual(self.session.spy_state, self.spy_state)


class SpyPlayerStateModelTest(TestCase):
    """Tests for the SpyPlayerState model"""

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
        self.friend = Friend.objects.create(user=self.user, name="Sarah")
        self.player = Player.objects.create(
            session=self.session,
            friend=self.friend,
        )
        self.spy_player = SpyPlayerState.objects.create(
            player=self.player,
            session=self.session,
            role="civilian",
            is_spy=False,
        )

    def test_spy_player_state_created_successfully(self):
        """SpyPlayerState should be created successfully"""
        self.assertEqual(SpyPlayerState.objects.count(), 1)

    def test_spy_player_str_civilian(self):
        """__str__ should be correct for a civilian"""
        self.assertEqual(str(self.spy_player), "Sarah — civilian")

    def test_spy_player_str_spy(self):
        """__str__ should be correct for a spy"""
        self.spy_player.is_spy = True
        self.spy_player.save()
        self.assertEqual(str(self.spy_player), "Sarah — spy")

    def test_role_revealed_default_false(self):
        """role_revealed should default to False"""
        self.assertFalse(self.spy_player.role_revealed)

    def test_is_spy_default_false(self):
        """is_spy should default to False"""
        self.assertFalse(self.spy_player.is_spy)

    def test_player_has_one_spy_state(self):
        """Each player should have only one SpyPlayerState (OneToOne)"""
        self.assertEqual(self.player.spy_detail, self.spy_player)

    def test_reveal_role(self):
        """role_revealed should be settable to True"""
        self.spy_player.role_revealed = True
        self.spy_player.save()
        updated = SpyPlayerState.objects.get(pk=self.spy_player.pk)
        self.assertTrue(updated.role_revealed)