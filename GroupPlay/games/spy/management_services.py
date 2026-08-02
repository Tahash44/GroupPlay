from django.db import transaction
from django.utils import timezone

from accounts.management_services import AdminAuditService
from games.spy.models import Location


class LocationManagementService:
    @staticmethod
    @transaction.atomic
    def set_active(*, actor, locations, active, reason=""):
        changed = 0
        for location in locations.select_for_update():
            if location.archived_at is not None and active:
                continue
            if location.is_active == active:
                continue
            before = {"is_active": location.is_active}
            location.is_active = active
            location.updated_by = actor
            location.save(update_fields=["is_active", "updated_by", "updated_at"])
            AdminAuditService.record(
                actor=actor,
                action="location_activated" if active else "location_deactivated",
                target=location,
                reason=reason,
                before=before,
                after={"is_active": active},
            )
            changed += 1
        return changed

    @staticmethod
    @transaction.atomic
    def archive(*, actor, locations, reason=""):
        changed = 0
        for location in locations.select_for_update():
            if location.archived_at is not None:
                continue
            before = {"is_active": location.is_active, "archived_at": None}
            location.is_active = False
            location.archived_at = timezone.now()
            location.updated_by = actor
            location.save(update_fields=["is_active", "archived_at", "updated_by", "updated_at"])
            AdminAuditService.record(
                actor=actor,
                action="location_archived",
                target=location,
                reason=reason,
                before=before,
                after={"is_active": False, "archived_at": location.archived_at.isoformat()},
            )
            changed += 1
        return changed

    @staticmethod
    @transaction.atomic
    def restore(*, actor, locations, reason=""):
        changed = 0
        for location in locations.select_for_update():
            if location.archived_at is None:
                continue
            before = {
                "is_active": location.is_active,
                "archived_at": location.archived_at.isoformat(),
            }
            location.archived_at = None
            location.is_active = True
            location.updated_by = actor
            location.save(update_fields=["is_active", "archived_at", "updated_by", "updated_at"])
            AdminAuditService.record(
                actor=actor,
                action="location_restored",
                target=location,
                reason=reason,
                before=before,
                after={"is_active": True, "archived_at": None},
            )
            changed += 1
        return changed
