import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
// import {useAuth} from '../shared/context/AuthContext';
import AuthPage from '../features/auth/pages/AuthPage';
// import AppLayout from '../shared/components/AppLayout/Applayout';
import GamesListPage from '../features/games/pages/GamesListPage';
import GameDetailPage from '../features/games/pages/GameDetailPage';
import ProfilePage from '../features/profile/pages/ProfilePage';
import FriendsPage from '../features/friends/pages/FriendsPage';
import SpyNewGamePage from '../features/games/spy/pages/SpyNewGamePage';
import SpyRoleRevealPage from '../features/games/spy/pages/SpyRoleRevealPage';
import InGamePage from '../features/games/spy/pages/InGamePage';
import SpyVotingPlaceholderPage from '../features/games/spy/pages/VotingPage';
import PrivateRoute from './PrivateRoute';
import HistoryPage from '../features/games/pages/HistoryPage';
import HistoryDetailPage from '../features/games/pages/HistoryDetailPage';
import HelpPage from '../features/help/pages/HelpPage';
import SettingsPage from '../features/settings/pages/SettingsPage';


export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
                <Route path="/auth/:mode" element={<AuthPage/>}/>
                <Route path="/auth" element={<Navigate to="/auth/login" replace/>}/>

                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute allowGuest>
                            <GamesListPage/>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/games/:id"
                    element={
                        <PrivateRoute allowGuest>
                            <GameDetailPage/>
                        </PrivateRoute>
                    }
                />

                {/* صفحه پروفایل */}
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute allowGuest>
                            <ProfilePage/>
                        </PrivateRoute>
                    }
                />
<Route
                   path="/history"
                   element={
                       <PrivateRoute allowGuest>
                           <HistoryPage/>
                       </PrivateRoute>
                   }
               />

               <Route
                   path="/history/:id"
                   element={
                       <PrivateRoute>
                           <HistoryDetailPage/>
                       </PrivateRoute>
                   }
               />
                <Route
                    path="/friends"
                    element={
                        <PrivateRoute allowGuest>
                            <FriendsPage/>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/help"
                    element={
                        <PrivateRoute allowGuest>
                            <HelpPage/>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <PrivateRoute allowGuest>
                            <SettingsPage/>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/games/spy/new"
                    element={
                        <SpyNewGamePage/>
                    }
                />

                <Route path="/games/spy" element={<Navigate to="/games/spy/new" replace/>}/>

                <Route
                    path="/games/spy/sessions/:id/reveal"
                    element={
                        <SpyRoleRevealPage/>
                    }
                />

                <Route
                    path="/games/spy/sessions/:id/play"
                    element={
                        <InGamePage/>
                    }
                />

                <Route
                   path="/games/spy/sessions/:id/vote"
                   element={
                       <SpyVotingPlaceholderPage/>
                   }
               />

                <Route path="*" element={<Navigate to="/auth/login" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}
