from django.test import TestCase

from accounts.models import User, Friend


class UserModelTest(TestCase):
    """Tests for the User model"""

    def setUp(self):
        # Creates a sample user before each test
        self.user = User.objects.create_user(
            username="john",
            password="pass1234",
            name="John Doe",
        )

    def test_user_created_successfully(self):
        """User should be created successfully"""
        self.assertEqual(User.objects.count(), 1)

    def test_user_str(self):
        """__str__ should return the username"""
        self.assertEqual(str(self.user), "john")

    def test_user_name_field(self):
        """name field should be saved correctly"""
        self.assertEqual(self.user.name, "John Doe")

    def test_user_name_blank_by_default(self):
        """name field should be allowed to be blank"""
        user = User.objects.create_user(username="jane", password="pass1234")
        self.assertEqual(user.name, "")


class FriendModelTest(TestCase):
    """Tests for the Friend model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="john",
            password="pass1234",
        )
        self.friend = Friend.objects.create(
            user=self.user,
            name="Sarah",
        )

    def test_friend_created_successfully(self):
        """Friend should be created successfully"""
        self.assertEqual(Friend.objects.count(), 1)

    def test_friend_str(self):
        """__str__ should show the friend name and owner username"""
        self.assertEqual(str(self.friend), "Sarah (friend of john)")

    def test_friend_is_deleted_default_false(self):
        """is_deleted should default to False"""
        self.assertFalse(self.friend.is_deleted)

    def test_friend_soft_delete(self):
        """is_deleted should be settable to True (soft delete)"""
        self.friend.is_deleted = True
        self.friend.save()
        self.assertTrue(Friend.objects.get(pk=self.friend.pk).is_deleted)

    def test_friend_belongs_to_user(self):
        """Friend should be linked to the correct user"""
        self.assertEqual(self.friend.user, self.user)

    def test_user_can_have_multiple_friends(self):
        """A user should be able to have multiple friends"""
        Friend.objects.create(user=self.user, name="Mike")
        Friend.objects.create(user=self.user, name="Emily")
        self.assertEqual(self.user.friends.count(), 3)  # Sarah + Mike + Emily