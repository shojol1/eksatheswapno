import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

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

function PageTransitionWrapper({ children }) {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Trigger smooth loading spinner on route/path change
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {isNavigating && <LoadingSpinner text="পেজ লোড হচ্ছে..." fullScreen={true} />}
      <div key={location.pathname} className="animate-fade-in">
        {children}
      </div>
    </>
  );
}

function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Login Page (no navbar/sidebar) */}
        <Route path="/login" element={<Login />} />

        {/* All other pages with layout */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex flex-col bg-slate-950">
                <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
                <div className="flex flex-1">
                  <Sidebar
                    mobileOpen={mobileMenuOpen}
                    onCloseMobile={() => setMobileMenuOpen(false)}
                  />
                  <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <PageTransitionWrapper>
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
                    </PageTransitionWrapper>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
