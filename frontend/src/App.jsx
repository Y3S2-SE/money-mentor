import './App.css';
import { Provider, useSelector } from 'react-redux';
import { store } from './store/store';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminPage from './pages/AdminPage';
import GroupPage from './pages/Group';
import PlayPage from './pages/PlayPage';
import NotFound from './pages/errors/NotFound';

const AdminRoute = ({ children }) => {
    const { user } = useSelector((state) => state.auth);
    if (!user) return <Navigate to="/auth" />;
    if (user.role !== 'admin') return <Navigate to="/dashboard" />;
    return children;
};

function App() {
    return (
        <Provider store={store}>
            <Router>
                <Toaster
                    position="bottom-center"
                    gutter={7}
                    toastOptions={{
                        duration: 5000,
                        className: 'mm-toast',
                        success: {
                            className: 'mm-toast mm-toast--success',
                            iconTheme: {
                                primary: '#2563eb',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            className: 'mm-toast mm-toast--error',
                        },
                    }}
                />
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route
                        path="/dashboard"
                        element={<PrivateRoute><Dashboard /></PrivateRoute>}
                    />
                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute>
                                <AdminRoute><AdminPage /></AdminRoute>
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/play"
                        element={<PrivateRoute><PlayPage /></PrivateRoute>}
                    />
                    <Route
                        path="/group"
                        element={<PrivateRoute><GroupPage /></PrivateRoute>}
                    />
                    <Route path="*" element={<NotFound/>}/>
                </Routes>
            </Router>
        </Provider>
    );
}

export default App;