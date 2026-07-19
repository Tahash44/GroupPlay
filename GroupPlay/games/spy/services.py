import random
from django.db import transaction
from games.models import GameSession, Player
from games.spy.models import SpyGameState, SpyPlayerState, Location
from django.utils import timezone
from rest_framework.exceptions import ValidationError

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
            timer_duration=timer_duration,
            status=SpyGameState.Status.ROLE_REVEAL
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

        all_revealed = not SpyPlayerState.objects.filter(
            session=session,
            role_revealed=False
        ).exists()

        if all_revealed:
            spy_game = SpyGameState.objects.get(session=session)
            spy_game.status = SpyGameState.Status.IN_PROGRESS
            spy_game.timer_started_at = timezone.now()
            spy_game.save(update_fields=["status", "timer_started_at"])

        spy_game = SpyGameState.objects.get(session=session)

        if player_state.is_spy:
            return {
                "role": "spy",
                "location": None,
                "status": spy_game.status
            }

        return {
            "role": player_state.role_en,
            "location": spy_game.location.name_en,
            "status": spy_game.status
        }

class SpyTimerService:
    @staticmethod
    def get_timer_status(session):
        spy_game = SpyGameState.objects.get(session=session)

        elapsed = spy_game.timer_elapsed or 0

        if spy_game.timer_started_at:
            delta = timezone.now() - spy_game.timer_started_at
            elapsed += int(delta.total_seconds())

        remaining_time = max(spy_game.timer_duration - elapsed, 0)

        return {
            "timer_duration": spy_game.timer_duration,
            "timer_elapsed": elapsed,
            "timer_started_at": spy_game.timer_started_at,
            "remaining_time": remaining_time,
            "is_running": spy_game.timer_started_at is not None and remaining_time > 0,
        }

class SpyTimerService:
    @staticmethod
    def get_timer_status(session):
        spy_game = SpyGameState.objects.get(session=session)

        elapsed = spy_game.timer_elapsed or 0

        if spy_game.timer_started_at:
            delta = timezone.now() - spy_game.timer_started_at
            elapsed += int(delta.total_seconds())

        remaining_time = max(spy_game.timer_duration - elapsed, 0)

        return {
            "timer_duration": spy_game.timer_duration,
            "timer_elapsed": elapsed,
            "timer_started_at": spy_game.timer_started_at,
            "remaining_time": remaining_time,
            "is_running": spy_game.timer_started_at is not None and remaining_time > 0,
        }

    @staticmethod
    def pause_timer(session):
        spy_game = SpyGameState.objects.get(session=session)

        if spy_game.timer_started_at:
            delta = timezone.now() - spy_game.timer_started_at
            spy_game.timer_elapsed += int(delta.total_seconds())
            spy_game.timer_started_at = None
            spy_game.save(update_fields=["timer_elapsed", "timer_started_at"])

        remaining_time = max(spy_game.timer_duration - spy_game.timer_elapsed, 0)

        return {
            "message": "Timer paused",
            "timer_duration": spy_game.timer_duration,
            "timer_elapsed": spy_game.timer_elapsed,
            "timer_started_at": spy_game.timer_started_at,
            "remaining_time": remaining_time,
            "is_running": False,
        }

    @staticmethod
    def resume_timer(session):
        spy_game = SpyGameState.objects.get(session=session)

        if spy_game.timer_started_at:
            raise ValidationError("Timer is already running.")

        if spy_game.timer_elapsed >= spy_game.timer_duration:
            raise ValidationError("Timer has already finished.")

        spy_game.timer_started_at = timezone.now()
        spy_game.save(update_fields=["timer_started_at"])

        remaining_time = max(
            spy_game.timer_duration - spy_game.timer_elapsed,
            0
        )

        return {
            "message": "Timer resumed",
            "timer_duration": spy_game.timer_duration,
            "timer_elapsed": spy_game.timer_elapsed,
            "timer_started_at": spy_game.timer_started_at,
            "remaining_time": remaining_time,
            "is_running": True,
        }

    @staticmethod
    def stop_timer(session):
        spy_game = SpyGameState.objects.get(session=session)


        if spy_game.timer_started_at:
            delta = timezone.now() - spy_game.timer_started_at
            spy_game.timer_elapsed += int(delta.total_seconds())

        spy_game.timer_started_at = None
        spy_game.status = SpyGameState.Status.VOTING

        spy_game.save(update_fields=[
            "timer_elapsed",
            "timer_started_at",
            "status"
        ])

        return {
            "message": "Status changed to voting",
            "status": spy_game.status,
            "timer_duration": spy_game.timer_duration,
            "timer_elapsed": spy_game.timer_elapsed,
            "is_running": False,
        }



class SpyVoteService:

    @staticmethod
    def vote(session, voted_player_id):
        spy_game = SpyGameState.objects.get(session=session)

        if spy_game.status != SpyGameState.Status.VOTING:
            raise ValidationError("Session is not in VOTING state.")

        try:
            voted_player = Player.objects.get(id=voted_player_id, session=session)
        except Player.DoesNotExist:
            raise ValidationError(f"Player {voted_player_id} not found in this session.")

        voted_state = SpyPlayerState.objects.get(player=voted_player, session=session)

        if voted_state.is_spy:
            spy_game.status = SpyGameState.Status.SPY_GUESS
            spy_game.save(update_fields=["status"])
            return {
                "result": "spy_caught",
                "spy_can_guess": True,
                "voted_player": voted_player.name,
                "status": spy_game.status,
                "winner": [],
            }
        else:
            spy_player_ids = list(
                SpyPlayerState.objects.filter(session=session, is_spy=True)
                .values_list("player_id", flat=True)
            )
            spy_game.status = SpyGameState.Status.FINISHED
            spy_game.save(update_fields=["status"])
            session.winner = spy_player_ids
            session.save(update_fields=["winner"])
            return {
                "result": "wrong_vote",
                "spy_can_guess": False,
                "voted_player": voted_player.name,
                "status": spy_game.status,
                "winner": spy_player_ids,
            }


class SpyGuessService:

    @staticmethod
    def guess_location(session, location_name):
        spy_game = SpyGameState.objects.get(session=session)

        if spy_game.status != SpyGameState.Status.SPY_GUESS:
            raise ValidationError("Session is not in SPY_GUESS state.")

        correct = (
                location_name.strip().lower() == spy_game.location.name_en.strip().lower()
                or location_name.strip() == spy_game.location.name_fa.strip()
        )

        if correct:
            winner_ids = list(
                SpyPlayerState.objects.filter(session=session, is_spy=True)
                .values_list("player_id", flat=True)
            )
        else:
            winner_ids = list(
                SpyPlayerState.objects.filter(session=session, is_spy=False)
                .values_list("player_id", flat=True)
            )

        spy_game.status = SpyGameState.Status.FINISHED
        spy_game.save(update_fields=["status"])

        session.winner = winner_ids
        session.save(update_fields=["winner"])

        return {
            "correct": correct,
            "location": spy_game.location.name_en,
            "winner": winner_ids,
            "status": spy_game.status,
        }
