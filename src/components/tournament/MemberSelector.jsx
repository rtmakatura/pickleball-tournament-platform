// src/components/tournament/MemberSelector.jsx (Reference - Already Correct)
import React, { useState } from 'react';
import { Check, X, Search, User } from 'lucide-react';
import { Button, Input } from '../ui';

/**
 * MemberSelector Component - For selecting tournament participants
 * 
 * Props:
 * - members: array - Available members to select from
 * - selectedMembers: array - Currently selected member IDs
 * - onSelectionChange: function - Called when selection changes
 * - maxSelections: number - Maximum number of members to select
 * - loading: boolean - Whether members are loading
 */
const MemberSelector = ({
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
      newSelection = selectedMembers.filter(id => id !== memberId);
    } else {
      if (maxSelections && selectedMembers.length >= maxSelections) {
        return;
      }
      newSelection = [...selectedMembers, memberId];
    }
    
    onSelectionChange(newSelection);
  };

  // Select all filtered members
  const selectAll = () => {
    const availableIds = filteredMembers.map(m => m.id);
    let newSelection = [...new Set([...selectedMembers, ...availableIds])];
    
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="mt-2 text-gray-500">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with selection count and actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
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
                    ? 'bg-green-50 border-green-200' 
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
                      ${isSelected ? 'bg-green-100' : 'bg-gray-100'}
                    `}>
                      <User className={`h-4 w-4 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
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
            );
          })
        )}
      </div>

      {/* Selected members summary */}
      {selectedMembers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Selected Members ({selectedMembers.length})
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

export default MemberSelector;