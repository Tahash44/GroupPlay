from django.test import TestCase
from django.contrib.auth import get_user_model
from games.models import GameSession, Player
from games.spy.models import Location, SpyGameState, SpyPlayerState
from games.spy.services import SpyGameService

User = get_user_model()


class SpyGameLogicTest(TestCase):

    def setUp(self):
        self.host = User.objects.create_user(
            username="host",
            password="testpass123"
        )

        self.session = GameSession.objects.create(
            host=self.host,
            game_type="spy"
        )

        self.location = Location.objects.create(
            name_en="Hospital",
            name_fa="بیمارستان"
        )

        self.spy_state = SpyGameState.objects.create(
            session=self.session,
            location=self.location,
            spy_count=1
        )

    def test_create_session_logic(self):

        GameSession.objects.all().delete()

        player_data = [
            {"name": "Player 1"},
            {"name": "Player 2"},
            {"name": "Player 3"}
        ]

        timer_duration = 300
        spy_count = 1

        session = SpyGameService.create_session(
            host=self.host,
            timer_duration=timer_duration,
            spy_count=spy_count,
            player_data=player_data
        )

        self.assertEqual(GameSession.objects.count(), 1)
        self.assertEqual(session.game_type, "spy")

        spy_state = SpyGameState.objects.get(session=session)

        self.assertIsNotNone(spy_state.location)
        self.assertEqual(spy_state.spy_count, spy_count)
        self.assertEqual(spy_state.timer_duration, timer_duration)

        self.assertEqual(Player.objects.filter(session=session).count(), 3)
        self.assertEqual(SpyPlayerState.objects.filter(session=session).count(), 3)

        spies = SpyPlayerState.objects.filter(session=session, is_spy=True)
        self.assertEqual(spies.count(), spy_count)

        spy_player = spies.first()
        civilian_player = SpyPlayerState.objects.filter(session=session, is_spy=False).first()

        self.assertEqual(spy_player.role_en, "Spy")
        self.assertEqual(spy_player.role_fa, "جاسوس")

        self.assertEqual(civilian_player.role_en, spy_state.location.name_en)
        self.assertEqual(civilian_player.role_fa, spy_state.location.name_fa)

    def test_empty_locations_fallback(self):

        Location.objects.all().delete()

        player_data = [
            {"name": "P1"},
            {"name": "P2"},
            {"name": "P3"}
        ]

        session = SpyGameService.create_session(
            self.host,
            300,
            1,
            player_data
        )

        self.assertIsNotNone(session.spy_state.location)
        self.assertEqual(session.spy_state.location.name_en, "Secret Base")
