import csv
import io

from django import forms

from games.spy.models import Location


class LocationImportForm(forms.Form):
    file = forms.FileField(
        label="فایل مکان‌ها",
        help_text="فایل باید با کدگذاری استاندارد و دارای سطر عنوان باشد.",
    )

    HEADER_ALIASES = {
        "name_fa": ("name_fa", "نام فارسی"),
        "name_en": ("name_en", "نام انگلیسی"),
        "category": ("category", "دسته‌بندی"),
        "difficulty": ("difficulty", "سختی"),
        "is_all_ages": ("is_all_ages", "همه سنین"),
        "is_active": ("is_active", "فعال"),
        "internal_note": ("internal_note", "یادداشت"),
    }

    @staticmethod
    def _read_value(row, key, default=""):
        for alias in LocationImportForm.HEADER_ALIASES[key]:
            if alias in row:
                return (row.get(alias) or "").strip()
        return default

    @staticmethod
    def _parse_bool(value, default):
        if value == "":
            return default
        normalized = value.casefold()
        if normalized in {"1", "true", "yes", "بله", "فعال"}:
            return True
        if normalized in {"0", "false", "no", "خیر", "غیرفعال"}:
            return False
        raise ValueError("مقدار وضعیت معتبر نیست.")

    def parse(self):
        uploaded = self.cleaned_data["file"]
        try:
            text = uploaded.read().decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise forms.ValidationError("کدگذاری فایل باید استاندارد باشد.") from exc

        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            raise forms.ValidationError("فایل فاقد سطر عنوان است.")

        rows = []
        seen_fa = set()
        seen_en = set()
        for line_number, raw in enumerate(reader, start=2):
            errors = []
            name_fa = self._read_value(raw, "name_fa")
            name_en = self._read_value(raw, "name_en")
            category = self._read_value(raw, "category", Location.Category.GENERAL)
            difficulty = self._read_value(raw, "difficulty", Location.Difficulty.MEDIUM)

            if not name_fa:
                errors.append("نام فارسی الزامی است.")
            if not name_en:
                errors.append("نام انگلیسی الزامی است.")
            if category not in Location.Category.values:
                errors.append("دسته‌بندی معتبر نیست.")
            if difficulty not in Location.Difficulty.values:
                errors.append("درجهٔ سختی معتبر نیست.")

            fa_key = name_fa.casefold()
            en_key = name_en.casefold()
            if fa_key in seen_fa or en_key in seen_en:
                errors.append("این مکان در همین فایل تکرار شده است.")
            if name_fa and Location.objects.filter(name_fa__iexact=name_fa).exists():
                errors.append("نام فارسی قبلاً ثبت شده است.")
            if name_en and Location.objects.filter(name_en__iexact=name_en).exists():
                errors.append("نام انگلیسی قبلاً ثبت شده است.")

            try:
                is_all_ages = self._parse_bool(
                    self._read_value(raw, "is_all_ages"), True
                )
                is_active = self._parse_bool(
                    self._read_value(raw, "is_active"), True
                )
            except ValueError as exc:
                errors.append(str(exc))
                is_all_ages = True
                is_active = True

            seen_fa.add(fa_key)
            seen_en.add(en_key)
            rows.append({
                "line": line_number,
                "name_fa": name_fa,
                "name_en": name_en,
                "category": category,
                "difficulty": difficulty,
                "is_all_ages": is_all_ages,
                "is_active": is_active,
                "internal_note": self._read_value(raw, "internal_note"),
                "errors": errors,
            })
        if not rows:
            raise forms.ValidationError("فایل هیچ مکانی ندارد.")
        return rows


class SuspensionReasonForm(forms.Form):
    reason = forms.CharField(
        label="دلیل",
        widget=forms.Textarea(attrs={"rows": 4}),
        min_length=3,
    )
