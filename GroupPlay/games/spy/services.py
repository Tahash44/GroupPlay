import random
from django.db import transaction
from games.models import GameSession, Player
from games.spy.models import SpyGameState, SpyPlayerState, Location
from django.utils import timezone
from rest_framework.exceptions import APIException, ValidationError


class InvalidGameState(APIException):
    status_code = 409
    default_detail = "Operation is not allowed in the current game state."
    default_code = "invalid_game_state"

    def __init__(self, detail=None):
        super().__init__({
            "detail": detail or self.default_detail,
            "code": self.default_code,
        })


def get_spy_state(session, *allowed_statuses):
    spy_game = SpyGameState.objects.get(session=session)
    if allowed_statuses and spy_game.status not in allowed_statuses:
        allowed = ", ".join(allowed_statuses)
        raise InvalidGameState(
            f"Operation requires one of these states: {allowed}."
        )
    return spy_game

class SpyGameService:
    RECENT_LOCATION_WINDOW = 5

    @staticmethod
    def _select_location(host):
        active_locations = Location.objects.filter(
            is_active=True,
            archived_at__isnull=True,
        )
        recent_location_ids = list(
            SpyGameState.objects.filter(
                session__host=host,
                status=SpyGameState.Status.FINISHED,
            )
            .order_by("-session__created_at")
            .values_list("location_id", flat=True)[:SpyGameService.RECENT_LOCATION_WINDOW]
        )

        for excluded_count in range(len(recent_location_ids), -1, -1):
            location = (
                active_locations.exclude(pk__in=recent_location_ids[:excluded_count])
                .order_by("?")
                .first()
            )
            if location is not None:
                return location
        return None

    @staticmethod
    @transaction.atomic
    def create_session(host=None, timer_duration=300, spy_count=1, player_data=None, guest=None):
        if player_data is None:
            player_data = []
        if (host is None) == (guest is None):
            raise ValueError("Exactly one session owner is required.")

        if guest is not None:
            active_guest_session = guest.game_sessions.filter(
                game_type=GameSession.GameType.SPY,
                spy_state__status__in=[
                    SpyGameState.Status.ROLE_REVEAL,
                    SpyGameState.Status.IN_PROGRESS,
                    SpyGameState.Status.VOTING,
                    SpyGameState.Status.SPY_GUESS,
                ],
            ).exists()
            if active_guest_session:
                raise ValidationError("Guest already has an active game.")

        session = GameSession.objects.create(
            host=host,
            guest=guest,
            game_type=GameSession.GameType.SPY
        )

        location = SpyGameService._select_location(host)
        if not location:
            fallback_name = "Secret Base"
            suffix = 1
            while Location.objects.filter(name_en__iexact=fallback_name).exists():
                suffix += 1
                fallback_name = f"Secret Base {suffix}"
            location = Location.objects.create(
                name_en=fallback_name,
                name_fa="پایگاه مخفی",
                category=Location.Category.GENERAL,
                difficulty=Location.Difficulty.EASY,
                is_active=True,
            )

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
        get_spy_state(session, SpyGameState.Status.ROLE_REVEAL)
        states = SpyPlayerState.objects.filter(
            session=session,
            role_revealed=False
        )

        return [state.player for state in states]

    @staticmethod
    @transaction.atomic
    def reveal_role(session, player_id):
        spy_game = SpyGameState.objects.select_for_update().get(session=session)
        if spy_game.status != SpyGameState.Status.ROLE_REVEAL:
            raise InvalidGameState("Roles can only be revealed during ROLE_REVEAL.")

        player_state = SpyPlayerState.objects.select_for_update().filter(
            player_id=player_id,
            player__session=session,
            session=session,
        ).first()
        if player_state is None:
            raise ValidationError("Player does not belong to this session.")

        if player_state.role_revealed:
            raise InvalidGameState("Role has already been revealed.")

        player_state.role_revealed = True
        player_state.save()

        all_revealed = not SpyPlayerState.objects.filter(
            session=session,
            role_revealed=False
        ).exists()

        if all_revealed:
            spy_game.status = SpyGameState.Status.IN_PROGRESS
            spy_game.timer_started_at = None
            spy_game.save(update_fields=["status", "timer_started_at"])

        if player_state.is_spy:
            return {
                "role": "spy",
                "location": None,
                "status": spy_game.status
            }

        return {
            "role": player_state.role_fa,
            "location": spy_game.location.name_fa,
            "status": spy_game.status
        }

class SpyTimerService:
    @staticmethod
    def get_timer_status(session):
        spy_game = get_spy_state(session, SpyGameState.Status.IN_PROGRESS)

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
        spy_game = get_spy_state(session, SpyGameState.Status.IN_PROGRESS)

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
        spy_game = get_spy_state(session, SpyGameState.Status.IN_PROGRESS)

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
        spy_game = get_spy_state(session, SpyGameState.Status.IN_PROGRESS)


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

    @staticmethod
    def start_spy_guess(session):
        spy_game = get_spy_state(session, SpyGameState.Status.IN_PROGRESS)

        if spy_game.timer_started_at:
            delta = timezone.now() - spy_game.timer_started_at
            spy_game.timer_elapsed += int(delta.total_seconds())

        spy_game.timer_started_at = None
        spy_game.status = SpyGameState.Status.SPY_GUESS
        spy_game.save(update_fields=["timer_elapsed", "timer_started_at", "status"])

        return {
            "message": "Status changed to spy guess",
            "status": spy_game.status,
            "timer_duration": spy_game.timer_duration,
            "timer_elapsed": spy_game.timer_elapsed,
            "is_running": False,
        }



class SpyVoteService:

    @staticmethod
    def vote(session, voted_player_ids):
        spy_game = get_spy_state(session, SpyGameState.Status.VOTING)

        selected_ids = set(voted_player_ids)
        if len(selected_ids) != spy_game.spy_count:
            raise ValidationError(f"Exactly {spy_game.spy_count} players must be selected.")

        valid_ids = set(
            Player.objects.filter(id__in=selected_ids, session=session)
            .values_list("id", flat=True)
        )
        if valid_ids != selected_ids:
            raise ValidationError("One or more selected players are not in this session.")

        spy_player_ids = set(
            SpyPlayerState.objects.filter(session=session, is_spy=True)
            .values_list("player_id", flat=True)
        )
        selected_names = list(
            Player.objects.filter(id__in=selected_ids, session=session)
            .order_by("id")
            .values_list("name", flat=True)
        )
        voted_player_label = "، ".join(selected_names)

        if selected_ids == spy_player_ids:
            spy_game.status = SpyGameState.Status.SPY_GUESS
            spy_game.save(update_fields=["status"])
            return {
                "result": "spy_caught",
                "spy_can_guess": True,
                "voted_player": voted_player_label,
                "status": spy_game.status,
                "winner": [],
            }
        else:
            spy_player_ids = list(spy_player_ids)
            spy_game.status = SpyGameState.Status.FINISHED
            spy_game.save(update_fields=["status"])
            session.winner = spy_player_ids
            session.save(update_fields=["winner"])
            return {
                "result": "wrong_vote",
                "spy_can_guess": False,
                "voted_player": voted_player_label,
                "status": spy_game.status,
                "winner": spy_player_ids,
            }


class SpyGuessService:

    @staticmethod
    def guess_location(session, is_correct):
        spy_game = get_spy_state(session, SpyGameState.Status.SPY_GUESS)

        if is_correct:
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
            "correct": is_correct,
            "location": spy_game.location.name_fa,
            "winner": winner_ids,
            "status": spy_game.status,
        }
