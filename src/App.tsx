import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import InterviewsPage from './pages/InterviewsPage';
import SchedulePage from './pages/SchedulePage';
import TestsPage from './pages/TestsPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/interviews" replace />} />
          <Route path="interviews" element={<InterviewsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="settings" element={<div>Settings Page (Coming Soon)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;