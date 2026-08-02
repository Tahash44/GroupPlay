from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_adminauditlog"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="user",
            options={"verbose_name": "کاربر", "verbose_name_plural": "کاربران"},
        ),
    ]
