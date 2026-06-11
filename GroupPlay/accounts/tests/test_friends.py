from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Friend


class FriendViewTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="ali",
            email="ali@example.com",
            password="password123",
        )
        login_res = self.client.post(
            reverse("auth-login"),
            {"username": "ali", "password": "password123"},
        )
        self.token = login_res.data['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.friend = Friend.objects.create(user=self.user, name="Hassan")

        # آدرس‌های URL
        self.list_url = reverse("friend-list-create")
        self.detail_url = reverse("friend-detail", kwargs={"pk": self.friend.pk})


    def test_get_friends_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Hassan")

    def test_create_friend(self):
        data = {"name": "Reza"}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Friend.objects.filter(user=self.user, is_deleted=False).count(), 2)


    def test_get_friend_detail(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Hassan")

    def test_update_friend_name(self):
        data = {"name": "Hassan Updated"}
        response = self.client.put(self.detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.friend.refresh_from_db()
        self.assertEqual(self.friend.name, "Hassan Updated")


    def test_delete_friend_soft(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.friend.refresh_from_db()
        self.assertTrue(self.friend.is_deleted)

        res_list = self.client.get(self.list_url)
        self.assertEqual(len(res_list.data), 0)


    def test_cannot_access_others_friends(self):
        other_user = User.objects.create_user(username="other", password="pass")
        others_friend = Friend.objects.create(user=other_user, name="Secret Friend")

        url = reverse("friend-detail", kwargs={"pk": others_friend.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_access_denied(self):
        self.client.credentials()  # حذف توکن
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
