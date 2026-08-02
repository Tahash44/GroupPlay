from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    name = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"

    def __str__(self):
        return self.username


class Friend(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="friends",
    )
    name = models.CharField(max_length=255)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} (friend of {self.user.username})"


class AdminAuditLog(models.Model):
    actor = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="admin_audit_logs",
    )
    action = models.CharField(max_length=64)
    target_type = models.CharField(max_length=100)
    target_id = models.CharField(max_length=64)
    target_label = models.CharField(max_length=255)
    reason = models.TextField(blank=True)
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "رویداد مدیریتی"
        verbose_name_plural = "رویدادهای مدیریتی"

    def __str__(self):
        return f"{self.actor} - {self.action} - {self.target_label}"
