import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("spy", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="location",
            name="archived_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="location",
            name="category",
            field=models.CharField(choices=[("general", "عمومی"), ("travel", "سفر"), ("job", "شغل"), ("leisure", "تفریح"), ("urban", "مکان شهری")], db_index=True, default="general", max_length=20),
        ),
        migrations.AddField(
            model_name="location",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AddField(
            model_name="location",
            name="created_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_spy_locations", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="location",
            name="difficulty",
            field=models.CharField(choices=[("easy", "آسان"), ("medium", "متوسط"), ("hard", "سخت")], db_index=True, default="medium", max_length=20),
        ),
        migrations.AddField(
            model_name="location",
            name="internal_note",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="location",
            name="is_active",
            field=models.BooleanField(db_index=True, default=True),
        ),
        migrations.AddField(
            model_name="location",
            name="is_all_ages",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="location",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="location",
            name="updated_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="updated_spy_locations", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterModelOptions(
            name="location",
            options={"ordering": ("name_fa", "name_en"), "verbose_name": "مکان جاسوس", "verbose_name_plural": "مکان‌های جاسوس"},
        ),
    ]
