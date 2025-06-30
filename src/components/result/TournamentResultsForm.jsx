// src/components/results/TournamentResultsForm.jsx
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Plus, X, Save, AlertCircle } from 'lucide-react';

const TournamentResultsForm = ({ 
  tournament, 
  division, 
  members = [], 
  onSubmit, 
  onCancel, 
  isLoading = false,
  existingResults = null 
}) => {
  const [formData, setFormData] = useState({
    standings: [],
    notes: '',
    completedDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});
  const [availableMembers, setAvailableMembers] = useState([]);

  // Initialize form with existing results or empty state
  useEffect(() => {
    if (existingResults) {
      setFormData({
        standings: existingResults.standings || [],
        notes: existingResults.notes || '',
        completedDate: existingResults.completedDate ? 
          new Date(existingResults.completedDate.seconds * 1000).toISOString().split('T')[0] :
          new Date().toISOString().split('T')[0]
      });
    } else {
      // Initialize with empty standings
      setFormData(prev => ({
        ...prev,
        standings: []
      }));
    }
  }, [existingResults]);

  // Filter available members (those not already in standings)
  useEffect(() => {
    const usedMemberIds = formData.standings.map(standing => standing.memberId);
    const available = members.filter(member => !usedMemberIds.includes(member.id));
    setAvailableMembers(available);
  }, [members, formData.standings]);

  const addStanding = () => {
    if (availableMembers.length === 0) return;
    
    const nextPosition = formData.standings.length + 1;
    const newStanding = {
      id: Date.now().toString(),
      memberId: '',
      memberName: '',
      position: nextPosition,
      points: 0,
      wins: 0,
      losses: 0
    };

    setFormData(prev => ({
      ...prev,
      standings: [...prev.standings, newStanding]
    }));
  };

  const removeStanding = (standingId) => {
    const updatedStandings = formData.standings
      .filter(standing => standing.id !== standingId)
      .map((standing, index) => ({
        ...standing,
        position: index + 1
      }));

    setFormData(prev => ({
      ...prev,
      standings: updatedStandings
    }));
  };

  const updateStanding = (standingId, field, value) => {
    const updatedStandings = formData.standings.map(standing => {
      if (standing.id === standingId) {
        const updated = { ...standing, [field]: value };
        
        // If updating member, also update member name
        if (field === 'memberId') {
          const selectedMember = members.find(m => m.id === value);
          updated.memberName = selectedMember ? selectedMember.name : '';
        }
        
        return updated;
      }
      return standing;
    });

    setFormData(prev => ({
      ...prev,
      standings: updatedStandings
    }));
    
    // Clear member-specific errors
    if (field === 'memberId') {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`member_${standingId}`];
        return newErrors;
      });
    }
  };

  const moveStanding = (standingId, direction) => {
    const currentIndex = formData.standings.findIndex(s => s.id === standingId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= formData.standings.length) return;

    const updatedStandings = [...formData.standings];
    [updatedStandings[currentIndex], updatedStandings[newIndex]] = 
    [updatedStandings[newIndex], updatedStandings[currentIndex]];

    // Update positions
    updatedStandings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    setFormData(prev => ({
      ...prev,
      standings: updatedStandings
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Check if standings exist
    if (formData.standings.length === 0) {
      newErrors.standings = 'At least one player standing is required';
    }

    // Validate each standing
    formData.standings.forEach(standing => {
      if (!standing.memberId) {
        newErrors[`member_${standing.id}`] = 'Player selection is required';
      }
      if (standing.points < 0) {
        newErrors[`points_${standing.id}`] = 'Points cannot be negative';
      }
      if (standing.wins < 0) {
        newErrors[`wins_${standing.id}`] = 'Wins cannot be negative';
      }
      if (standing.losses < 0) {
        newErrors[`losses_${standing.id}`] = 'Losses cannot be negative';
      }
    });

    // Check for duplicate members
    const memberIds = formData.standings.map(s => s.memberId).filter(id => id);
    const duplicates = memberIds.filter((id, index) => memberIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      newErrors.duplicates = 'Each player can only appear once in the standings';
    }

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
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      divisionId: division.id,
      divisionName: division.name,
      standings: formData.standings.map(standing => ({
        memberId: standing.memberId,
        memberName: standing.memberName,
        position: standing.position,
        points: Number(standing.points) || 0,
        wins: Number(standing.wins) || 0,
        losses: Number(standing.losses) || 0
      })),
      notes: formData.notes.trim(),
      completedDate: new Date(formData.completedDate),
      type: 'tournament'
    };

    onSubmit(resultData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
                {tournament.name} - {division.name}
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
                  {new Date(tournament.date.seconds * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Division:</span>
                <span className="font-medium">{division.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Max Players:</span>
                <span className="font-medium">{division.maxPlayers}</span>
              </div>
            </div>
          </div>

          {/* Completion Date */}
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

          {/* Standings Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Player Standings</h3>
              <button
                type="button"
                onClick={addStanding}
                disabled={availableMembers.length === 0}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Player</span>
              </button>
            </div>

            {errors.standings && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{errors.standings}</p>
              </div>
            )}

            {errors.duplicates && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{errors.duplicates}</p>
              </div>
            )}

            {formData.standings.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No player standings added yet</p>
                <p className="text-sm text-gray-400">Click "Add Player" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.standings.map((standing, index) => (
                  <div
                    key={standing.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">
                      {/* Position */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Position
                        </label>
                        <div className="flex items-center space-x-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-blue-600">#{standing.position}</span>
                          </div>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => moveStanding(standing.id, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="text-xs">▲</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStanding(standing.id, 'down')}
                              disabled={index === formData.standings.length - 1}
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="text-xs">▼</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Player Selection */}
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Player
                        </label>
                        <select
                          value={standing.memberId}
                          onChange={(e) => updateStanding(standing.id, 'memberId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select a player...</option>
                          {standing.memberId && (
                            <option value={standing.memberId}>
                              {standing.memberName}
                            </option>
                          )}
                          {availableMembers.map(member => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                        {errors[`member_${standing.id}`] && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors[`member_${standing.id}`]}
                          </p>
                        )}
                      </div>

                      {/* Points */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Points
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={standing.points}
                          onChange={(e) => updateStanding(standing.id, 'points', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors[`points_${standing.id}`] && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors[`points_${standing.id}`]}
                          </p>
                        )}
                      </div>

                      {/* Wins */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Wins
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={standing.wins}
                          onChange={(e) => updateStanding(standing.id, 'wins', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors[`wins_${standing.id}`] && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors[`wins_${standing.id}`]}
                          </p>
                        )}
                      </div>

                      {/* Losses */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Losses
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={standing.losses}
                          onChange={(e) => updateStanding(standing.id, 'losses', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors[`losses_${standing.id}`] && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors[`losses_${standing.id}`]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeStanding(standing.id)}
                        className="flex items-center space-x-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-sm">Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Add any notes about the tournament results..."
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