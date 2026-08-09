from rest_framework import serializers
from games.models import GameSession, Player
from games.spy.models import SpyGameState, SpyPlayerState
from accounts.models import Friend

class PlayerInputSerializer(serializers.Serializer):
    friend_id = serializers.IntegerField(required=False, allow_null=True)
    name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs.get("friend_id") and not attrs.get("name"):
            raise serializers.ValidationError(
                "Either friend_id or name must be provided."
            )
        return attrs


class SpySessionCreateSerializer(serializers.Serializer):
    timer_duration = serializers.IntegerField(min_value=60, max_value=900)
    spy_count = serializers.IntegerField(min_value=1)
    players = PlayerInputSerializer(many=True, min_length=4)

    def validate(self, attrs):
        players_data = attrs["players"]
        players_count = len(players_data)
        spy_count = attrs["spy_count"]

        max_spy_count = players_count // 3
        if spy_count > max_spy_count:
            raise serializers.ValidationError(
                {"spy_count": "Too many spies for this many players."}
            )

        friend_ids = [p.get("friend_id") for p in players_data if p.get("friend_id") is not None]
        if len(friend_ids) != len(set(friend_ids)):
            raise serializers.ValidationError("Duplicate friend_ids are not allowed.")

        names = [p.get("name").strip().lower() for p in players_data if p.get("name")]
        if len(names) != len(set(names)):
            raise serializers.ValidationError("Duplicate player names are not allowed.")

        request = self.context.get("request")
        if friend_ids and request is not None:
            valid_friend_ids = set(
                Friend.objects.filter(
                    id__in=friend_ids,
                    user=request.user,
                    is_deleted=False,
                ).values_list("id", flat=True)
            )
            if valid_friend_ids != set(friend_ids):
                raise serializers.ValidationError(
                    {"players": "One or more friends are unavailable."}
                )

        return attrs



class SpySessionResponseSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="spy_state.status", read_only=True)

    class Meta:
        model = GameSession
        fields = ["id", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

class SpyPlayerDetailSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = ['id', 'name', 'role']

    def get_role(self, obj):
        if not self.context.get("expose_private_result", False):
            return None

        spy_player_state = SpyPlayerState.objects.filter(player=obj).first()
        if spy_player_state:

            return spy_player_state.role_fa # یا role_en
        return None

class SpySessionDetailSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    players = serializers.SerializerMethodField()
    winner = serializers.SerializerMethodField()
    played_at = serializers.DateTimeField(source="created_at", read_only=True)
    duration_seconds = serializers.SerializerMethodField()
    player_count = serializers.SerializerMethodField()
    winner_side = serializers.SerializerMethodField()
    spy_count = serializers.SerializerMethodField()

    class Meta:
        model = GameSession
        fields = [
            "id", "game_type", "status", "location", "winner", "players",
            "played_at", "duration_seconds", "player_count", "winner_side", "spy_count",
        ]

    def get_spy_count(self, obj):
        spy_game_state = SpyGameState.objects.filter(session=obj).first()
        return spy_game_state.spy_count if spy_game_state else 1
        
    def get_duration_seconds(self, obj):
        spy_game_state = SpyGameState.objects.filter(session=obj).first()
        return spy_game_state.timer_elapsed if spy_game_state else None

    def get_player_count(self, obj):
        return obj.players.count()

    def get_winner_side(self, obj):
        if not self._is_finished(obj):
            return None
        if not obj.winner:
            return None
        spy_player_ids = set(
            SpyPlayerState.objects.filter(session=obj, is_spy=True)
            .values_list("player_id", flat=True)
        )
        return "spy" if set(obj.winner) & spy_player_ids else "civilians"

    def get_status(self, obj):
        spy_game_state = SpyGameState.objects.filter(session=obj).first()
        if spy_game_state:
            return getattr(spy_game_state, "status", None)
        return None

    def get_location(self, obj):
        spy_game_state = SpyGameState.objects.filter(session=obj).first()
        if (
            spy_game_state
            and spy_game_state.status == SpyGameState.Status.FINISHED
            and spy_game_state.location
        ):
            return getattr(spy_game_state.location, "name_fa", None) or getattr(
                spy_game_state.location, "name_en", None
            )
        return None

    def get_players(self, obj):
        players = obj.players.all()
        return SpyPlayerDetailSerializer(
            players,
            many=True,
            context={"expose_private_result": self._is_finished(obj)},
        ).data

    def get_winner(self, obj):
        if self._is_finished(obj) and obj.winner:
            return obj.winner
        return None

    def _is_finished(self, obj):
        spy_game_state = SpyGameState.objects.filter(session=obj).first()
        return bool(
            spy_game_state
            and spy_game_state.status == SpyGameState.Status.FINISHED
        )




class PendingPlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ["id", "name"]


class RevealRoleRequestSerializer(serializers.Serializer):
    player_id = serializers.IntegerField()


class SpyRoleResponseSerializer(serializers.Serializer):
    role = serializers.CharField()
    location = serializers.CharField(allow_null=True)


class CivilianRoleResponseSerializer(serializers.Serializer):
    role = serializers.CharField()
    location = serializers.CharField()

class TimerResponseSerializer(serializers.Serializer):
    timer_duration = serializers.IntegerField()
    timer_elapsed = serializers.IntegerField()
    timer_started_at = serializers.DateTimeField(allow_null=True)
    remaining_time = serializers.IntegerField()
    is_running = serializers.BooleanField()

class TimerPauseResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    timer_duration = serializers.IntegerField()
    timer_elapsed = serializers.IntegerField()
    timer_started_at = serializers.DateTimeField(allow_null=True)
    remaining_time = serializers.IntegerField()
    is_running = serializers.BooleanField()

class TimerResumeResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    timer_duration = serializers.IntegerField()
    timer_elapsed = serializers.IntegerField()
    timer_started_at = serializers.DateTimeField()
    remaining_time = serializers.IntegerField()
    is_running = serializers.BooleanField()


class TimerStopResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    status = serializers.CharField()
    timer_duration = serializers.IntegerField()
    timer_elapsed = serializers.IntegerField()
    is_running = serializers.BooleanField()

class VoteRequestSerializer(serializers.Serializer):
    voted_player_id = serializers.IntegerField(required=False)
    voted_player_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=False
    )

    def validate(self, attrs):
        if "voted_player_ids" not in attrs and "voted_player_id" not in attrs:
            raise serializers.ValidationError("At least one voted player is required.")
        if "voted_player_ids" in attrs and "voted_player_id" in attrs:
            raise serializers.ValidationError("Use only voted_player_ids.")
        return attrs


class VoteResultResponseSerializer(serializers.Serializer):
    result = serializers.CharField()
    spy_can_guess = serializers.BooleanField()
    voted_player = serializers.CharField()
    status = serializers.CharField()
    winner = serializers.ListField(child=serializers.IntegerField())


class SpyGuessRequestSerializer(serializers.Serializer):
    is_correct = serializers.BooleanField()



class GameResultResponseSerializer(serializers.Serializer):
    correct = serializers.BooleanField()
    location = serializers.CharField()
    winner = serializers.ListField(child=serializers.IntegerField())
    status = serializers.CharField()

class SpySessionHistorySerializer(serializers.ModelSerializer):
    played_at = serializers.DateTimeField(source="created_at", read_only=True)
    player_count = serializers.SerializerMethodField()
    winner_side = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = GameSession
        fields = ["id", "game_type", "status", "played_at", "player_count", "winner_side"]

    def get_player_count(self, obj):
        return obj.players.count()

    def get_status(self, obj):
        spy_game_state = SpyGameState.objects.filter(session=obj).first()
        return spy_game_state.status if spy_game_state else None

    def get_winner_side(self, obj):
        if not obj.winner:
            return None
        spy_player_ids = set(
            SpyPlayerState.objects.filter(session=obj, is_spy=True)
            .values_list("player_id", flat=True)
        )
        return "spy" if set(obj.winner) & spy_player_ids else "civilians"
