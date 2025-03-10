import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { Profile } from './pages/Profile';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Scanner } from './pages/Scanner';
import { Categories } from './pages/Categories';
import { Maintenance } from './pages/Maintenance';
import { Reports } from './pages/Reports';
import { AdminPortal } from './pages/AdminPortal';
import { ShowArchive } from './pages/ShowArchive';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/scanner" element={<Scanner />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/maintenance" element={<Maintenance />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/show-archive" element={<ShowArchive />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/admin" element={<AdminPortal />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;