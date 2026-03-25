import { useState } from 'react';
import './App.css';
import { Provider, useSelector } from 'react-redux';
import { store } from './store/store';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminPage from './pages/AdminPage';
import GroupPage from './pages/Group';

const AdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/auth" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard"/>;
  return children;
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Login redirect — PrivateRoute sends to /login */}
          <Route path="/login" element={<Navigate to="/auth" replace />} />

          {/* Public */}
          <Route path="/auth" element={<AuthPage />}/>

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path='/admin'
            element={
              <PrivateRoute>
                <AdminPage/>
              </PrivateRoute>
            }
          />
          <Route
            path='/group'
            element={
              <PrivateRoute>
                <GroupPage/>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
