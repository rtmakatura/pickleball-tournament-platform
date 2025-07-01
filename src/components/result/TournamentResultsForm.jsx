// src/components/result/TournamentResultsForm.jsx - SIMPLIFIED FOR PLACEMENT ONLY
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, X, Save, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const TournamentResultsForm = ({ 
  tournament, 
  members = [], 
  onSubmit, 
  onCancel, 
  isLoading = false,
  existingResults = null 
}) => {
  const [formData, setFormData] = useState({
    divisionResults: [],
    notes: '',
    completedDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});
  const [expandedDivisions, setExpandedDivisions] = useState({});

  // Helper function to create placement results from tournament participants
  const generatePlacementResults = (division) => {
    if (!division.participants || division.participants.length === 0) {
      return {
        totalTeams: 0,
        participantPlacements: []
      };
    }

    // Create placement entries for each participant
    const participantPlacements = division.participants.map((participantId, index) => {
      const member = members.find(m => m.id === participantId);
      return {
        participantId,
        participantName: member ? member.name : 'Unknown Member',
        placement: null, // To be filled in by user
        notes: ''
      };
    });

    return {
      totalTeams: Math.ceil(division.participants.length / 2), // Estimate teams (can be overridden)
      participantPlacements
    };
  };

  // Initialize form data
  useEffect(() => {
    if (existingResults) {
      setFormData({
        divisionResults: existingResults.divisionResults || [],
        notes: existingResults.notes || '',
        completedDate: existingResults.completedDate ? 
          new Date(existingResults.completedDate.seconds * 1000).toISOString().split('T')[0] :
          new Date().toISOString().split('T')[0]
      });
    } else {
      // Generate initial placement structure from tournament divisions
      const initialDivisionResults = (tournament?.divisions || []).map(division => {
        const placementData = generatePlacementResults(division);
        return {
          divisionId: division.id,
          divisionName: division.name,
          eventType: division.eventType,
          skillLevel: division.skillLevel,
          totalTeams: placementData.totalTeams,
          participantPlacements: placementData.participantPlacements
        };
      });
      
      setFormData(prev => ({
        ...prev,
        divisionResults: initialDivisionResults
      }));

      // Expand all divisions by default
      const initialExpanded = {};
      initialDivisionResults.forEach(div => {
        initialExpanded[div.divisionId] = true;
      });
      setExpandedDivisions(initialExpanded);
    }
  }, [existingResults, tournament, members]);

  const updateTotalTeams = (divisionId, totalTeams) => {
    setFormData(prev => ({
      ...prev,
      divisionResults: prev.divisionResults.map(div => 
        div.divisionId === divisionId 
          ? { ...div, totalTeams: parseInt(totalTeams) || 0 }
          : div
      )
    }));
  };

  const updateParticipantPlacement = (divisionId, participantId, field, value) => {
    setFormData(prev => ({
      ...prev,
      divisionResults: prev.divisionResults.map(div => 
        div.divisionId === divisionId 
          ? {
              ...div,
              participantPlacements: div.participantPlacements.map(participant => 
                participant.participantId === participantId
                  ? { ...participant, [field]: field === 'placement' ? parseInt(value) || null : value }
                  : participant
              )
            }
          : div
      )
    }));
  };

  const toggleDivisionExpansion = (divisionId) => {
    setExpandedDivisions(prev => ({
      ...prev,
      [divisionId]: !prev[divisionId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Check if at least one division has placements
    const hasAnyPlacements = formData.divisionResults.some(div => 
      div.participantPlacements.some(p => p.placement !== null)
    );
    
    if (!hasAnyPlacements) {
      newErrors.general = 'At least one participant must have a placement entered';
    }

    // Validate each division
    formData.divisionResults.forEach((division, divIndex) => {
      if (division.totalTeams < 1) {
        newErrors[`div_${divIndex}_totalTeams`] = 'Total teams must be at least 1';
      }

      division.participantPlacements.forEach((participant, participantIndex) => {
        if (participant.placement !== null) {
          if (participant.placement < 1) {
            newErrors[`div_${divIndex}_participant_${participantIndex}_placement`] = 'Placement must be at least 1';
          }
          if (participant.placement > division.totalTeams) {
            newErrors[`div_${divIndex}_participant_${participantIndex}_placement`] = 
              `Placement cannot be higher than total teams (${division.totalTeams})`;
          }
        }
      });
    });

    // Validate completed date
    if (!formData.completedDate) {
      newErrors.completedDate = 'Completion date is required';
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
      tournamentId: tournament?.id || 'unknown',
      tournamentName: tournament?.name || 'Unknown Tournament',
      divisionResults: formData.divisionResults.map(division => ({
        divisionId: division.divisionId,
        divisionName: division.divisionName,
        eventType: division.eventType,
        skillLevel: division.skillLevel,
        totalTeams: division.totalTeams,
        participantPlacements: division.participantPlacements.filter(p => p.placement !== null)
      })),
      notes: formData.notes.trim(),
      completedDate: new Date(formData.completedDate),
      type: 'tournament'
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
    <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {existingResults ? 'Edit' : 'Enter'} Tournament Results
              </h2>
              <p className="text-sm text-gray-600">
                {tournament?.name || 'Tournament'} - Final Placements
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
          {/* Tournament Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {tournament?.eventDate ? 
                    new Date(tournament.eventDate.seconds * 1000).toLocaleDateString() :
                    'TBD'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Divisions:</span>
                <span className="font-medium">{formData.divisionResults.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Total Participants:</span>
                <span className="font-medium">
                  {formData.divisionResults.reduce((sum, div) => sum + div.participantPlacements.length, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Completion Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tournament Completion Date
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

          {/* General Errors */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Division Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Division Results</h3>
            
            {formData.divisionResults.map((division, divIndex) => (
              <div key={division.divisionId} className="border border-gray-200 rounded-lg">
                {/* Division Header */}
                <button
                  type="button"
                  onClick={() => toggleDivisionExpansion(division.divisionId)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">{division.divisionName}</h4>
                      <p className="text-sm text-gray-500">
                        {division.eventType} • {division.skillLevel} • {division.participantPlacements.length} participants
                      </p>
                    </div>
                  </div>
                  {expandedDivisions[division.divisionId] ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Division Content */}
                {expandedDivisions[division.divisionId] && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    {/* Total Teams Input */}
                    <div className="mb-4 max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Teams in Division
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={division.totalTeams}
                        onChange={(e) => updateTotalTeams(division.divisionId, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 8"
                      />
                      {errors[`div_${divIndex}_totalTeams`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`div_${divIndex}_totalTeams`]}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Total number of teams that competed in this division
                      </p>
                    </div>

                    {/* Participant Placements */}
                    {division.participantPlacements.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No participants registered for this division</p>
                        <p className="text-sm text-gray-400">Add participants to this division in tournament setup</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-900">Participant Placements</h5>
                        {division.participantPlacements.map((participant, participantIndex) => (
                          <div key={participant.participantId} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                              {/* Participant Name */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Participant
                                </label>
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <span className="font-medium text-gray-900">
                                    {participant.participantName}
                                  </span>
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
                                    division.divisionId, 
                                    participant.participantId, 
                                    'placement', 
                                    e.target.value
                                  )}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select placement...</option>
                                  {Array.from({ length: division.totalTeams }, (_, i) => i + 1).map(place => (
                                    <option key={place} value={place}>
                                      {place}{getPlacementSuffix(place)} place
                                    </option>
                                  ))}
                                </select>
                                {errors[`div_${divIndex}_participant_${participantIndex}_placement`] && (
                                  <p className="mt-1 text-sm text-red-600">
                                    {errors[`div_${divIndex}_participant_${participantIndex}_placement`]}
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
                                    division.divisionId, 
                                    participant.participantId, 
                                    'notes', 
                                    e.target.value
                                  )}
                                  placeholder="e.g., played well, great partner"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            
                            {/* Placement Preview */}
                            {participant.placement && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center space-x-2">
                                  <Trophy className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {participant.participantName} finished {participant.placement}{getPlacementSuffix(participant.placement)} out of {division.totalTeams} teams
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tournament Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tournament Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Add any notes about the tournament..."
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

export default TournamentResultsForm;