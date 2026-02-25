from django.contrib import admin
from .models import (
    ScalableTerms,
    ScalableTermType,
    AchievementScalableTerms,
    Achievements,
)


@admin.register(ScalableTermType)
class ScalableTermTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    ordering = ("name",)
    search_fields = ["name"]


@admin.register(ScalableTerms)
class ScalableTermsAdmin(admin.ModelAdmin):
    list_display = ("id", "term_display", "type")
    list_editable = ("term_display",)
    list_filter = ("type",)
    ordering = ("term_display",)
    search_fields = ["term_display"]
    autocomplete_fields = ["type"]


class AchievementScalableTermsInline(admin.TabularInline):
    model = AchievementScalableTerms
    extra = 1
    autocomplete_fields = ["scalable_term"]


@admin.register(Achievements)
class AchievementsAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "deleted")
    search_fields = ["name", "slug"]


@admin.register(AchievementScalableTerms)
class AchievementScalableTermsAdmin(admin.ModelAdmin):
    list_display = ("id", "achievement", "scalable_term")
    list_filter = ("achievement",)
    search_fields = ("achievement__name", "scalable_term__term_display")
    autocomplete_fields = ["achievement", "scalable_term"]
