import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FriendsPage from './FriendsPage';
import { friendsService } from '../services/friendsService';

vi.mock('../services/friendsService');
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockedFriendsService = vi.mocked(friendsService, true);

const sampleFriends = [
  { id: 1, name: 'مریم احمدی' },
  { id: 2, name: 'علی رضایی' },
  { id: 3, name: 'سارا محمدی' },
];

// دکمه‌ی «افزودن» بالای صفحه رو از دکمه‌ی «افزودن» داخل مودال جدا می‌کنه
function getHeaderAddButton() {
  return screen.getByRole('button', { name: 'افزودن' });
}

function getModal(title: string) {
  const heading = screen.getByText(title);
  return within(heading.closest('.friend-modal-sheet') as HTMLElement);
}

describe('FriendsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFriendsService.getFriends.mockResolvedValue([...sampleFriends]);
  });

  it('renders the friends list after loading', async () => {
    render(<FriendsPage />);

    expect(await screen.findByText('مریم احمدی')).toBeInTheDocument();
    expect(screen.getByText('علی رضایی')).toBeInTheDocument();
    expect(screen.getByText('سارا محمدی')).toBeInTheDocument();
    expect(mockedFriendsService.getFriends).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when there are no friends', async () => {
    mockedFriendsService.getFriends.mockResolvedValue([]);
    render(<FriendsPage />);

    expect(await screen.findByText('هنوز دوستی اضافه نکردی')).toBeInTheDocument();
  });

  it('shows a load-error message if fetching fails', async () => {
    mockedFriendsService.getFriends.mockRejectedValue(new Error('network error'));
    render(<FriendsPage />);

    expect(await screen.findByText('دریافت لیست دوستان با خطا مواجه شد')).toBeInTheDocument();
  });

  it('filters the list locally as the user types, without calling the API again', async () => {
    const user = userEvent.setup();
    render(<FriendsPage />);
    await screen.findByText('مریم احمدی');

    await user.type(screen.getByPlaceholderText('جستجوی دوستان...'), 'علی');

    expect(screen.getByText('علی رضایی')).toBeInTheDocument();
    expect(screen.queryByText('مریم احمدی')).not.toBeInTheDocument();
    expect(screen.queryByText('سارا محمدی')).not.toBeInTheDocument();

    expect(mockedFriendsService.getFriends).toHaveBeenCalledTimes(1);
  });

  it('shows the empty-search state (not the empty-list state) when nothing matches', async () => {
    const user = userEvent.setup();
    render(<FriendsPage />);
    await screen.findByText('مریم احمدی');

    await user.type(screen.getByPlaceholderText('جستجوی دوستان...'), 'ناموجود');

    expect(await screen.findByText('دوستی با این نام پیدا نشد')).toBeInTheDocument();
  });

  describe('add friend', () => {
    it('shows a validation message and does not call the API when the name is empty', async () => {
      const user = userEvent.setup();
      render(<FriendsPage />);
      await screen.findByText('مریم احمدی');

      await user.click(getHeaderAddButton());
      const modal = getModal('افزودن دوست جدید');
      await user.click(modal.getByRole('button', { name: 'افزودن' }));

      expect(await modal.findByText('نام دوست را وارد کنید')).toBeInTheDocument();
      expect(mockedFriendsService.addFriend).not.toHaveBeenCalled();
    });

    it('adds a friend and reflects it in the list without a full reload', async () => {
      const user = userEvent.setup();
      mockedFriendsService.addFriend.mockResolvedValue({ id: 4, name: 'نگار کریمی' });

      render(<FriendsPage />);
      await screen.findByText('مریم احمدی');

      await user.click(getHeaderAddButton());
      const modal = getModal('افزودن دوست جدید');
      await user.type(modal.getByPlaceholderText('نام دوست...'), 'نگار کریمی');
      await user.click(modal.getByRole('button', { name: 'افزودن' }));

      expect(await screen.findByText('نگار کریمی')).toBeInTheDocument();
      expect(mockedFriendsService.addFriend).toHaveBeenCalledWith({ name: 'نگار کریمی' });
      expect(mockedFriendsService.getFriends).toHaveBeenCalledTimes(1);
    });

    it('shows a Persian error message on a 400 response from the server', async () => {
      const user = userEvent.setup();
      mockedFriendsService.addFriend.mockRejectedValue({
        response: { status: 400, data: { name: ['This field may not be blank.'] } },
      });

      render(<FriendsPage />);
      await screen.findByText('مریم احمدی');

      await user.click(getHeaderAddButton());
      const modal = getModal('افزودن دوست جدید');
      await user.type(modal.getByPlaceholderText('نام دوست...'), 'X');
      await user.click(modal.getByRole('button', { name: 'افزودن' }));

      expect(
        await modal.findByText('نام واردشده معتبر نیست، دوباره تلاش کنید'),
      ).toBeInTheDocument();
    });
  });

  describe('edit friend', () => {
    it('updates a friend and reflects the new name in the list', async () => {
      const user = userEvent.setup();
      mockedFriendsService.updateFriend.mockResolvedValue({ id: 1, name: 'مریم احمدی جدید' });

      render(<FriendsPage />);
      await screen.findByText('مریم احمدی');

      await user.click(screen.getByRole('button', { name: 'ویرایش مریم احمدی' }));
      const modal = getModal('ویرایش دوست');

      const input = modal.getByDisplayValue('مریم احمدی');
      await user.clear(input);
      await user.type(input, 'مریم احمدی جدید');
      await user.click(modal.getByRole('button', { name: 'ذخیره تغییرات' }));

      expect(await screen.findByText('مریم احمدی جدید')).toBeInTheDocument();
      expect(mockedFriendsService.updateFriend).toHaveBeenCalledWith(1, {
        name: 'مریم احمدی جدید',
      });
    });

    it('shows a Persian message on a 404 (friend already deleted elsewhere)', async () => {
      const user = userEvent.setup();
      mockedFriendsService.updateFriend.mockRejectedValue({
        response: { status: 404, data: { detail: 'Friend not found.' } },
      });

      render(<FriendsPage />);
      await screen.findByText('مریم احمدی');

      await user.click(screen.getByRole('button', { name: 'ویرایش مریم احمدی' }));
      const modal = getModal('ویرایش دوست');
      await user.click(modal.getByRole('button', { name: 'ذخیره تغییرات' }));

      expect(
        await modal.findByText('این دوست دیگر وجود ندارد (شاید حذف شده)'),
      ).toBeInTheDocument();
    });
  });

  describe('delete friend', () => {
    it('asks for confirmation before deleting', async () => {
      const user = userEvent.setup();
      render(<FriendsPage />);
      await screen.findByText('مریم احمدی');

      await user.click(screen.getByRole('button', { name: 'حذف مریم احمدی' }));

      expect(await screen.findByText('حذف دوست')).toBeInTheDocument();
      expect(mockedFriendsService.deleteFriend).not.toHaveBeenCalled();
    });

    it('deletes the friend after confirmation and removes it from the list', async () => {
      const user = userEvent.setup();
      mockedFriendsService.deleteFriend.mockResolvedValue(undefined);

      render(<FriendsPage />);
      await screen.findByText('مریم احمدی');

      await user.click(screen.getByRole('button', { name: 'حذف مریم احمدی' }));
      const modal = getModal('حذف دوست');
      await user.click(modal.getByRole('button', { name: 'حذف کن' }));

      expect(mockedFriendsService.deleteFriend).toHaveBeenCalledWith(1);
      expect(screen.queryByText('مریم احمدی')).not.toBeInTheDocument();
    });

    it('does not delete anything when cancelled', async () => {
      const user = userEvent.setup();
      render(<FriendsPage />);
      await screen.findByText('مریم احمدی');

      await user.click(screen.getByRole('button', { name: 'حذف مریم احمدی' }));
      const modal = getModal('حذف دوست');
      await user.click(modal.getByRole('button', { name: 'انصراف' }));

      expect(mockedFriendsService.deleteFriend).not.toHaveBeenCalled();
      expect(screen.getByText('مریم احمدی')).toBeInTheDocument();
    });
  });
});