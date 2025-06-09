// src/components/results/ResultsButton.jsx (FIXED - Resolved naming conflict)
import React, { useState } from 'react';
import { Trophy, Award, Eye, Edit, Plus, BarChart3 } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { useResults } from '../../hooks/useResults';
import { canManageResults, canViewResults, canEnterResults } from '../../utils/roleUtils';
import ResultsManagement from './ResultsManagement';

/**
 * ResultsButton Component - Button to access results for completed events
 * 
 * Props:
 * - event: object - Tournament or league data
 * - eventType: string - 'tournament' or 'league'
 * - variant: string - 'manage' | 'view' | 'auto' (auto determines based on permissions)
 * - size: string - Button size
 * - className: string - Additional CSS classes
 */
const ResultsButton = ({ 
  event, 
  eventType = 'tournament',
  variant = 'auto',
  size = 'sm',
  className = ''
}) => {
  const { user } = useAuth();
  const { members } = useMembers();
  const { results, loading, hasResults } = useResults(event.id, eventType, { autoLoad: true });
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view' or 'manage'

  // Permission checks
  const canManage = canManageResults(user?.uid, members);
  const canView = canViewResults(user?.uid, members);
  const canEnter = canEnterResults(user?.uid, event, members);
  
  // Event must be completed to show results
  const isCompleted = event.status === 'completed';
  
  if (!isCompleted) {
    return null; // Don't show results button for incomplete events
  }

  // Determine button variant and action
  const getButtonConfig = () => {
    if (variant === 'manage' && canManage) {
      return {
        icon: Edit,
        label: hasResults ? 'Manage Results' : 'Enter Results',
        action: 'manage',
        variant: 'outline'
      };
    }
    
    if (variant === 'view' && canView && hasResults) {
      return {
        icon: Eye,
        label: 'View Results',
        action: 'view',
        variant: 'outline'
      };
    }
    
    // Auto mode - determine best action
    if (variant === 'auto') {
      if (canManage) {
        return {
          icon: hasResults ? Edit : Plus,
          label: hasResults ? 'Manage Results' : 'Enter Results',
          action: 'manage',
          variant: hasResults ? 'outline' : 'primary'
        };
      } else if (canView && hasResults) {
        return {
          icon: Eye,
          label: 'View Results',
          action: 'view',
          variant: 'outline'
        };
      }
    }
    
    return null;
  };

  const buttonConfig = getButtonConfig();
  
  if (!buttonConfig) {
    return null; // User doesn't have permission or results aren't available
  }

  const handleClick = () => {
    setModalMode(buttonConfig.action);
    setShowModal(true);
  };

  const IconComponent = buttonConfig.icon;

  return (
    <>
      <Button
        variant={buttonConfig.variant}
        size={size}
        onClick={handleClick}
        loading={loading}
        className={className}
      >
        <IconComponent className="h-4 w-4 mr-2" />
        {buttonConfig.label}
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'manage' ? 'Results Management' : 'Event Results'}
        size="xl"
      >
        {modalMode === 'manage' ? (
          <ResultsManagement
            event={event}
            eventType={eventType}
            onResultsUpdate={(updatedResults) => {
              // Handle results update
              console.log('Results updated:', updatedResults);
            }}
            onClose={() => setShowModal(false)}
          />
        ) : (
          <ResultsViewer
            event={event}
            eventType={eventType}
            results={results}
            onClose={() => setShowModal(false)}
          />
        )}
      </Modal>
    </>
  );
};

/**
 * ResultsViewer Component - Read-only display of event results
 * RENAMED from ResultsDisplay to avoid naming conflict
 * 
 * Props:
 * - event: object - Tournament or league data
 * - eventType: string - 'tournament' or 'league'
 * - results: object - Results data
 * - onClose: function - Called when closing
 */
const ResultsViewer = ({ 
  event, 
  eventType = 'tournament',
  results,
  onClose 
}) => {
  const { members } = useMembers();
  const { user } = useAuth();

  // Helper functions
  const getParticipantName = (participantId) => {
    const member = members.find(m => m.id === participantId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown Player';
  };

  const getPlacementLabel = (placement) => {
    if (!placement) return 'Unplaced';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const lastDigit = placement % 10;
    const suffix = (placement >= 11 && placement <= 13) ? 'th' : (suffixes[lastDigit] || 'th');
    return `${placement}${suffix} Place`;
  };

  const getCurrentUserResult = () => {
    if (!user || !results) return null;
    const member = members.find(m => m.authUid === user.uid);
    if (!member) return null;
    return results.participantResults?.find(r => r.participantId === member.id);
  };

  if (!results) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Results Available</h3>
        <p className="text-gray-500">Results have not been entered for this {eventType} yet.</p>
      </div>
    );
  }

  // Sort participants by placement (nulls last)
  const sortedResults = [...(results.participantResults || [])].sort((a, b) => {
    if (a.placement === null && b.placement === null) return 0;
    if (a.placement === null) return 1;
    if (b.placement === null) return -1;
    return a.placement - b.placement;
  });

  const currentUserResult = getCurrentUserResult();

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="text-center border-b pb-6">
        <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
        <p className="text-gray-600 mt-1">
          {eventType.charAt(0).toUpperCase() + eventType.slice(1)} Results
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {new Date(event.eventDate || event.startDate).toLocaleDateString()}
          {event.location && ` • ${event.location}`}
        </p>
      </div>

      {/* Your Result (if participant) */}
      {currentUserResult && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Your Result
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Placement:</span>
              <p className="text-blue-900">
                {currentUserResult.placement ? getPlacementLabel(currentUserResult.placement) : 'Unplaced'}
              </p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Prize:</span>
              <p className="text-blue-900">${currentUserResult.prizeAmount || 0}</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Record:</span>
              <p className="text-blue-900">
                {currentUserResult.gamesWon || 0}W - {currentUserResult.gamesLost || 0}L
              </p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Win %:</span>
              <p className="text-blue-900">
                {currentUserResult.gamesWon + currentUserResult.gamesLost > 0 
                  ? ((currentUserResult.gamesWon / (currentUserResult.gamesWon + currentUserResult.gamesLost)) * 100).toFixed(1) + '%'
                  : '0%'
                }
              </p>
            </div>
          </div>
          
          {currentUserResult.awards && currentUserResult.awards.length > 0 && (
            <div className="mt-3">
              <span className="text-blue-700 font-medium text-sm">Awards:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {currentUserResult.awards.map((award, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {award.title || award.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <BarChart3 className="h-6 w-6 text-gray-600 mx-auto mb-2" />
          <p className="text-lg font-semibold text-gray-900">{sortedResults.length}</p>
          <p className="text-sm text-gray-600">Total Participants</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <Trophy className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-lg font-semibold text-green-900">
            ${results.totalPrizeMoney || 0}
          </p>
          <p className="text-sm text-green-600">Total Prize Money</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <Award className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-lg font-semibold text-blue-900">
            {sortedResults.reduce((sum, r) => sum + (r.awards?.length || 0), 0)}
          </p>
          <p className="text-sm text-blue-600">Awards Given</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-medium text-gray-900">Final Results</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Record
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prize
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Awards
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedResults.map((result, index) => {
                const isCurrentUser = currentUserResult?.participantId === result.participantId;
                const winPercentage = result.gamesWon + result.gamesLost > 0 
                  ? ((result.gamesWon / (result.gamesWon + result.gamesLost)) * 100).toFixed(1)
                  : '0';
                
                return (
                  <tr 
                    key={result.participantId}
                    className={isCurrentUser ? 'bg-blue-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.placement ? (
                        <div className="flex items-center">
                          {result.placement <= 3 && (
                            <Trophy className={`h-4 w-4 mr-2 ${
                              result.placement === 1 ? 'text-yellow-500' :
                              result.placement === 2 ? 'text-gray-400' :
                              'text-amber-600'
                            }`} />
                          )}
                          <span className="font-medium">
                            {getPlacementLabel(result.placement)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unplaced</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getParticipantName(result.participantId)}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.gamesWon || 0}W - {result.gamesLost || 0}L
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {winPercentage}%
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.prizeAmount > 0 ? `$${result.prizeAmount}` : '—'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.awards && result.awards.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {result.awards.slice(0, 2).map((award, awardIndex) => (
                            <span 
                              key={awardIndex}
                              className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
                            >
                              {award.title || award.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                          {result.awards.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{result.awards.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Notes */}
      {results.eventNotes && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Event Notes</h4>
          <p className="text-sm text-gray-700">{results.eventNotes}</p>
        </div>
      )}
    </div>
  );
};

export { ResultsButton, ResultsViewer };
export default ResultsButton;