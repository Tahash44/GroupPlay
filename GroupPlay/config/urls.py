from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from games.spy.views import SpySessionCreateView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls.V1.auth_urls")),
    path("api/v1/friends/", include("accounts.urls.V1.friends_urls")),
    path("api/v1/games/spy/", include("games.spy.urls.V1.urls")),

    # Swagger
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
