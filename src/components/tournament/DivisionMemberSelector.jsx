// src/components/tournament/DivisionMemberSelector.jsx (FIXED)
import React, { useState } from 'react';
import { Check, X, Search, User, Users, Trophy, DollarSign } from 'lucide-react';
import { Button, Input, Select } from '../ui';

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
    <div className="space-y-4">
      {/* FIXED: Standardized division selector - removed Card wrapper */}
      <div className="bg-gray-50 rounded-lg p-3">
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
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
        )}
      </div>

      {/* FIXED: Standardized header with consistent spacing */}
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

      {/* FIXED: Standardized search input */}
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

      {/* FIXED: Standardized member list with consistent padding (p-3) */}
      <div className="border rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No members found matching your search' : 'No members available'}
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isSelected = selectedMembers.includes(member.id);
            const memberDivisions = getMemberDivisions(member.id);
            const isDisabled = !isSelected && 
              currentDivision?.maxParticipants && 
              selectedMembers.length >= currentDivision.maxParticipants;
            
            return (
              <div
                key={member.id}
                className={`
                  p-3 cursor-pointer transition-colors
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
                    
                    {/* FIXED: Standardized member info layout */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        {memberDivisions.length > 1 && (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {memberDivisions.length} divisions
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {member.skillLevel}
                      </p>
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

      {/* FIXED: Standardized selected members summary */}
      {selectedMembers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {currentDivision?.name} Participants ({selectedMembers.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map(memberId => {
              const member = members.find(m => m.id === memberId);
              if (!member) return null;
              
              return (
                <span
                  key={memberId}
                  className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  {member.firstName} {member.lastName}
                  <button
                    onClick={() => toggleMember(memberId)}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DivisionMemberSelector;