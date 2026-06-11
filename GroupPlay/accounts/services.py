from django.contrib.auth import authenticate
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken


class AuthService:

    @staticmethod
    def register(username: str, email: str, password: str) -> dict:
        """Create a new user and return JWT tokens."""
        from accounts.models import User

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
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