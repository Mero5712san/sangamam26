import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppShell } from './components/AppShell';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { EventsPage } from './pages/EventsPage';
import { RegistrationsPage } from './pages/RegistrationsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ScannerPage } from './pages/ScannerPage';
import { VolunteersPage } from './pages/VolunteersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CollegeDetailPage } from './pages/CollegeDetailPage';
import { VolunteerRegistrationPage } from './pages/VolunteerRegistrationPage';
import { LogsPage } from './pages/LogsPage';
import { ParticipantApprovalPage } from './pages/ParticipantApprovalPage';
import { ReportsPage } from './pages/ReportsPage';

import { ManageEventPage } from './pages/ManageEventPage';
import { EditEventPage } from './pages/EditEventPage';
import { TeamManagementPage } from './pages/TeamManagementPage';
import { ParticipantDetailPage } from './pages/ParticipantDetailPage';
import { BlockedAccountPage } from './pages/BlockedAccountPage';
import { SupportPage } from './pages/SupportPage';
import { ToastContainer } from './components/ToastContainer';

function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user, refreshUser } = useAuthStore();

  useEffect(() => {
    // Attempt a one-time refresh from stored auth token so assignedEventIds are current
    try {
      const raw = localStorage.getItem('auth-storage');
      const token = raw ? JSON.parse(raw)?.state?.user?.token : null;
      if (token) refreshUser().catch(() => { });
    } catch (e) {
      // ignore parse errors
    }
  }, [refreshUser]);

  const withShell = (page) => <AppShell>{page}</AppShell>;

  // Redirect if blocked
  if (user && (user.status === 'freezed' || user.status === 'disqualified')) {
    return (
      <Router>
        <Routes>
          <Route path="/blocked" element={<BlockedAccountPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="*" element={<Navigate to="/blocked" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <div className="sangamam-theme">
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/events" />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/sangamam/users/volunteers/register-new" element={<VolunteerRegistrationPage />} />

          {/* Protected Routes */}
          <Route
            path="/event/:slug/manage"
            element={
              <ProtectedRoute>
                {withShell(<ManageEventPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:slug/manage/:uuid"
            element={
              <ProtectedRoute>
                {withShell(<ParticipantDetailPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:slug/edit"
            element={
              <ProtectedRoute>
                {withShell(<EditEventPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:slug/team"
            element={
              <ProtectedRoute>
                {withShell(<TeamManagementPage />)}
              </ProtectedRoute>
            }
          />

          {/* Public Events Page, shown in the shell when authenticated */}
          <Route path="/events" element={user ? withShell(<EventsPage embedded />) : <EventsPage />} />
          <Route path="/event/:slug" element={user ? withShell(<EventsPage embedded />) : <EventsPage />} />

          <Route
            path="/registrations"
            element={
              <ProtectedRoute>
                {withShell(<RegistrationsPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                {withShell(<ApprovalsPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals/user/:id"
            element={
              <ProtectedRoute>
                {withShell(<ParticipantApprovalPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                {withShell(<ReportsPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                {withShell(<ScannerPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteers"
            element={
              <ProtectedRoute>
                {withShell(<VolunteersPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteers/assign-job/:id"
            element={
              <ProtectedRoute>
                {withShell(<VolunteersPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                {withShell(<AnalyticsPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/college/:id"
            element={
              <ProtectedRoute>
                {withShell(<CollegeDetailPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                {withShell(<LogsPage />)}
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <ToastContainer />
      </Router>
    </div>
  );
}
