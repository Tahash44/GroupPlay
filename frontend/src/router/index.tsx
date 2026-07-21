import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {useAuth} from '../shared/context/AuthContext';
import AuthPage from '../features/auth/pages/AuthPage';
import AppLayout from '../shared/components/AppLayout/Applayout';
import GamesListPage from '../features/games/pages/GamesListPage';
import GameDetailPage from '../features/games/pages/GameDetailPage';
import ProfilePage from '../features/profile/pages/ProfilePage';
import FriendsPage from '../features/friends/pages/FriendsPage';
import SpyNewGamePage from '../features/games/spy/pages/SpyNewGamePage';
import SpyRoleRevealPage from '../features/games/spy/pages/SpyRoleRevealPage';
import SpyGamePlaceholderPage from '../features/games/spy/pages/SpyGamePlaceholderPage';

function PrivateRoute({
                          children,
                          layout = true,
                      }: {
    children: React.ReactNode;
    layout?: boolean;
}) {


    const {isAuthenticated, isLoading} = useAuth();

    if (isLoading) {
        return (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
                ...
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/auth/login" replace/>;

return layout ? <AppLayout>{children}</AppLayout> : <>{children}</>;
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/auth/:mode" element={<AuthPage/>}/>
                <Route path="/auth" element={<Navigate to="/auth/login" replace/>}/>

                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <GamesListPage/>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/games/:id"
                    element={
                        <PrivateRoute>
                            <GameDetailPage/>
                        </PrivateRoute>
                    }
                />

                {/* صفحه پروفایل */}
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <ProfilePage/>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/friends"
                    element={
                        <PrivateRoute>
                            <FriendsPage/>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/games/spy/new"
                    element={
                        <PrivateRoute layout={false}>
                            <SpyNewGamePage/>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/games/spy/sessions/:id/reveal"
                    element={
                        <PrivateRoute layout={false}>
                            <SpyRoleRevealPage/>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/games/spy/sessions/:id/play"
                    element={
                        <PrivateRoute layout={false}>
                            <SpyGamePlaceholderPage/>
                        </PrivateRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/auth/login" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}