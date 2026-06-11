from django.db import models

from games.models import GameSession, Player


class SpyGameState(models.Model):
    class Status(models.TextChoices):
        CREATED = "CREATED"
        ROLE_REVEAL = "ROLE_REVEAL"
        IN_PROGRESS = "IN_PROGRESS"
        VOTING = "VOTING"
        SPY_GUESS = "SPY_GUESS"
        FINISHED = "FINISHED"

    session = models.OneToOneField(
        GameSession,
        on_delete=models.CASCADE,
        related_name="spy_state",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CREATED,
    )
    location = models.CharField(max_length=255)
    spy_count = models.IntegerField()

    timer_started_at = models.DateTimeField(null=True, blank=True)
    timer_elapsed = models.IntegerField(default=0)
    timer_duration = models.IntegerField(default=300)

    def __str__(self):
        return f"SpyState for Session #{self.session_id} — {self.location}"


class SpyPlayerState(models.Model):
    player = models.OneToOneField(
        Player,
        on_delete=models.CASCADE,
        related_name="spy_detail",
    )
    session = models.ForeignKey(
        GameSession,
        on_delete=models.CASCADE,
        related_name="spy_player_states",
    )
    role = models.CharField(max_length=100)
    role_revealed = models.BooleanField(default=False)
    is_spy = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.player.name} — {'spy' if self.is_spy else 'civilian'}"