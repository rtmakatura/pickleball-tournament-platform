import React from 'react'
import { Calendar, Users, Trophy, Settings } from 'lucide-react'
import './styles/App.css'

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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to PickleTrack
            </h2>
            <p className="text-gray-600 mb-6">
              Your complete pickleball tournament management platform
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Calendar className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Tournaments</h3>
                <p className="text-sm text-gray-600">
                  Create and manage tournaments with real-time updates
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Users className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Members</h3>
                <p className="text-sm text-gray-600">
                  Track player registrations and league participation
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Settings className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Management</h3>
                <p className="text-sm text-gray-600">
                  Handle payments, roles, and administrative tasks
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 PickleTrack Tournament Platform. Built with React & Firebase.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
