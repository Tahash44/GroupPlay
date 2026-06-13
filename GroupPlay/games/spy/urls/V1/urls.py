from django.urls import path
from games.spy.views import SpySessionCreateView

urlpatterns = [
    path("sessions/", SpySessionCreateView.as_view(), name="spy-session-create-v1"),
]
