// src/App.jsx
import React from 'react';
import { Zap } from 'lucide-react';
import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Footer from './components/ui/Footer';
import { NotificationCenter } from './components/notifications';
import { useAuth } from './hooks/useAuth';
import { Bell } from 'lucide-react';


import { useMembers } from './hooks/useMembers';
import { useNotificationBadge } from './hooks/useNotificationBadge';


function App() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardRef, setDashboardRef] = useState(null);

  // Navigation handler for notifications
  const handleNotificationNavigation = (notification) => {
    if (dashboardRef && dashboardRef.handleNotificationNavigation) {
      dashboardRef.handleNotificationNavigation(notification);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-green-600" />
              <div className="ml-2">
                <h1 className="text-xl font-bold text-gray-900">
                  PicklePortal
                </h1>
                <p className="hidden sm:block text-sm text-gray-600">
                  Denver Picklr Group Tournament and League Tracking
                </p>
              </div>
            </div>
            
            {/* Notification Badge */}
            {user?.uid && (
              <NotificationBadge 
                userId={user.uid}
                onShowNotifications={() => setShowNotifications(true)}
              />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Dashboard ref={setDashboardRef} />
      </main>

      <Footer />

      {showNotifications && (
        <NotificationCenter
          isModal={true}
          onClose={() => setShowNotifications(false)}
          onNavigate={handleNotificationNavigation}
          modalVariant="notification"
        />
      )}
    </div>
  );
}

// Notification badge with isolated hooks to prevent App re-renders
const NotificationBadge = React.memo(({ userId, onShowNotifications }) => {
  const { members } = useMembers();
  const { count, hasHighPriority } = useNotificationBadge({
    debounceMs: 2000,
    enableSound: false
  });

  return (
    <button
      onClick={onShowNotifications}
      className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      title="Notifications"
    >
      <Bell className="h-6 w-6 text-gray-600" />
      {count > 0 && (
        <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-medium flex items-center justify-center ${
          hasHighPriority ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
});

export default App;