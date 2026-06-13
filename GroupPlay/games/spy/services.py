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




class SpyRevealService:

    @staticmethod
    def get_pending_players(session):
        states = SpyPlayerState.objects.filter(
            session=session,
            role_revealed=False
        )

        return [state.player for state in states]

    @staticmethod
    def reveal_role(session, player_id):
        player = Player.objects.get(id=player_id, session=session)

        player_state = SpyPlayerState.objects.get(
            player=player,
            session=session
        )

        if player_state.role_revealed:
            raise ValueError("Role already revealed")

        player_state.role_revealed = True
        player_state.save()

        spy_game = SpyGameState.objects.get(session=session)

        if player_state.is_spy:
            return {
                "role": "spy",
                "location": None
            }

        return {
            "role": player_state.role_en,
            "location": spy_game.location.name_en
        }

