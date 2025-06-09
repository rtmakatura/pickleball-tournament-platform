// src/components/league/LeagueMemberSelector.jsx
import React, { useState } from 'react';
import { Check, X, Search, User, Users } from 'lucide-react';
import { Button, Input } from '../ui';

/**
 * LeagueMemberSelector Component - For selecting league participants
 * 
 * Props:
 * - members: array - Available members to select from
 * - selectedMembers: array - Currently selected member IDs
 * - onSelectionChange: function - Called when selection changes
 * - maxSelections: number - Maximum number of members to select
 * - loading: boolean - Whether members are loading
 */
const LeagueMemberSelector = ({
  members = [],
  selectedMembers = [],
  onSelectionChange,
  maxSelections = null,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter members based on search term
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const email = member.email.toLowerCase();
    
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  // Toggle member selection
  const toggleMember = (memberId) => {
    let newSelection;
    
    if (selectedMembers.includes(memberId)) {
      // Remove member from selection
      newSelection = selectedMembers.filter(id => id !== memberId);
    } else {
      // Add member to selection (if under max limit)
      if (maxSelections && selectedMembers.length >= maxSelections) {
        return; // Don't add if at max limit
      }
      newSelection = [...selectedMembers, memberId];
    }
    
    onSelectionChange(newSelection);
  };

  // Select all filtered members
  const selectAll = () => {
    const availableIds = filteredMembers.map(m => m.id);
    let newSelection = [...new Set([...selectedMembers, ...availableIds])];
    
    // Respect max selections limit
    if (maxSelections && newSelection.length > maxSelections) {
      newSelection = newSelection.slice(0, maxSelections);
    }
    
    onSelectionChange(newSelection);
  };

  // Clear all selections
  const clearAll = () => {
    onSelectionChange([]);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-500">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with selection count and actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 flex items-center">
          <Users className="h-4 w-4 mr-1" />
          {selectedMembers.length} selected
          {maxSelections && ` of ${maxSelections} max`}
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
      <div className="border rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No members found matching your search' : 'No members available'}
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isSelected = selectedMembers.includes(member.id);
            const isDisabled = !isSelected && maxSelections && selectedMembers.length >= maxSelections;
            
            return (
              <div
                key={member.id}
                className={`
                  p-3 flex items-center justify-between cursor-pointer transition-colors
                  ${isSelected 
                    ? 'bg-blue-50 border-blue-200' 
                    : isDisabled 
                      ? 'bg-gray-50 cursor-not-allowed opacity-50'
                      : 'hover:bg-gray-50'
                  }
                `}
                onClick={() => !isDisabled && toggleMember(member.id)}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className={`
                      h-8 w-8 rounded-full flex items-center justify-center
                      ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                    `}>
                      <User className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                  </div>
                  
                  {/* Member info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {member.email}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span className="capitalize">{member.skillLevel}</span>
                      <span>•</span>
                      <span className="capitalize">{member.role}</span>
                    </div>
                  </div>
                </div>

                {/* Selection indicator */}
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected members summary */}
      {selectedMembers.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Selected League Members ({selectedMembers.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map(memberId => {
              const member = members.find(m => m.id === memberId);
              if (!member) return null;
              
              return (
                <span
                  key={memberId}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {member.firstName} {member.lastName}
                  <button
                    onClick={() => toggleMember(memberId)}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* League-specific guidance */}
      {selectedMembers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1">League Registration Notes</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Members will be added to the league roster upon creation</li>
            <li>• Registration fees (if any) will be tracked per participant</li>
            <li>• You can add or remove members later from the league details</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default LeagueMemberSelector;