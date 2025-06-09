// src/components/Dashboard.jsx (Enhanced with Leagues and Payment Tracking)
import React, { useState } from 'react';
import { Plus, Calendar, Users, Trophy, DollarSign, Activity } from 'lucide-react';
import { useMembers, useLeagues, useTournaments, useAuth } from '../hooks';
import { SKILL_LEVELS, TOURNAMENT_STATUS, LEAGUE_STATUS } from '../services/models';

// Import our UI components
import { 
  Button, 
  Modal, 
  Card, 
  Table, 
  TableActions, 
  Alert 
} from './ui';
import TournamentForm from './tournament/TournamentForm';
import MemberSelector from './tournament/MemberSelector';
import PaymentStatus from './tournament/PaymentStatus';
import { MemberForm } from './member';
import { LeagueForm } from './league';

const Dashboard = () => {
  const { user, signIn, signUp, logout, isAuthenticated } = useAuth();
  const { members, loading: membersLoading, addMember } = useMembers();
  const { leagues, loading: leaguesLoading, addLeague, updateLeague } = useLeagues();
  const { tournaments, loading: tournamentsLoading, addTournament, updateTournament } = useTournaments();

  // Modal states
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [editingLeague, setEditingLeague] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  
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
    setTimeout(() => setAlert(null), 5000);
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

  // League functions
  const handleCreateLeague = async (leagueData) => {
    setFormLoading(true);
    try {
      await addLeague(leagueData);
      setShowLeagueModal(false);
      showAlert('success', 'League created!', `${leagueData.name} has been created successfully`);
    } catch (err) {
      showAlert('error', 'Failed to create league', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditLeague = (league) => {
    setEditingLeague(league);
    setShowLeagueModal(true);
  };

  const handleUpdateLeague = async (leagueData) => {
    setFormLoading(true);
    try {
      await updateLeague(editingLeague.id, leagueData);
      setShowLeagueModal(false);
      setEditingLeague(null);
      showAlert('success', 'League updated!', `${leagueData.name} has been updated successfully`);
    } catch (err) {
      showAlert('error', 'Failed to update league', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Member functions
  const handleCreateMember = async (memberData) => {
    setFormLoading(true);
    try {
      await addMember(memberData);
      setShowMemberModal(false);
      showAlert('success', 'Member added!', `${memberData.firstName} ${memberData.lastName} has been added successfully`);
    } catch (err) {
      showAlert('error', 'Failed to add member', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowMemberModal(true);
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

  // Payment tracking calculations
  const getPaymentSummary = () => {
    const paidTournaments = tournaments.filter(t => t.entryFee > 0);
    let totalOwed = 0;
    let totalCollected = 0;
    let participantsWithPayments = 0;
    let participantsPaid = 0;

    paidTournaments.forEach(tournament => {
      const participants = tournament.participants?.length || 0;
      const entryFee = tournament.entryFee || 0;
      const paymentData = tournament.paymentData || {};
      
      totalOwed += participants * entryFee;
      participantsWithPayments += participants;
      
      Object.values(paymentData).forEach(payment => {
        if (payment.status === 'paid') {
          totalCollected += payment.amount || entryFee;
          participantsPaid++;
        }
      });
    });

    return {
      totalOwed,
      totalCollected,
      remaining: totalOwed - totalCollected,
      participantsWithPayments,
      participantsPaid,
      paymentRate: participantsWithPayments > 0 ? (participantsPaid / participantsWithPayments * 100).toFixed(1) : 0
    };
  };

  const paymentSummary = getPaymentSummary();

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card title="Welcome to PicklePortal" className="w-full max-w-md">
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

  // Table columns for leagues
  const leagueColumns = [
    {
      key: 'name',
      label: 'League Name'
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (date) => date ? new Date(date.seconds * 1000).toLocaleDateString() : 'TBD'
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (date) => date ? new Date(date.seconds * 1000).toLocaleDateString() : 'TBD'
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
          ${status === LEAGUE_STATUS.ACTIVE ? 'bg-green-100 text-green-800' :
            status === LEAGUE_STATUS.COMPLETED ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }
        `}>
          {status}
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
      render: (_, league) => (
        <TableActions
          actions={[
            {
              label: 'Edit',
              onClick: () => handleEditLeague(league)
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

        {/* Header - REMOVED "PickleTrack Dashboard" title */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-gray-600">Welcome back, {user.email}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tournaments</h3>
            <div className="flex items-center justify-center">
              <Trophy className="h-8 w-8 text-green-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {tournaments.length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Leagues</h3>
            <div className="flex items-center justify-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {leagues.filter(l => l.status === LEAGUE_STATUS.ACTIVE).length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Members</h3>
            <div className="flex items-center justify-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {members.length}
              </span>
            </div>
          </div>

          {/* FIXED Payment Collection Card */}
          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Collection</h3>
            <div className="flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-yellow-600 mr-3" />
              <span className="text-3xl font-bold text-gray-900">
                {paymentSummary.paymentRate}%
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              ${paymentSummary.totalCollected} collected
            </div>
          </div>
        </div>

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

        {/* Leagues Section */}
        <Card 
          title="Leagues"
          subtitle="Manage ongoing pickleball leagues"
          actions={[
            <Button 
              key="add-league"
              onClick={() => setShowLeagueModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New League
            </Button>
          ]}
          className="mb-8"
        >
          <Table
            columns={leagueColumns}
            data={leagues}
            loading={leaguesLoading}
            emptyMessage="No leagues yet. Create your first league!"
          />
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowMemberModal(true)}
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
              onClick={() => setShowLeagueModal(true)}
              className="h-16"
            >
              <Activity className="h-5 w-5 mr-2" />
              Create League
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentModal(true)}
              className="h-16"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Payment Tracker
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

        {/* League Modal */}
        <Modal
          isOpen={showLeagueModal}
          onClose={() => {
            setShowLeagueModal(false);
            setEditingLeague(null);
          }}
          title={editingLeague ? 'Edit League' : 'Create New League'}
          size="lg"
        >
          <LeagueForm
            league={editingLeague}
            onSubmit={editingLeague ? handleUpdateLeague : handleCreateLeague}
            onCancel={() => {
              setShowLeagueModal(false);
              setEditingLeague(null);
            }}
            loading={formLoading}
          />
        </Modal>

        {/* Member Modal */}
        <Modal
          isOpen={showMemberModal}
          onClose={() => {
            setShowMemberModal(false);
            setEditingMember(null);
          }}
          title={editingMember ? 'Edit Member' : 'Add New Member'}
          size="lg"
        >
          <MemberForm
            member={editingMember}
            onSubmit={handleCreateMember}
            onCancel={() => {
              setShowMemberModal(false);
              setEditingMember(null);
            }}
            loading={formLoading}
          />
        </Modal>

        {/* Payment Tracking Modal */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Payment Tracking Overview"
          size="xl"
        >
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Total Owed</h4>
                <p className="text-2xl font-bold text-blue-600">${paymentSummary.totalOwed}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Collected</h4>
                <p className="text-2xl font-bold text-green-600">${paymentSummary.totalCollected}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900">Remaining</h4>
                <p className="text-2xl font-bold text-red-600">${paymentSummary.remaining}</p>
              </div>
            </div>

            {/* Individual Tournament Payments */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Tournament Payments</h3>
              {tournaments.filter(t => t.entryFee > 0).map(tournament => (
                <div key={tournament.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                    <span className="text-sm text-gray-500">
                      ${tournament.entryFee} per person
                    </span>
                  </div>
                  <PaymentStatus
                    tournament={tournament}
                    members={members}
                    onPaymentUpdate={updateTournament}
                    currentUserId={user?.uid}
                  />
                </div>
              ))}
              
              {tournaments.filter(t => t.entryFee > 0).length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No tournaments with entry fees found.
                </p>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Dashboard;