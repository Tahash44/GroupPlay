from rest_framework import serializers
from games.models import GameSession


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
