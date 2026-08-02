import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AdminAuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(max_length=64)),
                ("target_type", models.CharField(max_length=100)),
                ("target_id", models.CharField(max_length=64)),
                ("target_label", models.CharField(max_length=255)),
                ("reason", models.TextField(blank=True)),
                ("before", models.JSONField(blank=True, default=dict)),
                ("after", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("actor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="admin_audit_logs", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "رویداد مدیریتی",
                "verbose_name_plural": "رویدادهای مدیریتی",
                "ordering": ("-created_at",),
            },
        ),
    ]
