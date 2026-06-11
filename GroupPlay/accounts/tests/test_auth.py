from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class RegisterViewTest(APITestCase):
    """Tests for POST /auth/register/"""

    url = reverse("auth-register")

    def get_payload(self, **overrides):
        data = {
            "username": "john",
            "email": "john@example.com",
            "password": "strongpass123",
        }
        data.update(overrides)
        return data

    def test_register_returns_201_and_tokens(self):
        """Successful registration should return 201 with access and refresh tokens."""
        response = self.client.post(self.url, self.get_payload())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)

    def test_register_creates_user_in_db(self):
        """User should be saved to the database after registration."""
        self.client.post(self.url, self.get_payload())
        self.assertTrue(User.objects.filter(username="john").exists())

    def test_register_duplicate_username_returns_400(self):
        """Registering with an existing username should return 400."""
        self.client.post(self.url, self.get_payload())
        response = self.client.post(self.url, self.get_payload())
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email_returns_400(self):
        """Registering with an existing email should return 400."""
        self.client.post(self.url, self.get_payload())
        response = self.client.post(
            self.url, self.get_payload(username="john2")
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password_returns_400(self):
        """Password shorter than 8 characters should return 400."""
        response = self.client.post(self.url, self.get_payload(password="123"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_fields_returns_400(self):
        """Missing required fields should return 400."""
        response = self.client.post(self.url, {"username": "john"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginViewTest(APITestCase):
    """Tests for POST /auth/login/"""

    url = reverse("auth-login")

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            email="john@example.com",
            password="strongpass123",
        )

    def test_login_returns_200_and_tokens(self):
        """Valid credentials should return 200 with tokens."""
        response = self.client.post(
            self.url, {"username": "john", "password": "strongpass123"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)

    def test_login_wrong_password_returns_401(self):
        """Wrong password should return 401."""
        response = self.client.post(
            self.url, {"username": "john", "password": "wrongpass"}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user_returns_401(self):
        """Non-existent username should return 401."""
        response = self.client.post(
            self.url, {"username": "ghost", "password": "strongpass123"}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_fields_returns_400(self):
        """Missing fields should return 400."""
        response = self.client.post(self.url, {"username": "john"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TokenRefreshViewTest(APITestCase):
    """Tests for POST /auth/token/refresh/"""

    url = reverse("auth-token-refresh")

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            password="strongpass123",
        )
        login_response = self.client.post(
            reverse("auth-login"),
            {"username": "john", "password": "strongpass123"},
        )
        self.refresh_token = login_response.data["refresh_token"]

    def test_refresh_returns_200_and_access_token(self):
        """Valid refresh token should return a new access token."""
        response = self.client.post(self.url, {"refresh_token": self.refresh_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.data)

    def test_refresh_invalid_token_returns_401(self):
        """Invalid refresh token should return 401."""
        response = self.client.post(self.url, {"refresh_token": "invalid.token.here"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_missing_token_returns_400(self):
        """Missing refresh_token field should return 400."""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutViewTest(APITestCase):
    """Tests for POST /auth/logout/"""

    url = reverse("auth-logout")

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            password="strongpass123",
        )
        login_response = self.client.post(
            reverse("auth-login"),
            {"username": "john", "password": "strongpass123"},
        )
        self.access_token = login_response.data["access_token"]
        self.refresh_token = login_response.data["refresh_token"]
        # Authenticate the client with the access token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

    def test_logout_returns_200(self):
        """Valid logout should return 200."""
        response = self.client.post(self.url, {"refresh_token": self.refresh_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_blacklists_refresh_token(self):
        """After logout, the same refresh token should not work for refresh."""
        self.client.post(self.url, {"refresh_token": self.refresh_token})
        refresh_response = self.client.post(
            reverse("auth-token-refresh"),
            {"refresh_token": self.refresh_token},
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_unauthenticated_returns_401(self):
        """Unauthenticated request should return 401."""
        self.client.credentials()  # Remove auth header
        response = self.client.post(self.url, {"refresh_token": self.refresh_token})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_invalid_token_returns_400(self):
        """Invalid refresh token should return 400."""
        response = self.client.post(self.url, {"refresh_token": "invalid.token"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)