from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from accounts.models import AdminAuditLog
from games.models import GameSession
from games.spy.admin_forms import LocationImportForm
from games.spy.management_services import LocationManagementService
from games.spy.models import Location, SpyGameState
from games.spy.services import SpyGameService


User = get_user_model()


class LocationManagementTests(TestCase):
    def setUp(self):
        self.host = User.objects.create_user(username="host", password="pass12345")
        self.admin = User.objects.create_superuser(
            username="owner",
            email="owner@example.com",
            password="pass12345",
        )

    def _finish_game(self, location):
        session = GameSession.objects.create(host=self.host, game_type="spy")
        SpyGameState.objects.create(
            session=session,
            location=location,
            spy_count=1,
            status=SpyGameState.Status.FINISHED,
        )
        return session

    def test_inactive_and_archived_locations_are_never_selected(self):
        active = Location.objects.create(name_en="Park", name_fa="پارک")
        Location.objects.create(name_en="Bank", name_fa="بانک", is_active=False)
        Location.objects.create(
            name_en="Port",
            name_fa="بندر",
            is_active=False,
            archived_at=timezone.now(),
        )
        self.assertEqual(SpyGameService._select_location(self.host), active)

    def test_recent_location_is_avoided_when_an_alternative_exists(self):
        recent = Location.objects.create(name_en="Hospital", name_fa="بیمارستان")
        alternative = Location.objects.create(name_en="School", name_fa="مدرسه")
        self._finish_game(recent)
        self.assertEqual(SpyGameService._select_location(self.host), alternative)

    def test_recent_rule_relaxes_when_pool_is_small(self):
        only_location = Location.objects.create(name_en="Cinema", name_fa="سینما")
        self._finish_game(only_location)
        self.assertEqual(SpyGameService._select_location(self.host), only_location)

    def test_archive_is_soft_and_audited(self):
        location = Location.objects.create(name_en="Museum", name_fa="موزه")
        changed = LocationManagementService.archive(
            actor=self.admin,
            locations=Location.objects.filter(pk=location.pk),
            reason="محتوای نامناسب",
        )
        location.refresh_from_db()
        self.assertEqual(changed, 1)
        self.assertFalse(location.is_active)
        self.assertIsNotNone(location.archived_at)
        self.assertTrue(Location.objects.filter(pk=location.pk).exists())
        self.assertTrue(AdminAuditLog.objects.filter(action="location_archived").exists())


class LocationImportTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="owner",
            email="owner@example.com",
            password="pass12345",
        )

    def test_parser_marks_duplicate_and_invalid_rows(self):
        Location.objects.create(name_en="Park", name_fa="پارک")
        content = (
            "name_fa,name_en,category,difficulty,is_active\n"
            "پارک,Park,general,easy,true\n"
            "مدرسه,School,bad-category,easy,true\n"
            "بیمارستان,Hospital,general,hard,true\n"
        ).encode("utf-8")
        upload = SimpleUploadedFile("locations.csv", content, content_type="text/csv")
        form = LocationImportForm(files={"file": upload})
        self.assertTrue(form.is_valid())
        rows = form.parse()
        self.assertTrue(rows[0]["errors"])
        self.assertTrue(rows[1]["errors"])
        self.assertFalse(rows[2]["errors"])

    def test_import_page_creates_only_previewed_valid_rows(self):
        self.client.force_login(self.admin)
        content = (
            "name_fa,name_en,category,difficulty,is_active\n"
            "کتابخانه,Library,general,medium,true\n"
        ).encode("utf-8")
        upload = SimpleUploadedFile("locations.csv", content, content_type="text/csv")
        response = self.client.post(reverse("admin:spy_location_import"), {"file": upload})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "آمادهٔ ثبت")
        self.assertFalse(Location.objects.exists())
        token = response.context["token"]

        response = self.client.post(
            reverse("admin:spy_location_import"),
            {"confirm": "1", "token": token},
        )
        self.assertEqual(response.status_code, 302)
        location = Location.objects.get(name_en="Library")
        self.assertEqual(location.created_by, self.admin)
        self.assertTrue(AdminAuditLog.objects.filter(action="location_imported").exists())
