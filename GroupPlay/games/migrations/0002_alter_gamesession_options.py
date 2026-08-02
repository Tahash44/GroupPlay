from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("games", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="gamesession",
            options={"verbose_name": "نشست بازی", "verbose_name_plural": "نشست‌های بازی"},
        ),
    ]
