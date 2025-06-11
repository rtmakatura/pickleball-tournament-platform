// src/components/Dashboard.jsx (COMPLETE - Added Comment Integration and Link Support)
import React, { useState } from 'react';
import { Plus, Calendar, Users, Trophy, DollarSign, Activity, MessageSquare, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { useMembers, useLeagues, useTournaments, useAuth } from '../hooks';
import { SKILL_LEVELS, TOURNAMENT_STATUS, LEAGUE_STATUS } from '../services/models';
import { calculateOverallPaymentSummary } from '../utils/paymentUtils';
import { generateGoogleMapsLink, generateDirectionsLink, openLinkSafely, extractDomain } from '../utils/linkUtils';

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
import { LeagueForm, LeagueMemberSelector } from './league';
import { SignUpForm } from './auth';
import SignInForm from './auth/SignInForm';
import { ResultsButton } from './results';
import { CommentSection } from './comments'; // NEW: Import comment components

const Dashboard = () => {
  const { user, signIn, signUpWithProfile, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { members, loading: membersLoading, addMember, updateMember, deleteMember } = useMembers();
  const { leagues, loading: leaguesLoading, addLeague, updateLeague, deleteLeague } = useLeagues();
  const { tournaments, loading: tournamentsLoading, addTournament, updateTournament, deleteTournament } = useTournaments();

  // Modal states
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTournamentDetailModal, setShowTournamentDetailModal] = useState(false); // NEW: Tournament detail modal
  const [showLeagueDetailModal, setShowLeagueDetailModal] = useState(false); // NEW: League detail modal
  const [editingTournament, setEditingTournament] = useState(null);
  const [editingLeague, setEditingLeague] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingTournament, setViewingTournament] = useState(null); // NEW: Tournament being viewed
  const [viewingLeague, setViewingLeague] = useState(null); // NEW: League being viewed
  const currentUserMember = members.find(m => m.authUid === user?.uid);
  
  // Auth UI state
  const [authMode, setAuthMode] = useState('signin');
  
  // Form states
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedLeagueMembers, setSelectedLeagueMembers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Helper function to sort tournaments by event date (chronologically)
  const getSortedTournaments = () => {
    return [...tournaments].sort((a, b) => {
      const dateA = a.eventDate ? (a.eventDate.seconds ? new Date(a.eventDate.seconds * 1000) : new Date(a.eventDate)) : new Date(0);
      const dateB = b.eventDate ? (b.eventDate.seconds ? new Date(b.eventDate.seconds * 1000) : new Date(b.eventDate)) : new Date(0);
      return dateA - dateB;
    });
  };

  // Helper function to sort leagues by start date (chronologically)
  const getSortedLeagues = () => {
    return [...leagues].sort((a, b) => {
      const dateA = a.startDate ? (a.startDate.seconds ? new Date(a.startDate.seconds * 1000) : new Date(a.startDate)) : new Date(0);
      const dateB = b.startDate ? (b.startDate.seconds ? new Date(b.startDate.seconds * 1000) : new Date(b.startDate)) : new Date(0);
      return dateA - dateB;
    });
  };

  // Show alert message
  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Auth functions
  const handleSignIn = async (credentials) => {
    try {
      await signIn(credentials.email, credentials.password);
      showAlert('success', 'Welcome back!', 'Signed in successfully');
    } catch (err) {
      showAlert('error', 'Sign in failed', err.message);
      throw err;
    }
  };

  const handleSignUp = async (signupData) => {
    try {
      await signUpWithProfile(signupData);
      showAlert('success', 'Welcome!', 'Account created successfully');
    } catch (err) {
      showAlert('error', 'Sign up failed', err.message);
      throw err;
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

  // NEW: Handle viewing tournament details with comments
  const handleViewTournament = (tournament) => {
    setViewingTournament(tournament);
    setShowTournamentDetailModal(true);
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

  // Delete handlers
  const handleDeleteTournament = async (tournamentId) => {
    setDeleteLoading(true);
    try {
      await deleteTournament(tournamentId);
      setShowTournamentModal(false);
      setEditingTournament(null);
      setSelectedMembers([]);
      showAlert('success', 'Tournament deleted!', 'Tournament has been successfully deleted');
    } catch (err) {
      showAlert('error', 'Failed to delete tournament', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // League functions
  const handleCreateLeague = async (leagueData) => {
    setFormLoading(true);
    try {
      const leagueId = await addLeague(leagueData);
      
      if (selectedLeagueMembers.length > 0) {
        await updateLeague(leagueId, {
          participants: selectedLeagueMembers
        });
      }
      
      setShowLeagueModal(false);
      setSelectedLeagueMembers([]);
      showAlert('success', 'League created!', `${leagueData.name} has been created successfully`);
    } catch (err) {
      showAlert('error', 'Failed to create league', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditLeague = (league) => {
    setEditingLeague(league);
    setSelectedLeagueMembers(league.participants || []);
    setShowLeagueModal(true);
  };

  // NEW: Handle viewing league details with comments
  const handleViewLeague = (league) => {
    setViewingLeague(league);
    setShowLeagueDetailModal(true);
  };

  const handleUpdateLeague = async (leagueData) => {
    setFormLoading(true);
    try {
      await updateLeague(editingLeague.id, {
        ...leagueData,
        participants: selectedLeagueMembers
      });
      
      setShowLeagueModal(false);
      setEditingLeague(null);
      setSelectedLeagueMembers([]);
      showAlert('success', 'League updated!', `${leagueData.name} has been updated successfully`);
    } catch (err) {
      showAlert('error', 'Failed to update league', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLeague = async (leagueId) => {
    setDeleteLoading(true);
    try {
      await deleteLeague(leagueId);
      setShowLeagueModal(false);
      setEditingLeague(null);
      setSelectedLeagueMembers([]);
      showAlert('success', 'League deleted!', 'League has been successfully deleted');
    } catch (err) {
      showAlert('error', 'Failed to delete league', err.message);
    } finally {
      setDeleteLoading(false);
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

  const handleUpdateMember = async (memberData) => {
    setFormLoading(true);
    try {
      await updateMember(editingMember.id, memberData);
      setShowMemberModal(false);
      setEditingMember(null);
      showAlert('success', 'Member updated!', `${memberData.firstName} ${memberData.lastName} has been updated successfully`);
    } catch (err) {
      showAlert('error', 'Failed to update member', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    setDeleteLoading(true);
    try {
      await deleteMember(memberId);
      setShowMemberModal(false);
      setEditingMember(null);
      showAlert('success', 'Member deleted!', 'Member has been successfully deleted');
    } catch (err) {
      showAlert('error', 'Failed to delete member', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Payment tracking calculations
  const getPaymentSummary = () => {
    return calculateOverallPaymentSummary(tournaments, leagues);
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md">
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

          {authMode === 'signin' ? (
            <SignInForm
              onSubmit={handleSignIn}
              onSwitchToSignUp={() => setAuthMode('signup')}
            />
          ) : (
            <SignUpForm
              onSubmit={handleSignUp}
              onSwitchToSignIn={() => setAuthMode('signin')}
            />
          )}
        </div>
      </div>
    );
  }

  // Get sorted data
  const sortedTournaments = getSortedTournaments();
  const sortedLeagues = getSortedLeagues();

  // UPDATED: Table columns for tournaments with comments support and links
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
      label: 'Location',
      render: (location, tournament) => (
        <div className="flex items-center space-x-2">
          <span className="truncate max-w-32">{location}</span>
          {location && (
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openLinkSafely(generateGoogleMapsLink(location))}
                title="View on Maps"
                className="px-1 py-0.5"
              >
                <MapPin className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openLinkSafely(generateDirectionsLink(location))}
                title="Get Directions"
                className="px-1 py-0.5"
              >
                <Navigation className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'skillLevel',
      label: 'Skill Level',
      render: (level) => <span className="capitalize">{level}</span>
    },
    {
      key: 'eventType',
      label: 'Type',
      render: (type) => <span className="capitalize">{type?.replace('_', ' ')}</span>
    },
    {
      key: 'website',
      label: 'Website',
      render: (website) => (
        website ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openLinkSafely(website)}
            title={`Visit ${extractDomain(website)}`}
            className="px-2 py-1"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {extractDomain(website)}
          </Button>
        ) : (
          <span className="text-gray-400">—</span>
        )
      )
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
      key: 'commentCount', // NEW: Comment count column
      label: 'Comments',
      render: (_, tournament) => (
        <div className="flex items-center space-x-1">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{tournament.commentCount || 0}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, tournament) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewTournament(tournament)} // NEW: View button
          >
            View
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditTournament(tournament)}
          >
            Edit
          </Button>
          
          <ResultsButton
            event={tournament}
            eventType="tournament"
            variant="auto"
            size="sm"
          />
        </div>
      )
    }
  ];

  // UPDATED: Table columns for leagues with comments support and links
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
      key: 'location',
      label: 'Location',
      render: (location, league) => (
        location ? (
          <div className="flex items-center space-x-2">
            <span className="truncate max-w-32">{location}</span>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openLinkSafely(generateGoogleMapsLink(location))}
                title="View on Maps"
                className="px-1 py-0.5"
              >
                <MapPin className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openLinkSafely(generateDirectionsLink(location))}
                title="Get Directions"
                className="px-1 py-0.5"
              >
                <Navigation className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )
      )
    },
    {
      key: 'skillLevel',
      label: 'Skill Level',
      render: (level) => <span className="capitalize">{level}</span>
    },
    {
      key: 'eventType',
      label: 'Type',
      render: (type) => <span className="capitalize">{type?.replace('_', ' ')}</span>
    },
    {
      key: 'website',
      label: 'Website',
      render: (website) => (
        website ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openLinkSafely(website)}
            title={`Visit ${extractDomain(website)}`}
            className="px-2 py-1"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {extractDomain(website)}
          </Button>
        ) : (
          <span className="text-gray-400">—</span>
        )
      )
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
      key: 'commentCount', // NEW: Comment count column
      label: 'Comments',
      render: (_, league) => (
        <div className="flex items-center space-x-1">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{league.commentCount || 0}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, league) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewLeague(league)} // NEW: View button
          >
            View
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditLeague(league)}
          >
            Edit
          </Button>
          
          <ResultsButton
            event={league}
            eventType="league"
            variant="auto"
            size="sm"
          />
        </div>
      )
    }
  ];

  // Table columns for members
  const memberColumns = [
    {
      key: 'displayName',
      label: 'Name',
      render: (_, member) => `${member.firstName} ${member.lastName}`
    },
    {
      key: 'email',
      label: 'Email'
    },
    {
      key: 'skillLevel',
      label: 'Skill Level',
      render: (level) => <span className="capitalize">{level}</span>
    },
    {
      key: 'role',
      label: 'Role',
      render: (role) => <span className="capitalize">{role}</span>
    },
    {
      key: 'venmoHandle',
      label: 'Venmo',
      render: (handle) => handle ? `@${handle}` : '—'
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (isActive) => (
        <span className={`
          px-2 py-1 text-xs rounded-full
          ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
        `}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, member) => (
        <TableActions
          actions={[
            {
              label: 'Edit',
              onClick: () => handleEditMember(member)
            }
          ]}
        />
      )
    }
  ];

  const paymentSummary = getPaymentSummary();

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
            <p className="text-gray-600">
            Welcome back, {currentUserMember?.firstName || user.email}!
            </p>
        </div>
        <Button variant="outline" onClick={logout}>
            Logout
        </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>

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

        {/* Tournaments Section */}
        <Card 
          title="Tournaments"
          subtitle="Manage your pickleball tournaments (sorted chronologically)"
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
            data={sortedTournaments}
            loading={tournamentsLoading}
            emptyMessage="No tournaments yet. Create your first tournament!"
          />
        </Card>

        {/* Leagues Section */}
        <Card 
          title="Leagues"
          subtitle="Manage ongoing pickleball leagues (sorted chronologically)"
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
            data={sortedLeagues}
            loading={leaguesLoading}
            emptyMessage="No leagues yet. Create your first league!"
          />
        </Card>

        {/* Members Section */}
        <Card 
          title="Members"
          subtitle="Manage pickleball community members"
          actions={[
            <Button 
              key="add-member"
              onClick={() => setShowMemberModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Member
            </Button>
          ]}
          className="mb-8"
        >
          <Table
            columns={memberColumns}
            data={members}
            loading={membersLoading}
            emptyMessage="No members yet. Add your first member!"
          />
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
              onDelete={editingTournament ? handleDeleteTournament : null}
              loading={formLoading}
              deleteLoading={deleteLoading}
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

        {/* NEW: Tournament Detail Modal with Comments */}
        <Modal
          isOpen={showTournamentDetailModal}
          onClose={() => {
            setShowTournamentDetailModal(false);
            setViewingTournament(null);
          }}
          title={viewingTournament?.name || 'Tournament Details'}
          size="xl"
        >
          {viewingTournament && (
            <div className="space-y-6">
              {/* Tournament Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <p>{viewingTournament.eventDate ? new Date(viewingTournament.eventDate.seconds * 1000).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <div className="flex items-center space-x-2">
                      <p>{viewingTournament.location}</p>
                      {viewingTournament.location && (
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openLinkSafely(generateGoogleMapsLink(viewingTournament.location))}
                            title="View on Maps"
                            className="px-1 py-0.5"
                          >
                            <MapPin className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openLinkSafely(generateDirectionsLink(viewingTournament.location))}
                            title="Get Directions"
                            className="px-1 py-0.5"
                          >
                            <Navigation className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Participants:</span>
                    <p>{viewingTournament.participants?.length || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Entry Fee:</span>
                    <p>${viewingTournament.entryFee || 0}</p>
                  </div>
                </div>
                {viewingTournament.description && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="mt-1">{viewingTournament.description}</p>
                  </div>
                )}
                {viewingTournament.website && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Website:</span>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-blue-600">{extractDomain(viewingTournament.website)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openLinkSafely(viewingTournament.website)}
                        className="px-2 py-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visit Site
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <CommentSection
                eventId={viewingTournament.id}
                eventType="tournament"
                event={viewingTournament}
              />
            </div>
          )}
        </Modal>

        {/* League Modal */}
        <Modal
          isOpen={showLeagueModal}
          onClose={() => {
            setShowLeagueModal(false);
            setEditingLeague(null);
            setSelectedLeagueMembers([]);
          }}
          title={editingLeague ? 'Edit League' : 'Create New League'}
          size="lg"
        >
          <div className="space-y-6">
            <LeagueForm
              league={editingLeague}
              onSubmit={editingLeague ? handleUpdateLeague : handleCreateLeague}
              onCancel={() => {
                setShowLeagueModal(false);
                setEditingLeague(null);
                setSelectedLeagueMembers([]);
              }}
              onDelete={editingLeague ? handleDeleteLeague : null}
              loading={formLoading}
              deleteLoading={deleteLoading}
            />
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select League Members
              </h3>
              <LeagueMemberSelector
                members={members}
                selectedMembers={selectedLeagueMembers}
                onSelectionChange={setSelectedLeagueMembers}
                loading={membersLoading}
              />
            </div>
          </div>
        </Modal>

        {/* NEW: League Detail Modal with Comments */}
        <Modal
          isOpen={showLeagueDetailModal}
          onClose={() => {
            setShowLeagueDetailModal(false);
            setViewingLeague(null);
          }}
          title={viewingLeague?.name || 'League Details'}
          size="xl"
        >
          {viewingLeague && (
            <div className="space-y-6">
              {/* League Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Start Date:</span>
                    <p>{viewingLeague.startDate ? new Date(viewingLeague.startDate.seconds * 1000).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">End Date:</span>
                    <p>{viewingLeague.endDate ? new Date(viewingLeague.endDate.seconds * 1000).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Participants:</span>
                    <p>{viewingLeague.participants?.length || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Registration Fee:</span>
                    <p>${viewingLeague.registrationFee || 0}</p>
                  </div>
                </div>
                {viewingLeague.location && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Location:</span>
                    <div className="mt-1 flex items-center space-x-2">
                      <span>{viewingLeague.location}</span>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openLinkSafely(generateGoogleMapsLink(viewingLeague.location))}
                          title="View on Maps"
                          className="px-1 py-0.5"
                        >
                          <MapPin className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openLinkSafely(generateDirectionsLink(viewingLeague.location))}
                          title="Get Directions"
                          className="px-1 py-0.5"
                        >
                          <Navigation className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {viewingLeague.description && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="mt-1">{viewingLeague.description}</p>
                  </div>
                )}
                {viewingLeague.website && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Website:</span>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-blue-600">{extractDomain(viewingLeague.website)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openLinkSafely(viewingLeague.website)}
                        className="px-2 py-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visit Site
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <CommentSection
                eventId={viewingLeague.id}
                eventType="league"
                event={viewingLeague}
              />
            </div>
          )}
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
            onSubmit={editingMember ? handleUpdateMember : handleCreateMember}
            onCancel={() => {
              setShowMemberModal(false);
              setEditingMember(null);
            }}
            onDelete={editingMember ? handleDeleteMember : null}
            loading={formLoading}
            deleteLoading={deleteLoading}
          />
        </Modal>

        {/* Enhanced Payment Tracking Modal */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Payment Tracking Overview"
          size="xl"
        >
          <div className="space-y-8">
            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <h4 className="font-medium text-blue-900">Total Expected</h4>
                <p className="text-2xl font-bold text-blue-600">${paymentSummary.totalExpected}</p>
                <p className="text-xs text-blue-700 mt-1">
                  {paymentSummary.paidTournaments} tournaments • {paymentSummary.paidLeagues} leagues
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <h4 className="font-medium text-green-900">Total Collected</h4>
                <p className="text-2xl font-bold text-green-600">${paymentSummary.totalCollected}</p>
                <p className="text-xs text-green-700 mt-1">
                  {paymentSummary.participantsPaid} of {paymentSummary.participantsWithPayments} paid
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                <h4 className="font-medium text-red-900">Outstanding</h4>
                <p className="text-2xl font-bold text-red-600">${paymentSummary.totalOwed}</p>
                <p className="text-xs text-red-700 mt-1">
                  {paymentSummary.paymentRate}% payment rate
                </p>
              </div>
            </div>

            {/* Tournament Payments Section */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Trophy className="h-6 w-6 text-green-600 mr-2" />
                  Tournament Payments
                </h3>
                <p className="text-sm text-gray-600 mt-1">Track entry fee payments for tournaments</p>
              </div>
              
              <div className="space-y-6">
                {tournaments.filter(t => t.entryFee > 0).map(tournament => (
                  <div key={tournament.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                      <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                        ${tournament.entryFee} per person
                      </span>
                    </div>
                    <PaymentStatus
                      event={tournament}
                      eventType="tournament"
                      members={members}
                      onPaymentUpdate={updateTournament}
                      currentUserId={user?.uid}
                    />
                  </div>
                ))}
                
                {tournaments.filter(t => t.entryFee > 0).length === 0 && (
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                    No tournaments with entry fees found.
                  </p>
                )}
              </div>
            </div>

            {/* League Payments Section */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Activity className="h-6 w-6 text-blue-600 mr-2" />
                  League Payments
                </h3>
                <p className="text-sm text-gray-600 mt-1">Track registration fee payments for leagues</p>
              </div>
              
              <div className="space-y-6">
                {leagues.filter(l => l.registrationFee > 0).map(league => (
                  <div key={league.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">{league.name}</h4>
                      <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                        ${league.registrationFee} per person
                      </span>
                    </div>
                    <PaymentStatus
                      event={league}
                      eventType="league"
                      members={members}
                      onPaymentUpdate={updateLeague}
                      currentUserId={user?.uid}
                    />
                  </div>
                ))}
                
                {leagues.filter(l => l.registrationFee > 0).length === 0 && (
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                    No leagues with registration fees found.
                  </p>
                )}
              </div>
            </div>

            {/* No paid events message */}
            {paymentSummary.paidEvents === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
                <DollarSign className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Payment Tracking Needed</h3>
                <p className="text-gray-500 mb-4">No tournaments or leagues with fees found.</p>
                <p className="text-sm text-gray-400">Create a tournament or league with an entry/registration fee to start tracking payments.</p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Dashboard;