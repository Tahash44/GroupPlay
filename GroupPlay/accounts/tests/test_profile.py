from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class ProfileViewTest(APITestCase):
    """Tests for GET and PATCH /auth/profile/"""

    url = reverse("auth-profile")

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            email="john@example.com",
            password="strongpass123",
        )
        login = self.client.post(
            reverse("auth-login"),
            {"username": "john", "password": "strongpass123"},
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login.data['access_token']}"
        )

    # --- GET ---

    def test_get_profile_returns_200(self):
        """Authenticated user should get their profile."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_profile_returns_correct_data(self):
        """Profile response should contain id, username, email."""
        response = self.client.get(self.url)
        self.assertEqual(response.data["username"], "john")
        self.assertEqual(response.data["email"], "john@example.com")
        self.assertIn("id", response.data)

    def test_get_profile_unauthenticated_returns_401(self):
        """Unauthenticated request should return 401."""
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- PATCH ---

    def test_update_username_returns_200(self):
        """Updating username should return 200 with updated data."""
        response = self.client.patch(self.url, {"username": "john_updated"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "john_updated")

    def test_update_email_returns_200(self):
        """Updating email should return 200 with updated data."""
        response = self.client.patch(self.url, {"email": "newemail@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "newemail@example.com")

    def test_update_duplicate_username_returns_400(self):
        """Using another user's username should return 400."""
        User.objects.create_user(username="taken", email="taken@example.com", password="pass1234")
        response = self.client.patch(self.url, {"username": "taken"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_duplicate_email_returns_400(self):
        """Using another user's email should return 400."""
        User.objects.create_user(username="other", email="taken@example.com", password="pass1234")
        response = self.client.patch(self.url, {"email": "taken@example.com"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_same_username_is_allowed(self):
        """User should be able to PATCH their own current username without error."""
        response = self.client.patch(self.url, {"username": "john"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_profile_unauthenticated_returns_401(self):
        """Unauthenticated PATCH should return 401."""
        self.client.credentials()
        response = self.client.patch(self.url, {"username": "hacker"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ChangePasswordViewTest(APITestCase):
    """Tests for POST /auth/change-password/"""

    url = reverse("auth-change-password")

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            email="john@example.com",
            password="strongpass123",
        )
        login = self.client.post(
            reverse("auth-login"),
            {"username": "john", "password": "strongpass123"},
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login.data['access_token']}"
        )

    def test_change_password_returns_200(self):
        """Valid password change should return 200."""
        response = self.client.post(
            self.url,
            {"old_password": "strongpass123", "new_password": "newstrongpass456"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_new_password_works_for_login(self):
        """After password change, user should be able to login with new password."""
        self.client.post(
            self.url,
            {"old_password": "strongpass123", "new_password": "newstrongpass456"},
        )
        login = self.client.post(
            reverse("auth-login"),
            {"username": "john", "password": "newstrongpass456"},
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_old_password_no_longer_works(self):
        """After password change, old password should no longer work."""
        self.client.post(
            self.url,
            {"old_password": "strongpass123", "new_password": "newstrongpass456"},
        )
        login = self.client.post(
            reverse("auth-login"),
            {"username": "john", "password": "strongpass123"},
        )
        self.assertEqual(login.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_wrong_old_password_returns_400(self):
        """Wrong old password should return 400."""
        response = self.client.post(
            self.url,
            {"old_password": "wrongpass", "new_password": "newstrongpass456"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_short_new_password_returns_400(self):
        """New password shorter than 8 characters should return 400."""
        response = self.client.post(
            self.url,
            {"old_password": "strongpass123", "new_password": "123"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_fields_returns_400(self):
        """Missing fields should return 400."""
        response = self.client.post(self.url, {"old_password": "strongpass123"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_returns_401(self):
        """Unauthenticated request should return 401."""
        self.client.credentials()
        response = self.client.post(
            self.url,
            {"old_password": "strongpass123", "new_password": "newstrongpass456"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)