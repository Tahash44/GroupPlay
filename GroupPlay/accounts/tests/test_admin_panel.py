from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from accounts.models import AdminAuditLog, Friend
from games.models import GameSession


User = get_user_model()


class AdminAccessTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="regular", password="pass12345")
        self.admin = User.objects.create_superuser(
            username="owner",
            email="owner@example.com",
            password="pass12345",
        )

    def test_regular_user_cannot_open_admin(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("admin:login"), response.url)

    def test_admin_login_page_redirects_to_shared_frontend_login(self):
        response = self.client.get(reverse("admin:login"))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "http://testserver:5173/auth/login")

    def test_superuser_can_open_dashboard(self):
        self.client.force_login(self.admin)
        response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "نمای کلی مدیریت")
        self.assertContains(response, "مدیر owner")
        self.assertContains(response, "تغییر رمز عبور")
        self.assertContains(response, "خروج")
        self.assertContains(response, 'id="nav-sidebar"')
        self.assertNotContains(response, "Recent actions")
        self.assertNotContains(response, "View site")
        self.assertNotContains(response, "افزودن مکان")
        self.assertNotContains(response, "مکان‌های پرکاربرد")

    def test_spy_navigation_opens_a_dedicated_content_dashboard(self):
        self.client.force_login(self.admin)
        response = self.client.get(
            reverse("admin:app_list", kwargs={"app_label": "spy"})
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "بازی جاسوس")
        self.assertContains(response, "افزودن مکان")
        self.assertContains(response, "ورود گروهی")
        self.assertContains(response, "مکان‌های پرکاربرد")

    def test_game_diagnostic_page_is_read_only_and_renderable(self):
        session = GameSession.objects.create(host=self.user, game_type="spy")
        self.client.force_login(self.admin)
        response = self.client.get(
            reverse("admin:games_gamesession_change", args=[session.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "_save")

    def test_suspension_preserves_related_data_and_writes_audit_log(self):
        friend = Friend.objects.create(user=self.user, name="دوست")
        session = GameSession.objects.create(host=self.user, game_type="spy")
        self.client.force_login(self.admin)

        response = self.client.post(
            reverse("admin:accounts_user_suspension", args=[self.user.pk]),
            {"reason": "درخواست بررسی امنیتی"},
        )

        self.assertEqual(response.status_code, 302)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)
        self.assertTrue(Friend.objects.filter(pk=friend.pk).exists())
        self.assertTrue(GameSession.objects.filter(pk=session.pk).exists())
        audit = AdminAuditLog.objects.get(action="user_suspended")
        self.assertEqual(audit.actor, self.admin)
        self.assertEqual(audit.target_id, str(self.user.pk))
        self.assertEqual(audit.reason, "درخواست بررسی امنیتی")

    def test_suspension_requires_reason(self):
        self.client.force_login(self.admin)
        response = self.client.post(
            reverse("admin:accounts_user_suspension", args=[self.user.pk]),
            {"reason": ""},
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)
        self.assertFalse(AdminAuditLog.objects.exists())
