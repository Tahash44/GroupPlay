from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.core import signing
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count, Max, Q
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils import timezone

from accounts.management_services import AdminAuditService, AdminUserService
from accounts.models import AdminAuditLog
from games.models import GameSession
from games.spy.admin_forms import LocationImportForm, SuspensionReasonForm
from games.spy.management_services import LocationManagementService
from games.spy.models import Location, SpyGameState


class BaziGardanAdminSite(admin.AdminSite):
    site_header = "مدیریت بازی‌گردان"
    site_title = "بازی‌گردان"
    index_title = "نمای کلی"
    index_template = "admin/dashboard.html"

    def has_permission(self, request):
        return request.user.is_active and request.user.is_superuser

    def login(self, request, extra_context=None):
        if self.has_permission(request):
            return HttpResponseRedirect(reverse("admin:index"))
        host = request.get_host().split(":", 1)[0]
        return HttpResponseRedirect(f"{request.scheme}://{host}:5173/auth/login")

    def index(self, request, extra_context=None):
        now = timezone.now()
        stalled_before = now - timezone.timedelta(hours=1)
        unfinished = SpyGameState.objects.exclude(status=SpyGameState.Status.FINISHED)
        context = {
            "user_count": get_user_model().objects.count(),
            "suspended_count": get_user_model().objects.filter(is_active=False).count(),
            "games_today": GameSession.objects.filter(created_at__date=timezone.localdate()).count(),
            "stalled_count": unfinished.filter(session__created_at__lt=stalled_before).count(),
            "recent_games": GameSession.objects.select_related("host", "spy_state")
            .prefetch_related("players")
            .order_by("-created_at")[:8],
            "recent_users": get_user_model().objects.annotate(
                friend_count=Count(
                    "friends",
                    filter=Q(friends__is_deleted=False),
                    distinct=True,
                ),
                game_count=Count("hosted_sessions", distinct=True),
            ).order_by("-date_joined")[:6],
        }
        if extra_context:
            context.update(extra_context)
        return super().index(request, context)

    def app_index(self, request, app_label, extra_context=None):
        if app_label != "spy":
            return super().app_index(request, app_label, extra_context)

        locations = Location.objects.annotate(
            usage_count=Count("games"),
            last_used_at=Max("games__session__created_at"),
        )
        context = {
            **self.each_context(request),
            "title": "مدیریت بازی جاسوس",
            "app_label": app_label,
            "app_list": self.get_app_list(request, app_label),
            "active_location_count": locations.filter(
                is_active=True,
                archived_at__isnull=True,
            ).count(),
            "inactive_location_count": locations.filter(
                is_active=False,
                archived_at__isnull=True,
            ).count(),
            "archived_location_count": locations.filter(
                archived_at__isnull=False,
            ).count(),
            "total_location_count": locations.count(),
            "popular_locations": locations.order_by(
                "-usage_count", "name_fa"
            )[:8],
            "recent_locations": locations.order_by("-created_at")[:8],
        }
        if extra_context:
            context.update(extra_context)
        request.current_app = self.name
        return TemplateResponse(request, "admin/spy/index.html", context)


admin_site = BaziGardanAdminSite(name="admin")


class UserAdmin(BaseUserAdmin):
    change_form_template = "admin/accounts/user/change_form.html"
    list_display = (
        "username",
        "name",
        "account_status",
        "last_login",
        "friend_count",
        "game_count",
    )
    list_filter = ("is_active", "date_joined", "last_login")
    search_fields = ("username", "name", "email")
    ordering = ("-date_joined",)
    actions = None
    fieldsets = (
        ("مشخصات", {"fields": ("username", "name", "email")}),
        ("وضعیت", {"fields": ("is_active", "last_login", "date_joined")}),
        ("آمار", {"fields": ("friend_count_detail", "game_count_detail")}),
    )
    readonly_fields = (
        "username",
        "name",
        "email",
        "is_active",
        "last_login",
        "date_joined",
        "friend_count_detail",
        "game_count_detail",
    )

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _friend_count=Count("friends", filter=Q(friends__is_deleted=False), distinct=True),
            _game_count=Count("hosted_sessions", distinct=True),
        )

    @admin.display(description="وضعیت", ordering="is_active", boolean=True)
    def account_status(self, obj):
        return obj.is_active

    @admin.display(description="دوستان", ordering="_friend_count")
    def friend_count(self, obj):
        return obj._friend_count

    @admin.display(description="بازی‌ها", ordering="_game_count")
    def game_count(self, obj):
        return obj._game_count

    @admin.display(description="تعداد دوستان")
    def friend_count_detail(self, obj):
        return obj.friends.filter(is_deleted=False).count()

    @admin.display(description="تعداد بازی‌ها")
    def game_count_detail(self, obj):
        return obj.hosted_sessions.count()

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_urls(self):
        return [
            path(
                "<path:object_id>/suspension/",
                self.admin_site.admin_view(self.suspension_view),
                name="accounts_user_suspension",
            ),
        ] + super().get_urls()

    def change_view(self, request, object_id, form_url="", extra_context=None):
        user = self.get_object(request, object_id)
        context = {
            "suspension_url": reverse(
                "admin:accounts_user_suspension", args=[object_id]
            ),
            "can_suspend": bool(user and not user.is_superuser),
        }
        if extra_context:
            context.update(extra_context)
        return super().change_view(request, object_id, form_url, context)

    def suspension_view(self, request, object_id):
        user = get_object_or_404(get_user_model(), pk=object_id)
        if user.is_superuser:
            self.message_user(request, "حساب مدیر کل قابل تعلیق نیست.", messages.ERROR)
            return HttpResponseRedirect(reverse("admin:accounts_user_change", args=[object_id]))

        form = SuspensionReasonForm(request.POST or None)
        if request.method == "POST" and form.is_valid():
            try:
                AdminUserService.set_suspension(
                    actor=request.user,
                    user_id=user.pk,
                    suspended=user.is_active,
                    reason=form.cleaned_data["reason"],
                )
            except ValueError as exc:
                form.add_error(None, str(exc))
            else:
                self.message_user(request, "وضعیت حساب با موفقیت تغییر کرد.", messages.SUCCESS)
                return HttpResponseRedirect(reverse("admin:accounts_user_change", args=[object_id]))

        return render(request, "admin/accounts/user/suspension.html", {
            **self.admin_site.each_context(request),
            "title": "تغییر وضعیت حساب",
            "target_user": user,
            "form": form,
            "opts": self.model._meta,
        })


class LocationAdmin(admin.ModelAdmin):
    change_list_template = "admin/spy/location/change_list.html"
    list_display = (
        "name_fa",
        "name_en",
        "category",
        "difficulty",
        "is_active",
        "is_all_ages",
        "is_archived",
        "usage_count",
        "last_used_at",
    )
    list_filter = ("is_active", "category", "difficulty", "is_all_ages", "archived_at")
    search_fields = ("name_fa", "name_en", "internal_note")
    readonly_fields = ("created_by", "updated_by", "created_at", "updated_at", "usage_count", "last_used_at")
    actions = ("activate_locations", "deactivate_locations", "archive_locations", "restore_locations")
    fieldsets = (
        ("نام مکان", {"fields": ("name_fa", "name_en")}),
        ("دسته‌بندی", {"fields": ("category", "difficulty", "is_all_ages")}),
        ("انتشار", {"fields": ("is_active", "archived_at")}),
        ("یادداشت داخلی", {"fields": ("internal_note",)}),
        ("آمار استفاده", {"fields": ("usage_count", "last_used_at")}),
        ("تاریخچه", {"fields": ("created_by", "updated_by", "created_at", "updated_at")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _usage_count=Count("games"),
            _last_used_at=Max("games__session__created_at"),
        )

    @admin.display(description="بایگانی‌شده", boolean=True, ordering="archived_at")
    def is_archived(self, obj):
        return obj.archived_at is not None

    @admin.display(description="دفعات استفاده", ordering="_usage_count")
    def usage_count(self, obj):
        if hasattr(obj, "_usage_count"):
            return obj._usage_count
        return obj.games.count()

    @admin.display(description="آخرین استفاده", ordering="_last_used_at")
    def last_used_at(self, obj):
        if hasattr(obj, "_last_used_at"):
            return obj._last_used_at
        return obj.games.aggregate(value=Max("session__created_at"))["value"]

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        before = {}
        if change:
            previous = Location.objects.get(pk=obj.pk)
            before = {field: getattr(previous, field) for field in form.changed_data}
        if not obj.created_by_id:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
        after = {field: getattr(obj, field) for field in form.changed_data}
        AdminAuditService.record(
            actor=request.user,
            action="location_updated" if change else "location_created",
            target=obj,
            before=before,
            after=after,
        )

    @admin.action(description="فعال‌کردن مکان‌های انتخاب‌شده")
    def activate_locations(self, request, queryset):
        count = LocationManagementService.set_active(actor=request.user, locations=queryset, active=True)
        self.message_user(request, f"{count} مکان فعال شد.", messages.SUCCESS)

    @admin.action(description="غیرفعال‌کردن مکان‌های انتخاب‌شده")
    def deactivate_locations(self, request, queryset):
        if "confirm_action" not in request.POST:
            return self._confirm_location_action(
                request,
                queryset,
                title="غیرفعال‌کردن مکان‌ها",
                warning="مکان‌های غیرفعال در بازی‌های جدید انتخاب نمی‌شوند.",
            )
        count = LocationManagementService.set_active(actor=request.user, locations=queryset, active=False)
        self.message_user(request, f"{count} مکان غیرفعال شد.", messages.SUCCESS)

    @admin.action(description="بایگانی مکان‌های انتخاب‌شده")
    def archive_locations(self, request, queryset):
        if "confirm_action" not in request.POST:
            return self._confirm_location_action(
                request,
                queryset,
                title="بایگانی مکان‌ها",
                warning="مکان‌های بایگانی‌شده غیرفعال می‌شوند اما سابقهٔ بازی‌های قبلی حفظ خواهد شد.",
            )
        count = LocationManagementService.archive(actor=request.user, locations=queryset)
        self.message_user(request, f"{count} مکان بایگانی شد.", messages.SUCCESS)

    @admin.action(description="بازیابی مکان‌های انتخاب‌شده")
    def restore_locations(self, request, queryset):
        count = LocationManagementService.restore(actor=request.user, locations=queryset)
        self.message_user(request, f"{count} مکان بازیابی شد.", messages.SUCCESS)

    def get_urls(self):
        return [
            path(
                "import/",
                self.admin_site.admin_view(self.import_view),
                name="spy_location_import",
            ),
        ] + super().get_urls()

    def _confirm_location_action(self, request, queryset, *, title, warning):
        return render(request, "admin/spy/location/action_confirmation.html", {
            **self.admin_site.each_context(request),
            "title": title,
            "warning": warning,
            "objects": queryset,
            "action_name": request.POST.get("action"),
            "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
            "opts": self.model._meta,
        })

    def import_view(self, request):
        form = LocationImportForm(request.POST or None, request.FILES or None)
        rows = None
        token = None
        if request.method == "POST" and "confirm" in request.POST:
            try:
                rows = signing.loads(request.POST.get("token", ""), salt="location-import", max_age=1800)
            except signing.BadSignature:
                form.add_error(None, "پیش‌نمایش منقضی یا نامعتبر است. فایل را دوباره بارگذاری کنید.")
            else:
                created = self._commit_import(request, rows)
                self.message_user(request, f"{created} مکان با موفقیت ثبت شد.", messages.SUCCESS)
                return HttpResponseRedirect(reverse("admin:spy_location_changelist"))
        elif request.method == "POST" and form.is_valid():
            try:
                rows = form.parse()
            except ValidationError as exc:
                form.add_error("file", exc)
            else:
                valid_rows = [{k: v for k, v in row.items() if k not in {"line", "errors"}} for row in rows if not row["errors"]]
                token = signing.dumps(valid_rows, salt="location-import") if valid_rows else None

        return render(request, "admin/spy/location/import.html", {
            **self.admin_site.each_context(request),
            "title": "ورود گروهی مکان‌ها",
            "form": form,
            "rows": rows,
            "token": token,
            "opts": self.model._meta,
        })

    @transaction.atomic
    def _commit_import(self, request, rows):
        created = 0
        for data in rows:
            if Location.objects.filter(
                Q(name_fa__iexact=data["name_fa"]) | Q(name_en__iexact=data["name_en"])
            ).exists():
                continue
            location = Location(**data, created_by=request.user, updated_by=request.user)
            location.full_clean()
            location.save()
            AdminAuditService.record(
                actor=request.user,
                action="location_imported",
                target=location,
                after={"name_fa": location.name_fa, "name_en": location.name_en},
            )
            created += 1
        return created


class GameSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "host", "game_type", "game_status", "player_count", "created_at", "winner")
    list_filter = ("game_type", "created_at", "spy_state__status")
    search_fields = ("host__username", "host__name", "players__name")
    readonly_fields = ("host", "game_type", "winner", "created_at", "game_status", "player_names")
    actions = None

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("host", "spy_state").annotate(_player_count=Count("players"))

    @admin.display(description="وضعیت", ordering="spy_state__status")
    def game_status(self, obj):
        return obj.spy_state.get_status_display() if hasattr(obj, "spy_state") else "نامشخص"

    @admin.display(description="بازیکنان", ordering="_player_count")
    def player_count(self, obj):
        return obj._player_count

    @admin.display(description="نام بازیکنان")
    def player_names(self, obj):
        return "، ".join(obj.players.values_list("name", flat=True))

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser


class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "target_type", "target_label", "reason")
    list_filter = ("action", "target_type", "created_at")
    search_fields = ("actor__username", "target_label", "reason", "target_id")
    readonly_fields = ("actor", "action", "target_type", "target_id", "target_label", "reason", "before", "after", "created_at")
    actions = None

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser


admin_site.register(get_user_model(), UserAdmin)
admin_site.register(Location, LocationAdmin)
admin_site.register(GameSession, GameSessionAdmin)
admin_site.register(AdminAuditLog, AdminAuditLogAdmin)
