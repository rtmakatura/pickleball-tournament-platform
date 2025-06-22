import { Zap } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { useAuth, useNotificationBadge } from './hooks';
import { NotificationBadge, NotificationCenter } from './components/notifications';
import { Button } from './components/ui';
import { useState } from 'react';

function App() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  const {
    count,
    hasHighPriority,
    shouldAnimate,
    ariaLabel
  } = useNotificationBadge({
    debounceMs: 500,
    enableSound: false
  });

  // Don't show header if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main>
          <Dashboard />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Title */}
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-green-600" />
              <div className="ml-2">
                <h1 className="text-xl font-bold text-gray-900">
                  PicklePortal
                </h1>
                {/* Hide subtitle on mobile, show on desktop */}
                <p className="hidden sm:block text-sm text-gray-600">
                  Denver Picklr Group Tournament and League Tracking
                </p>
              </div>
            </div>

            {/* Right side - Notifications and Logout */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <NotificationBadge
                count={count}
                hasHighPriority={hasHighPriority}
                onClick={() => setShowNotificationModal(true)}
                animate={shouldAnimate}
                aria-label={ariaLabel}
                className="h-10 w-10" // Consistent touch target size
              />
              
              <Button 
                variant="outline" 
                onClick={logout}
                size="sm"
                className="text-sm px-3 py-2 sm:px-4 sm:py-2"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Dashboard />
      </main>

      {/* Notification Modal */}
      {showNotificationModal && (
        <NotificationCenter
          isModal={true}
          onClose={() => setShowNotificationModal(false)}
          onNavigate={(notification) => {
            // Handle notification navigation if needed
            setShowNotificationModal(false);
          }}
        />
      )}
    </div>
  );
}

export default App;