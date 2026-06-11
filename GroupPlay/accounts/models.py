from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    name = models.CharField(max_length=255, blank=True)

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