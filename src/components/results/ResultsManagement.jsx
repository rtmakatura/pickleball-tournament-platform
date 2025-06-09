// src/components/results/ResultsManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  Share2,
  Eye,
  Edit,
  Save,
  Check,
  AlertCircle,
  Medal,
  Star,
  Camera,
  FileText,
  ChevronDown
} from 'lucide-react';
import { Button, Input, Select, Card, Alert, Modal } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { useResults } from '../../hooks/useResults';
import { RESULT_STATUS, AWARD_TYPES, createParticipantResult, createEventResults } from '../../services/models';
import { canManageResults } from '../../utils/roleUtils';
import AwardModal, { AwardDisplay } from './AwardModal';

/**
 * ResultsManagement Component - Main interface for managing tournament/league results
 * 
 * Props:
 * - event: object - Tournament or league data
 * - eventType: string - 'tournament' or 'league'
 * - onResultsUpdate: function - Called when results are updated
 * - onClose: function - Called when closing results management
 */
const ResultsManagement = ({ 
  event, 
  eventType = 'tournament',
  onResultsUpdate,
  onClose 
}) => {
  const { user } = useAuth();
  const { members } = useMembers();
  const { 
    results, 
    loading, 
    createResults, 
    updateParticipantResult, 
    publishResults,
    addAward,
    removeAward,
    hasResults 
  } = useResults(event.id, eventType);

  // State management
  const [participantResults, setParticipantResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Permission checks
  const canManage = canManageResults(user?.uid, members);
  const isCompleted = event.status === 'completed';

  // Initialize results data
  useEffect(() => {
    if (results) {
      setParticipantResults(results.participantResults || []);
    } else if (event && event.participants && isCompleted) {
      // Create initial results if none exist
      initializeNewResults();
    }
  }, [results, event, isCompleted]);

  const initializeNewResults = async () => {
    if (!event.participants || event.participants.length === 0) return;
    
    try {
      const newResults = await createResults(event, event.participants);
      setParticipantResults(newResults.participantResults || []);
    } catch (error) {
      showAlert('error', 'Failed to initialize results', error.message);
    }
  };

  // Helper functions
  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const getParticipantName = (participantId) => {
    const member = members.find(m => m.id === participantId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown Player';
  };

  const getAvailablePlacements = () => {
    const totalParticipants = event.participants.length;
    return Array.from({ length: totalParticipants }, (_, i) => ({
      value: i + 1,
      label: getPlacementLabel(i + 1)
    }));
  };

  const getPlacementLabel = (placement) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const lastDigit = placement % 10;
    const suffix = (placement >= 11 && placement <= 13) ? 'th' : (suffixes[lastDigit] || 'th');
    return `${placement}${suffix} Place`;
  };

  // Update participant result
  const updateParticipantResultLocal = async (participantId, updates) => {
    if (!results) return;
    
    try {
      await updateParticipantResult(results.id, participantId, updates);
      
      // Update local state immediately for better UX
      setParticipantResults(prev => 
        prev.map(result => 
          result.participantId === participantId 
            ? { ...result, ...updates }
            : result
        )
      );
    } catch (error) {
      showAlert('error', 'Failed to update result', error.message);
    }
  };

  // Add award to participant
  const addAwardToParticipant = async (participantId, award) => {
    if (!results) return;
    
    try {
      await addAward(results.id, participantId, award);
      
      // Update local state
      const participant = participantResults.find(r => r.participantId === participantId);
      if (participant) {
        const updatedAwards = [...participant.awards, award];
        setParticipantResults(prev => 
          prev.map(result => 
            result.participantId === participantId 
              ? { ...result, awards: updatedAwards }
              : result
          )
        );
      }
    } catch (error) {
      showAlert('error', 'Failed to add award', error.message);
    }
  };

  // Remove award from participant
  const removeAwardFromParticipant = async (participantId, awardIndex) => {
    if (!results) return;
    
    try {
      await removeAward(results.id, participantId, awardIndex);
      
      // Update local state
      const participant = participantResults.find(r => r.participantId === participantId);
      if (participant) {
        const updatedAwards = participant.awards.filter((_, index) => index !== awardIndex);
        setParticipantResults(prev => 
          prev.map(result => 
            result.participantId === participantId 
              ? { ...result, awards: updatedAwards }
              : result
          )
        );
      }
    } catch (error) {
      showAlert('error', 'Failed to remove award', error.message);
    }
  };

  // Publish results
  const handlePublishResults = async () => {
    if (!results) return;
    
    setSaving(true);
    try {
      await publishResults(results.id);
      setShowPublishModal(false);
      showAlert('success', 'Results published!', 'Results have been published and participants have been notified');
      
      if (onResultsUpdate) {
        onResultsUpdate(results);
      }
    } catch (error) {
      showAlert('error', 'Publish failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalPrizeMoney = participantResults.reduce((sum, r) => sum + (r.prizeAmount || 0), 0);
    const totalGames = participantResults.reduce((sum, r) => sum + (r.gamesWon || 0) + (r.gamesLost || 0), 0);
    const placedParticipants = participantResults.filter(r => r.placement !== null).length;
    
    return {
      totalPrizeMoney,
      totalGames,
      placedParticipants,
      totalParticipants: event.participants.length
    };
  };

  // Export results
  const exportResults = () => {
    const exportData = {
      event: {
        name: event.name,
        type: eventType,
        date: event.eventDate || event.startDate,
        location: event.location || event.venue
      },
      results: participantResults.map(result => ({
        participant: getParticipantName(result.participantId),
        placement: result.placement ? getPlacementLabel(result.placement) : 'Unplaced',
        prizeAmount: result.prizeAmount,
        gamesWon: result.gamesWon,
        gamesLost: result.gamesLost,
        winPercentage: result.gamesWon + result.gamesLost > 0 
          ? ((result.gamesWon / (result.gamesWon + result.gamesLost)) * 100).toFixed(1) + '%'
          : '0%',
        awards: result.awards.map(a => a.title || a.customTitle || a.type).join(', '),
        notes: result.notes
      })),
      totals: calculateTotals()
    };

    // Create CSV content
    const csvContent = [
      ['Event', event.name],
      ['Type', eventType.charAt(0).toUpperCase() + eventType.slice(1)],
      ['Date', new Date(event.eventDate || event.startDate).toLocaleDateString()],
      [''],
      ['Participant', 'Placement', 'Prize Amount', 'Games Won', 'Games Lost', 'Win %', 'Awards', 'Notes'],
      ...exportData.results.map(r => [
        r.participant, r.placement, `${r.prizeAmount}`, r.gamesWon, r.gamesLost, r.winPercentage, r.awards, r.notes
      ])
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totals = calculateTotals();

  if (!canManage) {
    return (
      <Card title="Access Denied">
        <Alert 
          type="error" 
          title="Insufficient Permissions" 
          message="You don't have permission to manage results." 
        />
      </Card>
    );
  }

  if (!isCompleted) {
    return (
      <Card title="Results Not Available">
        <Alert 
          type="info" 
          title="Event Not Completed" 
          message={`Results can only be managed for completed ${eventType}s. Please mark this ${eventType} as completed first.`} 
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Trophy className="h-8 w-8 text-yellow-600 mr-3" />
              Results Management
            </h1>
            <p className="text-gray-600 mt-1">
              {event.name} • {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(event.eventDate || event.startDate).toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {event.participants.length} participants
              </span>
              {results?.status && (
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${results.status === RESULT_STATUS.DRAFT ? 'bg-gray-100 text-gray-800' :
                    results.status === RESULT_STATUS.CONFIRMED ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }
                `}>
                  {results.status.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={exportResults}
              disabled={participantResults.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              onClick={() => showAlert('info', 'Auto-save enabled', 'Results are automatically saved as you make changes')}
              disabled={!results}
            >
              <Save className="h-4 w-4 mr-2" />
              Auto-saved
            </Button>

            {results?.status === RESULT_STATUS.DRAFT && (
              <Button
                onClick={() => setShowPublishModal(true)}
                disabled={totals.placedParticipants === 0}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Medal className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totals.placedParticipants}</p>
            <p className="text-sm text-gray-600">Placed Participants</p>
            <p className="text-xs text-gray-500">of {totals.totalParticipants} total</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${totals.totalPrizeMoney}</p>
            <p className="text-sm text-gray-600">Total Prize Money</p>
            <p className="text-xs text-gray-500">awarded to participants</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totals.totalGames}</p>
            <p className="text-sm text-gray-600">Total Games</p>
            <p className="text-xs text-gray-500">played in {eventType}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {participantResults.reduce((sum, r) => sum + r.awards.length, 0)}
            </p>
            <p className="text-sm text-gray-600">Awards Given</p>
            <p className="text-xs text-gray-500">special recognitions</p>
          </div>
        </Card>
      </div>

      {/* Participant Results */}
      <Card title="Participant Results" subtitle="Enter placements, prizes, and performance data for each participant">
        <div className="space-y-4">
          {participantResults.map((result, index) => (
            <ParticipantResultCard
              key={result.participantId}
              result={result}
              participantName={getParticipantName(result.participantId)}
              availablePlacements={getAvailablePlacements()}
              onUpdate={(updates) => updateParticipantResultLocal(result.participantId, updates)}
              onAddAward={(award) => addAwardToParticipant(result.participantId, award)}
              onRemoveAward={(awardIndex) => removeAwardFromParticipant(result.participantId, awardIndex)}
            />
          ))}
        </div>
      </Card>

      {/* Publish Confirmation Modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Results"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Publishing Results Will:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make results visible to all participants</li>
              <li>• Send notification emails to participants</li>
              <li>• Update member statistics and win/loss records</li>
              <li>• Award prize money and recognition</li>
              <li>• Make results searchable in the system</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Note:</strong> Once published, results cannot be easily changed. 
                Make sure all placements and prize amounts are correct.
              </div>
            </div>
          </div>

          <div className="flex space-x-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowPublishModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishResults}
              loading={saving}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Publish Results
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/**
 * ParticipantResultCard - Individual participant result editing
 */
const ParticipantResultCard = ({ 
  result, 
  participantName, 
  availablePlacements,
  onUpdate,
  onAddAward,
  onRemoveAward 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);

  const calculateWinPercentage = () => {
    const totalGames = (result.gamesWon || 0) + (result.gamesLost || 0);
    if (totalGames === 0) return 0;
    return ((result.gamesWon || 0) / totalGames * 100).toFixed(1);
  };

  const handleAddAward = (award) => {
    onAddAward(award);
    setShowAwardModal(false);
  };

  return (
    <>
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{participantName}</h4>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                {result.placement && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                    {getPlacementLabel(result.placement)}
                  </span>
                )}
                {result.prizeAmount > 0 && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    ${result.prizeAmount}
                  </span>
                )}
                {result.awards.length > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                    {result.awards.length} award{result.awards.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {result.confirmed && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                <Check className="h-3 w-3 inline mr-1" />
                Confirmed
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'transform rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Placement */}
              <Select
                label="Placement"
                value={result.placement || ''}
                onChange={(e) => onUpdate({ placement: e.target.value ? parseInt(e.target.value) : null })}
                options={[
                  { value: '', label: 'No placement' },
                  ...availablePlacements
                ]}
              />

              {/* Prize Amount */}
              <Input
                label="Prize Amount ($)"
                type="number"
                min="0"
                step="0.01"
                value={result.prizeAmount || ''}
                onChange={(e) => onUpdate({ prizeAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />

              {/* Win Percentage (calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Win Percentage
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">
                  {calculateWinPercentage()}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Games Won */}
              <Input
                label="Games Won"
                type="number"
                min="0"
                value={result.gamesWon || ''}
                onChange={(e) => onUpdate({ gamesWon: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />

              {/* Games Lost */}
              <Input
                label="Games Lost"
                type="number"
                min="0"
                value={result.gamesLost || ''}
                onChange={(e) => onUpdate({ gamesLost: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />

              {/* Points For */}
              <Input
                label="Points For"
                type="number"
                min="0"
                value={result.pointsFor || ''}
                onChange={(e) => onUpdate({ pointsFor: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />

              {/* Points Against */}
              <Input
                label="Points Against"
                type="number"
                min="0"
                value={result.pointsAgainst || ''}
                onChange={(e) => onUpdate({ pointsAgainst: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            {/* Awards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Awards & Recognition
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAwardModal(true)}
                >
                  <Award className="h-4 w-4 mr-1" />
                  Add Award
                </Button>
              </div>
              
              <div className="min-h-[2rem]">
                <AwardDisplay 
                  awards={result.awards} 
                  maxDisplay={4}
                  showValues={true}
                />
              </div>
              
              {result.awards.length > 0 && (
                <div className="mt-3 space-y-2">
                  {result.awards.map((award, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {award.title || award.customTitle}
                        </span>
                        {award.description && (
                          <p className="text-xs text-gray-500">{award.description}</p>
                        )}
                        {award.value > 0 && (
                          <p className="text-xs text-green-600 font-medium">${award.value}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveAward(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                value={result.notes || ''}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                placeholder="Add any notes about this participant's performance..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Award Modal */}
      <AwardModal
        isOpen={showAwardModal}
        onClose={() => setShowAwardModal(false)}
        onAddAward={handleAddAward}
        participantName={participantName}
      />
    </>
  );
};

// Helper function for placement labels
const getPlacementLabel = (placement) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const lastDigit = placement % 10;
  const suffix = (placement >= 11 && placement <= 13) ? 'th' : (suffixes[lastDigit] || 'th');
  return `${placement}${suffix}`;
};

export default ResultsManagement;