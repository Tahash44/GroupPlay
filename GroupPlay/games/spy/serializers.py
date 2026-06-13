from rest_framework import serializers
from games.models import GameSession


class PlayerInputSerializer(serializers.Serializer):
    friend_id = serializers.IntegerField(required=False, allow_null=True)
    name = serializers.CharField(required=False, allow_blank=True)


class SpySessionCreateSerializer(serializers.Serializer):
    timer_duration = serializers.IntegerField(min_value=60, max_value=3600)
    spy_count = serializers.IntegerField(min_value=1)
    players = PlayerInputSerializer(many=True, min_length=3)  # حداقل ۳ نفر برای بازی


class SpySessionResponseSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='spy_state.status')

    class Meta:
        model = GameSession
        fields = ['id', 'status', 'created_at']
