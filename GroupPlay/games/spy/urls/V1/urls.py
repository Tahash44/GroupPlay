from django.urls import path
from games.spy.views import (SpySessionCreateView, SpySessionDetailView ,
                             SpySessionRevealView , SpySessionTimerView ,
                             SpySessionTimerPauseView , SpySessionTimerResumeView ,
                             SpySessionTimerStopView, SpySessionVoteView, SpySessionGuessView)


urlpatterns = [
    path("sessions/", SpySessionCreateView.as_view(), name="spy-session-create-v1"),
    path("sessions/<int:id>/", SpySessionDetailView.as_view(), name="spy-session-detail-v1"),
    path(
        "sessions/<int:id>/reveal/",
        SpySessionRevealView.as_view(),
        name="spy-session-reveal-v1",
    ),
    path("sessions/<int:id>/timer/", SpySessionTimerView.as_view(), name="spy-session-timer-v1"),

    path(
        "sessions/<int:id>/timer/pause/",
        SpySessionTimerPauseView.as_view(),
        name="spy-session-timer-pause-v1"
    ),

    path(
        "sessions/<int:id>/timer/resume/",
        SpySessionTimerResumeView.as_view(),
        name="spy-session-timer-resume-v1"
    ),

    path(
        "sessions/<int:id>/timer/stop/",
        SpySessionTimerStopView.as_view(),
        name="spy-session-timer-stop-v1"
    ),
path("sessions/<int:id>/vote/", SpySessionVoteView.as_view(), name="spy-session-vote-v1"),
path("sessions/<int:id>/spy-guess/", SpySessionGuessView.as_view(), name="spy-session-spy-guess-v1"),


]
