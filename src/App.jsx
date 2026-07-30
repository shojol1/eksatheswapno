import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Collections from './pages/Collections';
import AddCollection from './pages/AddCollection';
import PendingApprovals from './pages/PendingApprovals';
import DueMembers from './pages/DueMembers';
import Expenses from './pages/Expenses';
import Profits from './pages/Profits';
import Bank from './pages/Bank';
import Members from './pages/Members';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Routes>
      {/* Login Page (no navbar/sidebar) */}
      <Route path="/login" element={<Login />} />

      {/* All other pages with layout */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex flex-col bg-slate-950 transition-colors">
              <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
              <div className="flex flex-1">
                <Sidebar
                  mobileOpen={mobileMenuOpen}
                  onCloseMobile={() => setMobileMenuOpen(false)}
                />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/collections" element={<Collections />} />
                    <Route path="/add-collection" element={<AddCollection />} />
                    <Route path="/pending" element={<PendingApprovals />} />
                    <Route path="/due-members" element={<DueMembers />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/profits" element={<Profits />} />
                    <Route path="/bank" element={<Bank />} />
                    <Route path="/members" element={<Members />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <NavigationProvider>
            <AppLayout />
          </NavigationProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
