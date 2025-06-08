// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { useMembers, useLeagues, useTournaments, useAuth } from '../hooks';
import { SKILL_LEVELS, TOURNAMENT_STATUS } from '../services/models';

const Dashboard = () => {
  const { user, signIn, signUp, logout, isAuthenticated } = useAuth();
  const { members, loading: membersLoading, addMember } = useMembers();
  const { leagues, loading: leaguesLoading, addLeague } = useLeagues();
  const { tournaments, loading: tournamentsLoading, addTournament } = useTournaments();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Auth form
  const handleAuth = async (isSignUp) => {
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  // Quick add functions
  const handleAddMember = async () => {
    await addMember({
      firstName: 'New',
      lastName: 'Member',
      email: `member${Date.now()}@example.com`,
      skillLevel: SKILL_LEVELS.BEGINNER
    });
  };

  const handleAddLeague = async () => {
    await addLeague({
      name: `League ${Date.now()}`,
      description: 'A new league',
      skillLevel: SKILL_LEVELS.INTERMEDIATE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    });
  };

  const handleAddTournament = async () => {
    await addTournament({
      name: `Tournament ${Date.now()}`,
      description: 'A new tournament',
      skillLevel: SKILL_LEVELS.INTERMEDIATE,
      status: TOURNAMENT_STATUS.DRAFT,
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      location: 'TBD'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">PickleTrack - Please Sign In</h1>
        <div className="max-w-md">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <div className="space-x-2">
            <button
              onClick={() => handleAuth(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Sign In
            </button>
            <button
              onClick={() => handleAuth(true)}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">PickleTrack Dashboard</h1>
        <div className="space-x-2">
          <span>Welcome, {user.email}</span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Members Section */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Members</h2>
            <button
              onClick={handleAddMember}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Add Member
            </button>
          </div>
          {membersLoading ? (
            <p>Loading...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">Total: {members.length}</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.slice(0, 5).map(member => (
                  <div key={member.id} className="text-sm border-b pb-1">
                    {member.firstName} {member.lastName}
                    <span className="text-gray-500 ml-2">({member.skillLevel})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Leagues Section */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Leagues</h2>
            <button
              onClick={handleAddLeague}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm"
            >
              Add League
            </button>
          </div>
          {leaguesLoading ? (
            <p>Loading...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">Total: {leagues.length}</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {leagues.slice(0, 5).map(league => (
                  <div key={league.id} className="text-sm border-b pb-1">
                    {league.name}
                    <span className="text-gray-500 ml-2">({league.status})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tournaments Section */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tournaments</h2>
            <button
              onClick={handleAddTournament}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
            >
              Add Tournament
            </button>
          </div>
          {tournamentsLoading ? (
            <p>Loading...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">Total: {tournaments.length}</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tournaments.slice(0, 5).map(tournament => (
                  <div key={tournament.id} className="text-sm border-b pb-1">
                    {tournament.name}
                    <span className="text-gray-500 ml-2">({tournament.status})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;