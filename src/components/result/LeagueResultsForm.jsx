// src/components/result/LeagueResultsForm.jsx (IMPROVED - Better Member Name Handling)
import React, { useState, useEffect } from 'react';
import { Users, Calendar, X, Save, AlertCircle, Target } from 'lucide-react';

const LeagueResultsForm = ({ 
  league, 
  members = [], 
  onSubmit, 
  onCancel, 
  isLoading = false,
  existingResults = null 
}) => {
  // IMPROVED: Better member name extraction function with deleted user handling
  const getMemberName = (member) => {
    if (!member) return 'Former Member';
    
    // Try different name properties in order of preference
    if (member.name) return member.name;
    if (member.firstName && member.lastName) return `${member.firstName} ${member.lastName}`;
    if (member.firstName) return member.firstName;
    if (member.fullName) return member.fullName;
    if (member.displayName) return member.displayName;
    if (member.email) return member.email; // fallback to email if no name
    
    return 'Former Member';
  };

  const [formData, setFormData] = useState({
    participantPlacements: [],
    totalTeams: 0,
    seasonInfo: {
      totalWeeks: 0,
      regularSeasonWeeks: 0,
      playoffWeeks: 0,
      startDate: '',
      endDate: ''
    },
    notes: '',
    completedDate: new Date().toISOString().split('T')[0],
    season: ''
  });
  const [errors, setErrors] = useState({});

  const calculateLeagueWeeks = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate.seconds * 1000);
    const end = new Date(endDate.seconds * 1000);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  const getCurrentSeason = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (month >= 3 && month <= 5) return `Spring ${year}`;
    if (month >= 6 && month <= 8) return `Summer ${year}`;
    if (month >= 9 && month <= 11) return `Fall ${year}`;
    return `Winter ${year}`;
  };

  // IMPROVED: Helper function to create placement results with deleted user handling
  const generatePlacementResults = (league) => {
    if (!league.participants || league.participants.length === 0) {
      return [];
    }

    console.log('League participants:', league.participants);
    console.log('Available members:', members);

    // Create placement entries for each participant
    return league.participants.map((participantId) => {
      // Try to find member by different ID fields
      const member = members.find(m => 
        m.id === participantId || 
        m._id === participantId || 
        m.memberId === participantId ||
        m.userId === participantId
      );
      
      let memberName;
      if (member) {
        memberName = getMemberName(member);
      } else {
        // Handle deleted/missing members gracefully
        memberName = `Former Member (${participantId.slice(-6)})`;
      }
      
      console.log(`Participant ${participantId} -> Member:`, member, `-> Name: ${memberName}`);
      
      return {
        participantId,
        participantName: memberName,
        placement: null,
        notes: ''
      };
    });
  };

  // Initialize form data
  useEffect(() => {
    if (existingResults) {
      setFormData({
        participantPlacements: existingResults.participantPlacements || [],
        totalTeams: existingResults.totalTeams || 0,
        seasonInfo: existingResults.seasonInfo || {
          totalWeeks: 0,
          regularSeasonWeeks: 0,
          playoffWeeks: 0,
          startDate: '',
          endDate: ''
        },
        notes: existingResults.notes || '',
        completedDate: existingResults.completedDate ? 
          new Date(existingResults.completedDate.seconds * 1000).toISOString().split('T')[0] :
          new Date().toISOString().split('T')[0],
        season: existingResults.season || ''
      });
    } else {
      // Auto-generate placements from league participants
      const participantPlacements = generatePlacementResults(league);
      
      // Initialize season info from league data
      const seasonInfo = {
        totalWeeks: calculateLeagueWeeks(league?.startDate, league?.endDate),
        regularSeasonWeeks: 0,
        playoffWeeks: 0,
        startDate: league?.startDate ? 
          new Date(league.startDate.seconds * 1000).toISOString().split('T')[0] : '',
        endDate: league?.endDate ? 
          new Date(league.endDate.seconds * 1000).toISOString().split('T')[0] : ''
      };
      
      setFormData(prev => ({
        ...prev,
        participantPlacements,
        totalTeams: Math.ceil(participantPlacements.length / 2),
        season: getCurrentSeason(),
        seasonInfo
      }));
    }
  }, [existingResults, league, members]);

  const updateParticipantPlacement = (participantId, field, value) => {
    setFormData(prev => ({
      ...prev,
      participantPlacements: prev.participantPlacements.map(participant => 
        participant.participantId === participantId
          ? { ...participant, [field]: field === 'placement' ? parseInt(value) || null : value }
          : participant
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Check if participants exist
    if (formData.participantPlacements.length === 0) {
      newErrors.participants = 'No participants found for this league';
    }

    // Check if at least one placement is entered
    const hasAnyPlacements = formData.participantPlacements.some(p => p.placement !== null);
    if (!hasAnyPlacements) {
      newErrors.general = 'At least one participant must have a placement entered';
    }

    // Check season
    if (!formData.season.trim()) {
      newErrors.season = 'Season is required';
    }

    // Validate total teams
    if (formData.totalTeams < 1) {
      newErrors.totalTeams = 'Total teams must be at least 1';
    }

    // Validate each participant placement
    formData.participantPlacements.forEach((participant, index) => {
      if (participant.placement !== null) {
        if (participant.placement < 1) {
          newErrors[`participant_${index}_placement`] = 'Placement must be at least 1';
        }
        if (participant.placement > formData.totalTeams) {
          newErrors[`participant_${index}_placement`] = 
            `Placement cannot be higher than total teams (${formData.totalTeams})`;
        }
      }
    });

    // Validate completed date
    if (!formData.completedDate) {
      newErrors.completedDate = 'Completion date is required';
    }

    // Validate season info
    if (formData.seasonInfo.totalWeeks < 0) {
      newErrors.totalWeeks = 'Total weeks cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const resultData = {
      leagueId: league.id,
      leagueName: league.name,
      participantPlacements: formData.participantPlacements.filter(p => p.placement !== null),
      totalTeams: formData.totalTeams,
      seasonInfo: {
        ...formData.seasonInfo,
        totalWeeks: Number(formData.seasonInfo.totalWeeks) || 0,
        regularSeasonWeeks: Number(formData.seasonInfo.regularSeasonWeeks) || 0,
        playoffWeeks: Number(formData.seasonInfo.playoffWeeks) || 0
      },
      notes: formData.notes.trim(),
      completedDate: new Date(formData.completedDate),
      season: formData.season.trim(),
      type: 'league'
    };

    onSubmit(resultData);
  };

  const getPlacementSuffix = (number) => {
    if (number % 100 >= 11 && number % 100 <= 13) return 'th';
    switch (number % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-green-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {existingResults ? 'Edit' : 'Enter'} League Results
              </h2>
              <p className="text-sm text-gray-600">
                {league.name} - Final Standings
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* IMPROVED: Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h4>
              <p className="text-xs text-yellow-700">League participants: {league?.participants?.length || 0}</p>
              <p className="text-xs text-yellow-700">Available members: {members?.length || 0}</p>
              <p className="text-xs text-yellow-700">Generated placements: {formData.participantPlacements.length}</p>
            </div>
          )}

          {/* League Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">
                  {league?.startDate ? 
                    new Date(league.startDate.seconds * 1000).toLocaleDateString() :
                    'TBD'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Participants:</span>
                <span className="font-medium">{formData.participantPlacements.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{league?.eventType?.replace('_', ' ') || 'Mixed Doubles'}</span>
              </div>
            </div>
          </div>

          {/* Season and Completion Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Season
              </label>
              <input
                type="text"
                value={formData.season}
                onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
                placeholder="e.g., Spring 2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.season && (
                <p className="mt-1 text-sm text-red-600">{errors.season}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion Date
              </label>
              <input
                type="date"
                value={formData.completedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, completedDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.completedDate && (
                <p className="mt-1 text-sm text-red-600">{errors.completedDate}</p>
              )}
            </div>
          </div>

          {/* Total Teams */}
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Teams in League
            </label>
            <input
              type="number"
              min="1"
              value={formData.totalTeams}
              onChange={(e) => setFormData(prev => ({ ...prev, totalTeams: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 12"
            />
            {errors.totalTeams && (
              <p className="mt-1 text-sm text-red-600">{errors.totalTeams}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Total number of teams that competed in this league
            </p>
          </div>

          {/* General Errors */}
          {(errors.general || errors.participants) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{errors.general || errors.participants}</p>
            </div>
          )}

          {/* Participant Placements */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Participant Final Standings</h3>

            {formData.participantPlacements.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No participants registered for this league</p>
                <p className="text-sm text-gray-400">Add participants to this league in league setup</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.participantPlacements.map((participant, index) => (
                  <div
                    key={participant.participantId}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      {/* Participant Name - IMPROVED display */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Participant
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
                              {participant.participantName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {participant.participantName}
                          </span>
                          {participant.participantName === 'Unknown Member' && (
                            <span className="text-xs text-red-500">(Member not found)</span>
                          )}
                        </div>
                      </div>

                      {/* Placement */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Final Placement
                        </label>
                        <select
                          value={participant.placement || ''}
                          onChange={(e) => updateParticipantPlacement(
                            participant.participantId, 
                            'placement', 
                            e.target.value
                          )}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select placement...</option>
                          {Array.from({ length: formData.totalTeams }, (_, i) => i + 1).map(place => (
                            <option key={place} value={place}>
                              {place}{getPlacementSuffix(place)} place
                            </option>
                          ))}
                        </select>
                        {errors[`participant_${index}_placement`] && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[`participant_${index}_placement`]}
                          </p>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={participant.notes}
                          onChange={(e) => updateParticipantPlacement(
                            participant.participantId, 
                            'notes', 
                            e.target.value
                          )}
                          placeholder="e.g., great improvement, consistent play"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Placement Preview */}
                    {participant.placement && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {participant.participantName} finished {participant.placement}{getPlacementSuffix(participant.placement)} out of {formData.totalTeams} teams
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* League Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              League Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Add any notes about the league season..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : existingResults ? 'Update Results' : 'Save Results'}</span>
        </button>
      </div>
    </div>
  );
};

export default LeagueResultsForm;