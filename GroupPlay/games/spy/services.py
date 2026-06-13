import random
from django.db import transaction
from games.models import GameSession, Player
from games.spy.models import SpyGameState, SpyPlayerState, Location


class SpyGameService:
    @staticmethod
    @transaction.atomic
    def create_session(host, timer_duration, spy_count, player_data):

        session = GameSession.objects.create(
            host=host,
            game_type=GameSession.GameType.SPY
        )


        location = Location.objects.order_by('?').first()
        if not location:

            location = Location.objects.create(name_en="Secret Base", name_fa="پایگاه مخفی")


        spy_state = SpyGameState.objects.create(
            session=session,
            location=location,
            spy_count=spy_count,
            timer_duration=timer_duration
        )


        players_list = []
        for p in player_data:
            player = Player.objects.create(
                session=session,
                friend_id=p.get('friend_id'),
                name=p.get('name', '')
            )
            players_list.append(player)


        spy_players = random.sample(players_list, k=spy_count)

        for player in players_list:
            is_spy = player in spy_players

            if is_spy:
                role_en, role_fa = "Spy", "جاسوس"
            else:
                role_en, role_fa = location.name_en, location.name_fa

            SpyPlayerState.objects.create(
                player=player,
                session=session,
                is_spy=is_spy,
                role_en=role_en,
                role_fa=role_fa,
                role_revealed=False
            )

        return session
