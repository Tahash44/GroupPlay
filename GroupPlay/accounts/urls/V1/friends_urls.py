from django.urls import path
from accounts.views import FriendListCreateAPIView, FriendDetailAPIView

urlpatterns = [
    path('', FriendListCreateAPIView.as_view(), name='friend-list-create'),
    path('<int:pk>/', FriendDetailAPIView.as_view(), name='friend-detail'),
]
