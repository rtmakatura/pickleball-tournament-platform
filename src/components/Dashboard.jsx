// src/components/Dashboard.jsx (Updated with new UI components)
import React, { useState } from 'react';
import { Plus, Calendar, Users, Trophy, DollarSign } from 'lucide-react';
import { useMembers, useLeagues, useTournaments, useAuth } from '../hooks';
import { SKILL_LEVELS, TOURNAMENT_STATUS } from '../services/models';

// Import our new UI components
import { 
  Button, 
  Modal, 
  Card, 
  CardGrid, 
  Table, 
  TableActions, 
  Alert 
} from './ui';
import TournamentForm from './tournament/TournamentForm';
import MemberSelector from './tournament/MemberSelector';

const Dashboard = () => {
  const { user, signIn, signUp, logout, isAuthenticated } = useAuth();
  const { members, loading: membersLoading, addMember } = useMembers();
  const { leagues, loading: leaguesLoading, addLeague } = useLeagues();
  const { tournaments, loading: tournamentsLoading, addTournament, updateTournament } = useTournaments();

  // Modal states
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  
  // Form states
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Show alert message
  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000); // Auto-hide after 5 seconds
  };

  // Auth functions
  const handleAuth = async (isSignUp) => {
    try {
      if (isSignUp) {
        await signUp(email, password);
        showAlert('success', 'Welcome!', 'Account created successfully');
      } else {
        await signIn(email, password);
        showAlert('success', 'Welcome back!', 'Signed in successfully');
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      showAlert('error', 'Authentication failed', err.message);
    }
  };

  // Tournament functions
  const handleCreateTournament = async (tournamentData) => {
    setFormLoading(true);
    try {
      const tournamentId = await addTournament(tournamentData);
      
      // If members are selected, add them as participants
      if (selectedMembers.length > 0) {
        await updateTournament(tournamentId, {
          participants: selectedMembers
        });
      }
      
      setShowTournamentModal(false);
      setSelectedMembers([]);
      showAlert('success', 'Tournament created!', `${tournamentData.name} has been created successfully`);
    } catch (err) {
      showAlert('error', 'Failed to create tournament', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTournament = (tournament) => {
    setEditingTournament(tournament);
    setSelectedMembers(tournament.participants || []);
    setShowTournamentModal(true);
  };

  const handleUpdateTournament = async (tournamentData) => {
    setFormLoading(true);
    try {
      await updateTournament(editingTournament.id, {
        ...tournamentData,
        participants: selectedMembers
      });
      
      setShowTournamentModal(false);
      setEditingTournament(null);
      setSelectedMembers([]);
      showAlert('success', 'Tournament updated!', `${tournamentData.name} has been updated successfully`);
    } catch (err) {
      showAlert('error', 'Failed to update tournament', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Quick member creation
  const handleQuickAddMember = async () => {
    try {
      await addMember({
        firstName: 'New',
        lastName: `Member ${Date.now()}`,
        email: `member${Date.now()}@example.com`,
        skillLevel: SKILL_LEVELS.BEGINNER
      });
      showAlert('success', 'Member added!', 'New member has been added successfully');
    } catch (err) {
      showAlert('error', 'Failed to add member', err.message);
    }
  };

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card title="Welcome to PickleTrack" className="w-full max-w-md">
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
            <div className="flex space-x-2">
              <Button onClick={() => handleAuth(false)} className="flex-1">
                Sign In
              </Button>
              <Button variant="outline" onClick={() => handleAuth(true)} className="flex-1">
                Sign Up
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Table columns for tournaments
  const tournamentColumns = [
    {
      key: 'name',
      label: 'Tournament Name'
    },
    {
      key: 'eventDate',
      label: 'Date',
      render: (date) => date ? new Date(date.seconds * 1000).toLocaleDateString() : 'TBD'
    },
    {
      key: 'location',
      label: 'Location'
    },
    {
      key: 'skillLevel',
      label: 'Skill Level',
      render: (level) => <span className="capitalize">{level}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`
          px-2 py-1 text-xs rounded-full
          ${status === TOURNAMENT_STATUS.DRAFT ? 'bg-gray-100 text-gray-800' :
            status === TOURNAMENT_STATUS.REGISTRATION_OPEN ? 'bg-green-100 text-green-800' :
            status === TOURNAMENT_STATUS.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
            status === TOURNAMENT_STATUS.COMPLETED ? 'bg-purple-100 text-purple-800' :
            'bg-red-100 text-red-800'
          }
        `}>
          {status.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'participants',
      label: 'Participants',
      render: (participants) => participants?.length || 0
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, tournament) => (
        <TableActions
          actions={[
            {
              label: 'Edit',
              onClick: () => handleEditTournament(tournament)
            }
          ]}
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert notification */}
        {alert && (
          <div className="mb-6">
            <Alert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tournament Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <CardGrid className="mb-8">
          <Card 
            title="Total Tournaments" 
            className="text-center"
          >
            <div className="flex items-center justify-center">
              <Trophy className="h-8 w-8 text-green-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {tournaments.length}
              </span>
            </div>
          </Card>

          <Card 
            title="Active Members" 
            className="text-center"
          >
            <div className="flex items-center justify-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {members.length}
              </span>
            </div>
          </Card>

          <Card 
            title="Upcoming Events" 
            className="text-center"
          >
            <div className="flex items-center justify-center">
              <Calendar className="h-8 w-8 text-purple-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {tournaments.filter(t => t.status === TOURNAMENT_STATUS.REGISTRATION_OPEN).length}
              </span>
            </div>
          </Card>
        </CardGrid>

        {/* Tournaments Section */}
        <Card 
          title="Tournaments"
          subtitle="Manage your pickleball tournaments"
          actions={[
            <Button 
              key="add-tournament"
              onClick={() => setShowTournamentModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Tournament
            </Button>
          ]}
          className="mb-8"
        >
          <Table
            columns={tournamentColumns}
            data={tournaments}
            loading={tournamentsLoading}
            emptyMessage="No tournaments yet. Create your first tournament!"
          />
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={handleQuickAddMember}
              className="h-16"
            >
              <Users className="h-5 w-5 mr-2" />
              Add Member
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowTournamentModal(true)}
              className="h-16"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Create Tournament
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16"
              disabled
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Payment Tracker
              <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
            </Button>
          </div>
        </Card>

        {/* Tournament Modal */}
        <Modal
          isOpen={showTournamentModal}
          onClose={() => {
            setShowTournamentModal(false);
            setEditingTournament(null);
            setSelectedMembers([]);
          }}
          title={editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
          size="lg"
        >
          <div className="space-y-6">
            <TournamentForm
              tournament={editingTournament}
              onSubmit={editingTournament ? handleUpdateTournament : handleCreateTournament}
              onCancel={() => {
                setShowTournamentModal(false);
                setEditingTournament(null);
                setSelectedMembers([]);
              }}
              loading={formLoading}
            />
            
            {/* Member Selection */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select Participants
              </h3>
              <MemberSelector
                members={members}
                selectedMembers={selectedMembers}
                onSelectionChange={setSelectedMembers}
                loading={membersLoading}
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Dashboard;