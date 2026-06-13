from django.urls import path
from games.spy.views import SpySessionCreateView, SpySessionDetailView , SpySessionRevealView
urlpatterns = [
    path("sessions/", SpySessionCreateView.as_view(), name="spy-session-create-v1"),
    path("sessions/<int:id>/", SpySessionDetailView.as_view(), name="spy-session-detail-v1"),
    path(
        "sessions/<int:id>/reveal/",
        SpySessionRevealView.as_view(),
        name="spy-session-reveal-v1",
    ),

]
