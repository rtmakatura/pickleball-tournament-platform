import { Trophy, Calendar, Users, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-green-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">
                PickleTrack Tournament Platform
              </h1>
            </div>
            <nav className="flex space-x-4">
              <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                <Calendar className="h-4 w-4 mr-1" />
                Tournaments
              </button>
              <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                <Users className="h-4 w-4 mr-1" />
                Members
              </button>
              <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;