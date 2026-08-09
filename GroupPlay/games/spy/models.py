from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from games.models import GameSession, Player


class Location(models.Model):
    class Category(models.TextChoices):
        GENERAL = "general", "عمومی"
        TRAVEL = "travel", "سفر"
        JOB = "job", "شغل"
        LEISURE = "leisure", "تفریح"
        URBAN = "urban", "مکان شهری"

    class Difficulty(models.TextChoices):
        EASY = "easy", "آسان"
        MEDIUM = "medium", "متوسط"
        HARD = "hard", "سخت"

    name_en = models.CharField(max_length=255, unique=True)
    name_fa = models.CharField(max_length=255)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL,
        db_index=True,
    )
    difficulty = models.CharField(
        max_length=20,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM,
        db_index=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_all_ages = models.BooleanField(default=True)
    internal_note = models.TextField(blank=True)
    archived_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_spy_locations",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_spy_locations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name_fa", "name_en")
        verbose_name = "مکان جاسوس"
        verbose_name_plural = "مکان‌های جاسوس"

    def clean(self):
        super().clean()
        duplicate_fa = Location.objects.filter(name_fa__iexact=self.name_fa.strip())
        if self.pk:
            duplicate_fa = duplicate_fa.exclude(pk=self.pk)
        if duplicate_fa.exists():
            raise ValidationError({"name_fa": "مکانی با این نام فارسی قبلاً ثبت شده است."})

        duplicate_en = Location.objects.filter(name_en__iexact=self.name_en.strip())
        if self.pk:
            duplicate_en = duplicate_en.exclude(pk=self.pk)
        if duplicate_en.exists():
            raise ValidationError({"name_en": "مکانی با این نام انگلیسی قبلاً ثبت شده است."})

    def save(self, *args, **kwargs):
        self.name_fa = self.name_fa.strip()
        self.name_en = self.name_en.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name_en} | {self.name_fa}"


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

    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="games",
    )

    spy_count = models.IntegerField()

    timer_started_at = models.DateTimeField(null=True, blank=True)
    timer_elapsed = models.IntegerField(default=0)
    timer_duration = models.IntegerField(default=300)

    def __str__(self):
        return f"SpyState for Session #{self.session_id}"


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

    is_spy = models.BooleanField(default=False)

    role_en = models.CharField(max_length=255)
    role_fa = models.CharField(max_length=255)

    role_revealed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.player.name} — {'spy' if self.is_spy else 'civilian'}"
