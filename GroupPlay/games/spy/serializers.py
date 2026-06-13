from rest_framework import serializers
from games.models import GameSession, Player
from games.spy.models import SpyGameState, SpyPlayerState

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
    timer_duration = serializers.IntegerField(min_value=60, max_value=3600)
    spy_count = serializers.IntegerField(min_value=1)
    players = PlayerInputSerializer(many=True, min_length=3)

    def validate(self, attrs):
        players_count = len(attrs["players"])
        spy_count = attrs["spy_count"]

        if spy_count >= players_count:
            raise serializers.ValidationError(
                "spy_count must be less than number of players."
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

        spy_player_state = SpyPlayerState.objects.filter(player=obj).first()
        if spy_player_state:

            return spy_player_state.role_fa # یا role_en
        return None

class SpySessionDetailSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    players = serializers.SerializerMethodField()
    winner = serializers.SerializerMethodField()

    class Meta:
        model = GameSession
        fields = ["id", "game_type", "status", "location", "winner", "players"]

    def get_status(self, obj):
        spy_game_state = SpyGameState.objects.filter(session=obj).first()
        if spy_game_state:
            return getattr(spy_game_state, "status", None)
        return None

    def get_location(self, obj):
        spy_game_state = SpyGameState.objects.filter(session=obj).first()
        if spy_game_state and spy_game_state.location:
            return getattr(spy_game_state.location, "name_fa", None) or getattr(
                spy_game_state.location, "name_en", None
            )
        return None

    def get_players(self, obj):
        players = obj.players.all()
        return SpyPlayerDetailSerializer(players, many=True).data

    def get_winner(self, obj):
        spy_game_state = SpyGameState.objects.filter(session=obj).first()
        if spy_game_state and getattr(spy_game_state, "winner", None):
            winner = spy_game_state.winner
            return getattr(winner, "id", winner)
        return None




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
