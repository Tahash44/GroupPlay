from django.contrib.auth import authenticate
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User,Friend

class AuthService:

    @staticmethod
    def register(username: str, email: str, password: str, name: str = "") -> dict:
        """Create a new user and return JWT tokens."""

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            name=name,
        )
        return AuthService._generate_tokens(user)

    @staticmethod
    def login(username: str, password: str) -> dict:
        """Authenticate user and return JWT tokens. Raises ValueError on failure."""
        user = authenticate(username=username, password=password)
        if user is None:
            raise ValueError("Invalid credentials.")
        return AuthService._generate_tokens(user)

    @staticmethod
    def refresh(refresh_token: str) -> dict:
        """Return a new access token from a valid refresh token. Raises ValueError on failure."""
        try:
            token = RefreshToken(refresh_token)
            return {"access_token": str(token.access_token)}
        except TokenError:
            raise ValueError("Invalid or expired refresh token.")

    @staticmethod
    def logout(refresh_token: str) -> None:
        """Blacklist the refresh token. Raises ValueError on failure."""
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            raise ValueError("Invalid refresh token.")

    @staticmethod
    def _generate_tokens(user) -> dict:
        """Generate access and refresh tokens for a user."""
        refresh = RefreshToken.for_user(user)
        return {
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
        }


class ProfileService:

    @staticmethod
    def get_profile(user):
        """Return user profile data."""
        return user

    @staticmethod
    def update_profile(user, data: dict):
        """Update username and/or email. Returns updated user."""
        for field, value in data.items():
            setattr(user, field, value)
        user.save()
        return user

    @staticmethod
    def change_password(user, old_password: str, new_password: str) -> None:
        """Change user password. Raises ValueError if old password is wrong."""
        if not user.check_password(old_password):
            raise ValueError("Old password is incorrect.")
        user.set_password(new_password)
        user.save()

class FriendsService:

    @staticmethod
    def get_friends(user):
        return Friend.objects.filter(user=user, is_deleted=False)

    @staticmethod
    def get_friend(pk, user):
        return Friend.objects.filter(pk=pk, user=user, is_deleted=False).first()

    @staticmethod
    def delete_friend(friend):
        friend.is_deleted = True
        friend.save()
