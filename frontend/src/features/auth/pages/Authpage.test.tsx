import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-router-dom', () => ({
    useParams: vi.fn(),
    useNavigate: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    default: {success: vi.fn(), error: vi.fn()},
}));

vi.mock('../services/authService', () => ({
    authService: {
        login: vi.fn(),
        register: vi.fn(),
        saveTokens: vi.fn(),
        getProfile: vi.fn(),
    },
}));

vi.mock('../../../shared/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

import AuthPage from './AuthPage';
import {authService} from '../services/authService';
import {useAuth} from '../../../shared/context/AuthContext';
import {useParams, useNavigate} from 'react-router-dom';
import toast from 'react-hot-toast';

const mockNavigate = vi.fn();
const mockSetUser = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        setUser: mockSetUser,
        logout: vi.fn(),
    } as any);
});

/**
 * NOTE: AuthPage currently does NOT use React Hook Form + Zod (deliberately
 * postponed). Validation is manual (see the `validate()` function in the
 * component). These tests cover that actual behavior.
 */

describe('AuthPage - login mode', () => {
    beforeEach(() => {
        vi.mocked(useParams).mockReturnValue({mode: undefined} as any);
    });

    it('renders only username and password fields (no email/name)', () => {
        render(<AuthPage/>);

        expect(screen.getByLabelText('نام کاربری')).toBeInTheDocument();
        expect(screen.getByLabelText('رمز عبور')).toBeInTheDocument();
        expect(screen.queryByLabelText('ایمیل')).not.toBeInTheDocument();
    });

    it('shows validation errors for empty fields and does not call authService', async () => {
        const user = userEvent.setup();
        render(<AuthPage/>);

        await user.click(screen.getByRole('button', {name: 'ورود به حساب'}));

        expect(await screen.findByText('نام کاربری الزامیه')).toBeInTheDocument();
        expect(screen.getByText('رمز عبور الزامیه')).toBeInTheDocument();
        expect(authService.login).not.toHaveBeenCalled();
    });

    it('shows a validation error for a too-short username', async () => {
        const user = userEvent.setup();
        render(<AuthPage/>);

        await user.type(screen.getByLabelText('نام کاربری'), 'ab');
        await user.type(screen.getByLabelText('رمز عبور'), 'longenoughpass');
        await user.click(screen.getByRole('button', {name: 'ورود به حساب'}));

        expect(
            await screen.findByText('نام کاربری باید حداقل ۳ کاراکتر باشد')
        ).toBeInTheDocument();
    });

    it('logs in successfully: calls authService, stores tokens, sets user, and navigates', async () => {
        const tokens = {access_token: 'a1', refresh_token: 'r1'};
        const loggedInUser = {id: 1, username: 'arshia_dev', email: 'a@a.com', name: 'آرشیا'};
        vi.mocked(authService.login).mockResolvedValueOnce(tokens);
        vi.mocked(authService.getProfile).mockResolvedValueOnce(loggedInUser);

        const user = userEvent.setup();
        render(<AuthPage/>);

        await user.type(screen.getByLabelText('نام کاربری'), 'arshia_dev');
        await user.type(screen.getByLabelText('رمز عبور'), 'correctpass123');
        await user.click(screen.getByRole('button', {name: 'ورود به حساب'}));

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith({
                username: 'arshia_dev',
                password: 'correctpass123',
            });
        });
        expect(authService.saveTokens).toHaveBeenCalledWith(tokens);
        expect(mockSetUser).toHaveBeenCalledWith(loggedInUser);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {replace: true});
        expect(toast.success).toHaveBeenCalled();
    });

    it('shows the backend error banner for wrong credentials', async () => {
        vi.mocked(authService.login).mockRejectedValueOnce({
            response: {data: {detail: 'نام کاربری یا رمز عبور اشتباه است'}},
        });

        const user = userEvent.setup();
        render(<AuthPage/>);

        await user.type(screen.getByLabelText('نام کاربری'), 'arshia_dev');
        await user.type(screen.getByLabelText('رمز عبور'), 'wrongpassword');
        await user.click(screen.getByRole('button', {name: 'ورود به حساب'}));

        expect(
            await screen.findByRole('alert')
        ).toHaveTextContent('نام کاربری یا رمز عبور اشتباه است');
        expect(toast.error).toHaveBeenCalledWith('نام کاربری یا رمز عبور اشتباه است');
    });

    it('redirects to dashboard immediately if already authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: {id: 1, username: 'x', email: 'x@x.com', name: 'X'},
            isAuthenticated: true,
            isLoading: false,
            setUser: mockSetUser,
            logout: vi.fn(),
        } as any);

        render(<AuthPage/>);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {replace: true});
    });
});

describe('AuthPage - register mode', () => {
    beforeEach(() => {
        vi.mocked(useParams).mockReturnValue({mode: 'register'} as any);
    });

    it('renders username, email, optional display name, and password fields', () => {
        render(<AuthPage/>);

        expect(screen.getByLabelText('نام کاربری')).toBeInTheDocument();
        expect(screen.getByLabelText('ایمیل')).toBeInTheDocument();
        expect(screen.getByLabelText(/نام نمایشی/)).toBeInTheDocument();
        expect(screen.getByLabelText('رمز عبور')).toBeInTheDocument();
    });

    it('shows a validation error for an invalid email', async () => {
        const user = userEvent.setup();
        render(<AuthPage/>);

        await user.type(screen.getByLabelText('نام کاربری'), 'validuser');
        await user.type(screen.getByLabelText('ایمیل'), 'not-an-email');
        await user.type(screen.getByLabelText('رمز عبور'), 'longenoughpass');
        await user.click(screen.getByRole('button', {name: 'ساختن حساب'}));

        expect(await screen.findByText('ایمیل معتبر نیست')).toBeInTheDocument();
        expect(authService.register).not.toHaveBeenCalled();
    });

    it('registers successfully and sends undefined name when display name is left empty', async () => {
        const tokens = {access_token: 'a2', refresh_token: 'r2'};
        const newUser = {id: 2, username: 'newbie', email: 'n@n.com', name: ''};
        vi.mocked(authService.register).mockResolvedValueOnce(tokens);
        vi.mocked(authService.getProfile).mockResolvedValueOnce(newUser);

        const user = userEvent.setup();
        render(<AuthPage/>);

        await user.type(screen.getByLabelText('نام کاربری'), 'newbie');
        await user.type(screen.getByLabelText('ایمیل'), 'n@n.com');
        await user.type(screen.getByLabelText('رمز عبور'), 'somepassword1');
        await user.click(screen.getByRole('button', {name: 'ساختن حساب'}));

        await waitFor(() => {
            expect(authService.register).toHaveBeenCalledWith({
                username: 'newbie',
                email: 'n@n.com',
                password: 'somepassword1',
                name: undefined,
            });
        });
        expect(authService.saveTokens).toHaveBeenCalledWith(tokens);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {replace: true});
    });

    it('shows a field-level backend error for a duplicate username', async () => {
        vi.mocked(authService.register).mockRejectedValueOnce({
            response: {data: {username: ['این نام کاربری قبلاً استفاده شده است']}},
        });

        const user = userEvent.setup();
        render(<AuthPage/>);

        await user.type(screen.getByLabelText('نام کاربری'), 'taken_username');
        await user.type(screen.getByLabelText('ایمیل'), 'x@x.com');
        await user.type(screen.getByLabelText('رمز عبور'), 'somepassword1');
        await user.click(screen.getByRole('button', {name: 'ساختن حساب'}));

        expect(
            await screen.findByText('این نام کاربری قبلاً استفاده شده است')
        ).toBeInTheDocument();
    });
});