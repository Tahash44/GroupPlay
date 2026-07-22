import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

// Mock path is resolved relative to this test file, but both PrivateRoute.tsx
// and AppLayout.tsx import the same underlying module, so this single mock
// covers both.
const mockUseAuth = vi.fn();
vi.mock('../shared/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRoutes(initialPath = '/dashboard', layout = true) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path={initialPath}
          element={
            <PrivateRoute layout={layout}>
              <div>Protected Content</div>
            </PrivateRoute>
          }
        />
        <Route path="/auth/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while auth status is being resolved and does not render content or redirect', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    renderWithRoutes();

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to /auth/login when the user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderWithRoutes();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders the protected content when the user is authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderWithRoutes();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('wraps children in AppLayout by default', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderWithRoutes();

    // The app brand text only appears when AppLayout is used as a wrapper.
    expect(screen.getByText('بازی‌گردان')).toBeInTheDocument();
  });

  it('skips the AppLayout wrapper when layout=false', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderWithRoutes('/dashboard', false);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('بازی‌گردان')).not.toBeInTheDocument();
  });
});