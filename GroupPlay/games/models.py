from django.conf import settings
from django.db import models


class GameSession(models.Model):
    class GameType(models.TextChoices):
        SPY = "spy"

    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hosted_sessions",
    )
    game_type = models.CharField(max_length=50, choices=GameType.choices)
    winner = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "نشست بازی"
        verbose_name_plural = "نشست‌های بازی"

    def __str__(self):
        game_state = getattr(self, "spy_state", None)
        status = game_state.status if game_state is not None else "UNKNOWN"
        return f"Session #{self.id} ({self.game_type}) - {status}"


class Player(models.Model):
    session = models.ForeignKey(
        GameSession,
        on_delete=models.CASCADE,
        related_name="players",
    )
    friend = models.ForeignKey(
        "accounts.Friend",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="player_entries",
    )
    name = models.CharField(max_length=255)

    def save(self, *args, **kwargs):
        if self.friend is not None:
            self.name = self.friend.name
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} in Session #{self.session_id}"
