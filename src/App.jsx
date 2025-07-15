// src/App.jsx
import { Zap } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Footer from './components/ui/Footer'; // Uncommented!

function App() {
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
                {/* Hide subtitle on mobile, show on desktop */}
                <p className="hidden sm:block text-sm text-gray-600">
                  Denver Picklr Group Tournament and League Tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Dashboard />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;