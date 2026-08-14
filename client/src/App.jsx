import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HostDashboard from './pages/HostDashboard';
import MobileClient from './pages/MobileClient';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground flex flex-col">
        <Routes>
          <Route path="/" element={<MobileClient />} />
          <Route path="/host" element={<HostDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
