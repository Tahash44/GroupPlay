from django.contrib.auth import get_user_model
from django.db import transaction

from accounts.models import AdminAuditLog


class AdminAuditService:
    @staticmethod
    def _json_safe(values):
        safe = {}
        for key, value in (values or {}).items():
            if value is None or isinstance(value, (str, int, float, bool)):
                safe[key] = value
            elif hasattr(value, "isoformat"):
                safe[key] = value.isoformat()
            elif hasattr(value, "pk"):
                safe[key] = str(value.pk)
            else:
                safe[key] = str(value)
        return safe

    @staticmethod
    def record(*, actor, action, target, before=None, after=None, reason=""):
        return AdminAuditLog.objects.create(
            actor=actor,
            action=action,
            target_type=target._meta.label_lower,
            target_id=str(target.pk),
            target_label=str(target),
            reason=reason.strip(),
            before=AdminAuditService._json_safe(before),
            after=AdminAuditService._json_safe(after),
        )


class AdminUserService:
    @staticmethod
    @transaction.atomic
    def set_suspension(*, actor, user_id, suspended, reason):
        User = get_user_model()
        user = User.objects.select_for_update().get(pk=user_id)
        if user.is_superuser:
            raise ValueError("حساب مدیر کل را نمی‌توان تعلیق کرد.")
        if not reason.strip():
            raise ValueError("ثبت دلیل برای این عملیات الزامی است.")

        before = {"is_active": user.is_active}
        user.is_active = not suspended
        user.save(update_fields=["is_active"])
        AdminAuditService.record(
            actor=actor,
            action="user_suspended" if suspended else "user_reactivated",
            target=user,
            reason=reason,
            before=before,
            after={"is_active": user.is_active},
        )
        return user
