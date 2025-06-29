// src/components/league/LeagueMemberSelector.jsx (UPDATED - Removed League Registration Notes section)
import React, { useState } from 'react';
import { Check, X, Search, User, Users } from 'lucide-react';
import { Button, Input } from '../ui';

// FIXED: Enhanced styling to match parent modal and form consistency
const leagueSelectorStyles = `
  /* FIXED: Consistent with parent form styling - 24px spacing */
  .league-selector-input-group {
    margin-bottom: 24px;
  }
  
  .league-selector-input-group:last-child {
    margin-bottom: 0;
  }
  
  /* FIXED: Enhanced member cards with consistent spacing */
  .league-member-card {
    padding: 16px;
    border-radius: 12px;
    transition: all 0.2s ease;
    border: 1px solid #e5e7eb;
  }
  
  .league-member-card:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
  
  .league-member-card.selected {
    background-color: #eff6ff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
  
  .league-member-card.disabled {
    background-color: #f9fafb;
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* FIXED: Enhanced summary card styling */
  .league-summary-card {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }
  
  /* FIXED: Mobile-optimized touch targets */
  @media (max-width: 768px) {
    .league-touch-target {
      min-height: 48px;
      min-width: 48px;
    }
    
    .league-member-card {
      padding: 20px;
      margin-bottom: 16px;
    }
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: leagueSelectorStyles }} />
);

/**
 * LeagueMemberSelector Component - For selecting league participants
 * UPDATED: Removed League Registration Notes section
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
      <>
        <StyleSheet />
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading members...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <StyleSheet />
      <div className="space-y-0">
        {/* FIXED: Enhanced header with consistent spacing */}
        <div className="league-selector-input-group">
          <div className="flex items-center justify-between mb-4">
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
                className="league-touch-target"
              >
                Select All
              </Button>
              <Button
                variant="outline" 
                size="sm"
                onClick={clearAll}
                disabled={selectedMembers.length === 0}
                className="league-touch-target"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* FIXED: Enhanced search input with consistent styling */}
        <div className="league-selector-input-group">
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
        <div className="league-selector-input-group">
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
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
                      league-member-card cursor-pointer
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
                            ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                          `}>
                            <User className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                        
                        {/* FIXED: Enhanced member info layout */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {member.email}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {member.skillLevel} • {member.role}
                          </p>
                        </div>
                      </div>

                      {/* Selection indicator */}
                      <div className="flex-shrink-0 ml-3">
                        {isSelected ? (
                          <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
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

        {/* FIXED: Enhanced selected members summary */}
        {selectedMembers.length > 0 && (
          <div className="league-summary-card">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Selected League Members ({selectedMembers.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map(memberId => {
                const member = members.find(m => m.id === memberId);
                if (!member) return null;
                
                return (
                  <span
                    key={memberId}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {member.firstName} {member.lastName}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMember(memberId);
                      }}
                      className="ml-2 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
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
    </>
  );
};

export default LeagueMemberSelector;