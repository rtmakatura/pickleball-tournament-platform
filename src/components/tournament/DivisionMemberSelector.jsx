// src/components/tournament/DivisionMemberSelector.jsx (UPDATED - Removed debug info completely)
import React, { useState } from 'react';
import { Check, X, Search, User, Users, Trophy, DollarSign } from 'lucide-react';
import { Button, Input } from '../ui';
import CustomDivisionDropdown from './CustomDivisionDropdown'; // Import our custom dropdown

// FIXED: Simplified styling to match parent form's consistent 24px spacing system
const divisionSelectorStyles = `
  /* FIXED: Consistent with parent form styling - exactly 24px spacing */
  .division-selector-input-group {
    margin-bottom: 24px;
  }
  
  .division-selector-input-group:last-child {
    margin-bottom: 0;
  }
  
  /* FIXED: Enhanced member cards with consistent spacing */
  .division-member-card {
    padding: 16px;
    border-radius: 12px;
    transition: all 0.2s ease;
    border: 1px solid #e5e7eb;
  }
  
  .division-member-card:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
  
  .division-member-card.selected {
    background-color: #ecfdf5;
    border-color: #10b981;
    box-shadow: 0 0 0 1px #10b981;
  }
  
  .division-member-card.disabled {
    background-color: #f9fafb;
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* FIXED: Enhanced division info card - matches parent form sections */
  .division-info-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
  }
  
  /* FIXED: Consistent summary card styling */
  .division-summary-card {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }
  
  /* FIXED: Mobile-optimized touch targets */
  @media (max-width: 768px) {
    .division-touch-target {
      min-height: 48px;
      min-width: 48px;
    }
    
    .division-member-card {
      padding: 20px;
      margin-bottom: 16px;
    }
  }
  
  /* FIXED: Consistent member list styling */
  .division-member-list {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    max-height: 320px;
    overflow-y: auto;
  }
  
  .division-member-list::-webkit-scrollbar {
    width: 6px;
  }
  
  .division-member-list::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  .division-member-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .division-member-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  /* FIXED: Custom dropdown container to ensure proper containment */
  .custom-division-dropdown-container {
    position: relative;
    z-index: 10;
    max-width: 100%;
    overflow: visible;
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: divisionSelectorStyles }} />
);

/**
 * DivisionMemberSelector Component - For selecting participants by division
 * UPDATED: Removed all debug information completely
 */
const DivisionMemberSelector = ({
  tournament,
  members = [],
  onDivisionParticipantsChange,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState(
    tournament?.divisions?.[0]?.id || ''
  );

  // Filter members based on search term
  const filteredMembers = React.useMemo(() => {
    if (!members || !Array.isArray(members)) {
      return [];
    }

    if (!searchTerm.trim()) return members;

    const searchLower = searchTerm.toLowerCase();
    return members.filter(member => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const email = member.email.toLowerCase();
      
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  }, [members, searchTerm]);

  // Get current division
  const currentDivision = tournament?.divisions?.find(div => div.id === selectedDivision);
  const selectedMembers = currentDivision?.participants || [];

  // Toggle member selection for current division
  const toggleMember = (memberId) => {
    if (!currentDivision || !onDivisionParticipantsChange) return;
    
    let newSelection;
    
    if (selectedMembers.includes(memberId)) {
      newSelection = selectedMembers.filter(id => id !== memberId);
    } else {
      if (currentDivision.maxParticipants && selectedMembers.length >= currentDivision.maxParticipants) {
        return;
      }
      newSelection = [...selectedMembers, memberId];
    }
    
    onDivisionParticipantsChange(selectedDivision, newSelection);
  };

  // Select all filtered members for current division
  const selectAll = () => {
    if (!currentDivision || !onDivisionParticipantsChange) return;
    
    const availableIds = filteredMembers.map(m => m.id);
    let newSelection = [...new Set([...selectedMembers, ...availableIds])];
    
    if (currentDivision.maxParticipants && newSelection.length > currentDivision.maxParticipants) {
      newSelection = newSelection.slice(0, currentDivision.maxParticipants);
    }
    
    onDivisionParticipantsChange(selectedDivision, newSelection);
  };

  // Clear all selections for current division
  const clearAll = () => {
    if (!currentDivision || !onDivisionParticipantsChange) return;
    onDivisionParticipantsChange(selectedDivision, []);
  };

  // Get member's divisions in this tournament
  const getMemberDivisions = (memberId) => {
    return tournament?.divisions?.filter(div => 
      div.participants?.includes(memberId)
    ) || [];
  };

  // Format event type for display
  const formatEventType = (eventType) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // FIXED: Create better formatted division options for the custom dropdown
  const getDivisionOptions = () => {
    if (!tournament?.divisions || !Array.isArray(tournament.divisions)) return [];
    
    return tournament.divisions.map(div => {
      // Create a more readable, shorter label format
      const eventTypeFormatted = formatEventType(div.eventType);
      const skillFormatted = div.skillLevel.charAt(0).toUpperCase() + div.skillLevel.slice(1);
      
      // Format: "Division Name (Mixed Doubles - Intermediate)"
      let label = div.name;
      
      if (eventTypeFormatted && skillFormatted) {
        label += ` (${eventTypeFormatted} - ${skillFormatted})`;
      }
      
      if (div.entryFee > 0) {
        label += ` - $${div.entryFee}`;
      }
      
      return {
        value: div.id,
        label: label
      };
    });
  };

  if (loading) {
    return (
      <>
        <StyleSheet />
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-500">Loading members...</p>
        </div>
      </>
    );
  }

  if (!tournament?.divisions || !Array.isArray(tournament.divisions) || tournament.divisions.length === 0) {
    return (
      <>
        <StyleSheet />
        <div className="text-center py-8 text-gray-500">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No divisions found. Please add divisions to the tournament first.</p>
        </div>
      </>
    );
  }

  // Show message if no members available
  if (!members || members.length === 0) {
    return (
      <>
        <StyleSheet />
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No members available</p>
          <p className="text-sm mt-1">Add members to your organization first, then return here to assign them to divisions.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <StyleSheet />
      <div className="space-y-0">
        {/* FIXED: Enhanced division selector with CUSTOM DROPDOWN instead of native select */}
        <div className="division-info-card">
          <div className="division-selector-input-group">
            <div className="custom-division-dropdown-container">
              <CustomDivisionDropdown
                label="Select Division"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                options={getDivisionOptions()}
                placeholder="Choose a division..."
                className="w-full"
              />
            </div>
          </div>
          
          {currentDivision && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-900">{formatEventType(currentDivision.eventType)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Skill Level:</span>
                <p className="text-gray-900 capitalize">{currentDivision.skillLevel}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Entry Fee:</span>
                <p className="text-gray-900">${currentDivision.entryFee || 0}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Participants:</span>
                <p className="text-gray-900">
                  {selectedMembers.length}
                  {currentDivision.maxParticipants && ` / ${currentDivision.maxParticipants}`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FIXED: Enhanced header with consistent spacing */}
        <div className="division-selector-input-group">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {selectedMembers.length} selected
              {currentDivision?.maxParticipants && ` of ${currentDivision.maxParticipants} max`}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={filteredMembers.length === 0}
                className="division-touch-target"
              >
                Select All
              </Button>
              <Button
                variant="outline" 
                size="sm"
                onClick={clearAll}
                disabled={selectedMembers.length === 0}
                className="division-touch-target"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* FIXED: Enhanced search input with consistent styling */}
        <div className="division-selector-input-group">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FIXED: Enhanced member list with consistent styling */}
        <div className="division-selector-input-group">
          <div className="division-member-list">
            {filteredMembers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchTerm ? 'No members found matching your search' : 'No members available'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredMembers.map((member) => {
                  const isSelected = selectedMembers.includes(member.id);
                  const memberDivisions = getMemberDivisions(member.id);
                  const isDisabled = !isSelected && 
                    currentDivision?.maxParticipants && 
                    selectedMembers.length >= currentDivision.maxParticipants;
                  
                  return (
                    <div
                      key={member.id}
                      className={`
                        division-member-card cursor-pointer
                        ${isSelected ? 'selected' : ''}
                        ${isDisabled ? 'disabled' : ''}
                      `}
                      onClick={() => !isDisabled && toggleMember(member.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className={`
                              h-8 w-8 rounded-full flex items-center justify-center
                              ${isSelected ? 'bg-green-100' : 'bg-gray-100'}
                            `}>
                              <User className={`h-4 w-4 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                          </div>
                          
                          {/* FIXED: Enhanced member info layout */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {member.firstName} {member.lastName}
                              </p>
                              {memberDivisions.length > 1 && (
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {memberDivisions.length} divisions
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{member.email}</p>
                            <p className="text-xs text-gray-400 capitalize">
                              {member.skillLevel}
                            </p>
                          </div>
                        </div>

                        {/* Selection indicator */}
                        <div className="flex-shrink-0 ml-3">
                          {isSelected ? (
                            <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FIXED: Enhanced selected members summary */}
        {selectedMembers.length > 0 && (
          <div className="division-summary-card">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              {currentDivision?.name} Participants ({selectedMembers.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map(memberId => {
                const member = members.find(m => m.id === memberId);
                const displayName = member ? 
                  `${member.firstName} ${member.lastName}` : 
                  `Former Member (${memberId.slice(-6)})`;
                
                return (
                  <span
                    key={memberId}
                    className={`inline-flex items-center px-3 py-1.5 text-sm rounded-full ${
                      member ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {displayName}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMember(memberId);
                      }}
                      className="ml-2 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* FIXED: Enhanced guidance section */}
        {currentDivision && (
          <div className="division-info-card">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-yellow-600" />
              Division Information
            </h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Participants will be registered for the <strong>{currentDivision.name}</strong> division</p>
              {currentDivision.entryFee > 0 && (
                <p>• Entry fee of <strong>${currentDivision.entryFee}</strong> per participant will be tracked</p>
              )}
              <p>• You can modify participant lists after tournament creation</p>
              {currentDivision.maxParticipants && (
                <p>• Maximum <strong>{currentDivision.maxParticipants}</strong> participants allowed</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DivisionMemberSelector;