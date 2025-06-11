// src/components/tournament/DivisionMemberSelector.jsx
import React, { useState } from 'react';
import { Check, X, Search, User, Users, Trophy, DollarSign } from 'lucide-react';
import { Button, Input, Select, Card } from '../ui';

/**
 * DivisionMemberSelector Component - For selecting participants by division
 * Replaces MemberSelector for tournaments with divisions
 * 
 * Props:
 * - tournament: object - Tournament data with divisions
 * - members: array - Available members to select from
 * - onDivisionParticipantsChange: function - Called when division participants change
 * - loading: boolean - Whether members are loading
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
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const email = member.email.toLowerCase();
    
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  // Get current division
  const currentDivision = tournament?.divisions?.find(div => div.id === selectedDivision);
  const selectedMembers = currentDivision?.participants || [];

  // Toggle member selection for current division
  const toggleMember = (memberId) => {
    if (!currentDivision || !onDivisionParticipantsChange) return;
    
    let newSelection;
    
    if (selectedMembers.includes(memberId)) {
      // Remove member from division
      newSelection = selectedMembers.filter(id => id !== memberId);
    } else {
      // Add member to division (check max participants)
      if (currentDivision.maxParticipants && selectedMembers.length >= currentDivision.maxParticipants) {
        return; // Don't add if at max limit
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
    
    // Respect max participants limit
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

  // Calculate total fees for a member across all their divisions
  const getMemberTotalFees = (memberId) => {
    const memberDivisions = getMemberDivisions(memberId);
    return memberDivisions.reduce((total, div) => total + (div.entryFee || 0), 0);
  };

  // Format event type for display
  const formatEventType = (eventType) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="mt-2 text-gray-500">Loading members...</p>
      </div>
    );
  }

  if (!tournament?.divisions || tournament.divisions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No divisions found. Please add divisions to the tournament first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Division Selector */}
      <Card title="Select Division">
        <div className="space-y-4">
          <Select
            label="Division"
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            options={tournament.divisions.map(div => ({
              value: div.id,
              label: `${div.name} - ${formatEventType(div.eventType)} (${div.skillLevel})`
            }))}
          />
          
          {currentDivision && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p>{formatEventType(currentDivision.eventType)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Skill Level:</span>
                  <p className="capitalize">{currentDivision.skillLevel}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Entry Fee:</span>
                  <p>${currentDivision.entryFee || 0}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Participants:</span>
                  <p>
                    {selectedMembers.length}
                    {currentDivision.maxParticipants && ` / ${currentDivision.maxParticipants}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Member Selection */}
      <Card title="Manage Participants">
        <div className="space-y-4">
          {/* Header with selection count and actions */}
          <div className="flex items-center justify-between">
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
              >
                Select All
              </Button>
              <Button
                variant="outline" 
                size="sm"
                onClick={clearAll}
                disabled={selectedMembers.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Search input */}
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

          {/* Member list */}
          <div className="border rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No members found matching your search' : 'No members available'}
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedMembers.includes(member.id);
                const memberDivisions = getMemberDivisions(member.id);
                const totalFees = getMemberTotalFees(member.id);
                const isDisabled = !isSelected && 
                  currentDivision?.maxParticipants && 
                  selectedMembers.length >= currentDivision.maxParticipants;
                
                return (
                  <div
                    key={member.id}
                    className={`
                      p-4 cursor-pointer transition-colors
                      ${isSelected 
                        ? 'bg-green-50 border-green-200' 
                        : isDisabled 
                          ? 'bg-gray-50 cursor-not-allowed opacity-50'
                          : 'hover:bg-gray-50'
                      }
                    `}
                    onClick={() => !isDisabled && toggleMember(member.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className={`
                            h-8 w-8 rounded-full flex items-center justify-center
                            ${isSelected ? 'bg-green-100' : 'bg-gray-100'}
                          `}>
                            <User className={`h-4 w-4 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                        
                        {/* Member info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </p>
                            {memberDivisions.length > 1 && (
                              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                <Users className="h-3 w-3 mr-1" />
                                {memberDivisions.length} divisions
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                            <span className="capitalize">{member.skillLevel}</span>
                            {totalFees > 0 && (
                              <span className="flex items-center text-green-600">
                                <DollarSign className="h-3 w-3" />
                                {totalFees} total fees
                              </span>
                            )}
                          </div>
                          
                          {/* Show other divisions this member is in */}
                          {memberDivisions.length > 0 && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {memberDivisions.map((div) => (
                                  <span
                                    key={div.id}
                                    className={`
                                      inline-flex items-center px-2 py-1 text-xs rounded
                                      ${div.id === selectedDivision 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-600'
                                      }
                                    `}
                                  >
                                    {div.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selection indicator */}
                      <div className="flex-shrink-0">
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
              })
            )}
          </div>
        </div>
      </Card>

      {/* Selected members summary for current division */}
      {selectedMembers.length > 0 && (
        <Card title={`${currentDivision?.name} Participants`}>
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              {selectedMembers.length} participant{selectedMembers.length !== 1 ? 's' : ''} selected
              {currentDivision?.entryFee > 0 && (
                <span className="ml-2 text-green-600 font-medium">
                  (${(selectedMembers.length * currentDivision.entryFee).toFixed(2)} total expected)
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedMembers.map(memberId => {
                const member = members.find(m => m.id === memberId);
                if (!member) return null;
                
                return (
                  <div
                    key={memberId}
                    className="flex items-center justify-between p-2 bg-green-50 rounded border"
                  >
                    <span className="text-sm font-medium text-green-800">
                      {member.firstName} {member.lastName}
                    </span>
                    <button
                      onClick={() => toggleMember(memberId)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Tournament Summary */}
      <Card title="Tournament Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {tournament.divisions.length}
            </div>
            <div className="text-sm text-gray-600">Total Divisions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tournament.divisions.reduce((total, div) => 
                total + (div.participants?.length || 0), 0
              )}
            </div>
            <div className="text-sm text-gray-600">Total Participants</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${tournament.divisions.reduce((total, div) => 
                total + ((div.participants?.length || 0) * (div.entryFee || 0)), 0
              ).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Expected</div>
          </div>
        </div>
        
        {/* Division breakdown */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Division Breakdown:</h4>
          {tournament.divisions.map((division) => (
            <div key={division.id} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                {division.name} ({formatEventType(division.eventType)})
              </span>
              <span className="text-gray-900">
                {division.participants?.length || 0} participants
                {division.entryFee > 0 && (
                  <span className="ml-2 text-green-600">
                    (${((division.participants?.length || 0) * division.entryFee).toFixed(2)})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DivisionMemberSelector;