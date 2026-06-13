from django.test import TestCase

from accounts.models import Friend, User
from games.models import GameSession, Player
from games.spy.models import Location, SpyGameState, SpyPlayerState


class SpyGameStateModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            password="pass1234",
        )
        self.session = GameSession.objects.create(
            host=self.user,
            game_type=GameSession.GameType.SPY,
        )
        self.location = Location.objects.create(
            name_en="Hospital",
            name_fa="بیمارستان",
        )
        self.spy_state = SpyGameState.objects.create(
            session=self.session,
            location=self.location,
            spy_count=1,
            timer_duration=300,
        )

    def test_spy_state_created_successfully(self):
        self.assertEqual(SpyGameState.objects.count(), 1)

    def test_spy_state_str(self):
        self.assertEqual(
            str(self.spy_state),
            f"SpyState for Session #{self.session.id}",
        )

    def test_spy_state_linked_to_session(self):
        self.assertEqual(self.spy_state.session, self.session)

    def test_session_has_one_spy_state(self):
        self.assertEqual(self.session.spy_state, self.spy_state)

    def test_default_status_is_created(self):
        self.assertEqual(self.spy_state.status, SpyGameState.Status.CREATED)

    def test_timer_elapsed_default_zero(self):
        self.assertEqual(self.spy_state.timer_elapsed, 0)

    def test_status_transition(self):
        self.spy_state.status = SpyGameState.Status.IN_PROGRESS
        self.spy_state.save()
        updated = SpyGameState.objects.get(pk=self.spy_state.pk)
        self.assertEqual(updated.status, SpyGameState.Status.IN_PROGRESS)


class SpyPlayerStateModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            password="pass1234",
        )
        self.session = GameSession.objects.create(
            host=self.user,
            game_type=GameSession.GameType.SPY,
        )
        self.location = Location.objects.create(
            name_en="Hospital",
            name_fa="بیمارستان",
        )
        self.spy_state = SpyGameState.objects.create(
            session=self.session,
            location=self.location,
            spy_count=1,
        )
        self.friend = Friend.objects.create(user=self.user, name="Sarah")
        self.player = Player.objects.create(
            session=self.session,
            friend=self.friend,
        )
        self.spy_player = SpyPlayerState.objects.create(
            player=self.player,
            session=self.session,
            role_en="Hospital",
            role_fa="بیمارستان",
            is_spy=False,
        )

    def test_spy_player_state_created_successfully(self):
        self.assertEqual(SpyPlayerState.objects.count(), 1)

    def test_spy_player_str_civilian(self):
        self.assertEqual(str(self.spy_player), "Sarah — civilian")

    def test_spy_player_str_spy(self):
        self.spy_player.is_spy = True
        self.spy_player.save()
        self.assertEqual(str(self.spy_player), "Sarah — spy")

    def test_role_revealed_default_false(self):
        self.assertFalse(self.spy_player.role_revealed)

    def test_is_spy_default_false(self):
        self.assertFalse(self.spy_player.is_spy)

    def test_player_has_one_spy_state(self):
        self.assertEqual(self.player.spy_detail, self.spy_player)

    def test_reveal_role(self):
        self.spy_player.role_revealed = True
        self.spy_player.save()
        updated = SpyPlayerState.objects.get(pk=self.spy_player.pk)
        self.assertTrue(updated.role_revealed)
