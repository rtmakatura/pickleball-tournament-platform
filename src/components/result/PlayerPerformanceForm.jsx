// src/components/results/PlayerPerformanceForm.jsx
import React, { useState, useEffect } from 'react';
import { User, Star, Target, TrendingUp, Calendar, Save, X, AlertCircle } from 'lucide-react';

const PlayerPerformanceForm = ({ 
  event, 
  member, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  existingPerformance = null 
}) => {
  const [formData, setFormData] = useState({
    overallRating: 3,
    skillRatings: {
      serves: 3,
      returns: 3,
      volleys: 3,
      groundstrokes: 3,
      positioning: 3,
      strategy: 3,
      communication: 3,
      consistency: 3
    },
    strengths: [],
    improvements: [],
    goals: [],
    notes: '',
    eventDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});

  // Skill categories with descriptions
  const skillCategories = [
    { key: 'serves', label: 'Serves', description: 'Serving power, accuracy, and variety' },
    { key: 'returns', label: 'Returns', description: 'Return of serve effectiveness' },
    { key: 'volleys', label: 'Volleys', description: 'Net play and volley technique' },
    { key: 'groundstrokes', label: 'Groundstrokes', description: 'Baseline shots and consistency' },
    { key: 'positioning', label: 'Positioning', description: 'Court positioning and movement' },
    { key: 'strategy', label: 'Strategy', description: 'Game strategy and shot selection' },
    { key: 'communication', label: 'Communication', description: 'Partner communication in doubles' },
    { key: 'consistency', label: 'Consistency', description: 'Overall shot consistency and reliability' }
  ];

  // Common strengths, improvements, and goals
  const commonItems = {
    strengths: [
      'Strong serves', 'Good returns', 'Excellent volleys', 'Consistent groundstrokes',
      'Smart positioning', 'Strategic play', 'Great communication', 'Mental toughness',
      'Quick reflexes', 'Good footwork', 'Power shots', 'Placement accuracy'
    ],
    improvements: [
      'Serve consistency', 'Return placement', 'Net game', 'Backhand shots',
      'Court coverage', 'Shot selection', 'Partner communication', 'Unforced errors',
      'Footwork speed', 'Third shot drops', 'Dinking technique', 'Overhead smashes'
    ],
    goals: [
      'Improve serve placement', 'Reduce unforced errors', 'Better net play', 'Stronger backhand',
      'Faster court movement', 'Better shot selection', 'Improve communication', 'More consistent play',
      'Develop third shot', 'Master dinking', 'Improve fitness', 'Learn new strategies'
    ]
  };

  // Initialize form with existing performance or empty state
  useEffect(() => {
    if (existingPerformance) {
      setFormData({
        overallRating: existingPerformance.overallRating || 3,
        skillRatings: existingPerformance.skillRatings || {
          serves: 3, returns: 3, volleys: 3, groundstrokes: 3,
          positioning: 3, strategy: 3, communication: 3, consistency: 3
        },
        strengths: existingPerformance.strengths || [],
        improvements: existingPerformance.improvements || [],
        goals: existingPerformance.goals || [],
        notes: existingPerformance.notes || '',
        eventDate: existingPerformance.eventDate ? 
          new Date(existingPerformance.eventDate.seconds * 1000).toISOString().split('T')[0] :
          new Date().toISOString().split('T')[0]
      });
    } else {
      // Set event date if provided
      if (event?.date) {
        setFormData(prev => ({
          ...prev,
          eventDate: new Date(event.date.seconds * 1000).toISOString().split('T')[0]
        }));
      }
    }
  }, [existingPerformance, event]);

  const updateSkillRating = (skill, rating) => {
    setFormData(prev => ({
      ...prev,
      skillRatings: {
        ...prev.skillRatings,
        [skill]: rating
      }
    }));
  };

  const addCustomItem = (category, value) => {
    if (!value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], value.trim()]
    }));
  };

  const removeItem = (category, index) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const addCommonItem = (category, item) => {
    if (formData[category].includes(item)) return;
    
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], item]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate overall rating
    if (formData.overallRating < 1 || formData.overallRating > 5) {
      newErrors.overallRating = 'Overall rating must be between 1 and 5';
    }

    // Validate skill ratings
    Object.keys(formData.skillRatings).forEach(skill => {
      const rating = formData.skillRatings[skill];
      if (rating < 1 || rating > 5) {
        newErrors[skill] = 'Rating must be between 1 and 5';
      }
    });

    // Validate event date
    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const performanceData = {
      eventId: event.id,
      eventName: event.name,
      eventType: event.type || (event.divisionId ? 'tournament' : 'league'),
      memberId: member.id,
      memberName: member.name,
      overallRating: Number(formData.overallRating),
      skillRatings: Object.keys(formData.skillRatings).reduce((acc, skill) => {
        acc[skill] = Number(formData.skillRatings[skill]);
        return acc;
      }, {}),
      strengths: formData.strengths,
      improvements: formData.improvements,
      goals: formData.goals,
      notes: formData.notes.trim(),
      eventDate: new Date(formData.eventDate)
    };

    onSubmit(performanceData);
  };

  const calculateAverageRating = () => {
    const ratings = Object.values(formData.skillRatings);
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    return average.toFixed(1);
  };

  const renderStarRating = (value, onChange, disabled = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onChange(star)}
            disabled={disabled}
            className={`w-6 h-6 ${
              star <= value 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            } ${disabled ? 'cursor-default' : 'cursor-pointer hover:text-yellow-500'} transition-colors`}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">({value}/5)</span>
      </div>
    );
  };

  const renderItemSection = (title, category, commonList, placeholder) => {
    const [newItem, setNewItem] = useState('');

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        
        {/* Current items */}
        {formData[category].length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData[category].map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeItem(category, index)}
                  className="w-4 h-4 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-full h-full" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add custom item */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomItem(category, newItem);
                setNewItem('');
              }
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => {
              addCustomItem(category, newItem);
              setNewItem('');
            }}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </div>

        {/* Common suggestions */}
        <div className="flex flex-wrap gap-2">
          {commonList.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => addCommonItem(category, item)}
              disabled={formData[category].includes(item)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-purple-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {existingPerformance ? 'Edit' : 'Add'} Performance Assessment
              </h2>
              <p className="text-sm text-gray-600">
                {member.name} - {event.name}
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
          {/* Event Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Event:</span>
                <span className="font-medium">{event.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Player:</span>
                <span className="font-medium">{member.name}</span>
              </div>
            </div>
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Date
            </label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.eventDate && (
              <p className="mt-1 text-sm text-red-600">{errors.eventDate}</p>
            )}
          </div>

          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Overall Performance Rating
            </label>
            <div className="bg-gray-50 rounded-lg p-4">
              {renderStarRating(
                formData.overallRating,
                (rating) => setFormData(prev => ({ ...prev, overallRating: rating }))
              )}
              {errors.overallRating && (
                <p className="mt-2 text-sm text-red-600">{errors.overallRating}</p>
              )}
            </div>
          </div>

          {/* Skill Ratings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Skill Assessment</h3>
              <div className="text-sm text-gray-600">
                Average: <span className="font-medium">{calculateAverageRating()}/5</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillCategories.map(skill => (
                <div key={skill.key} className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{skill.label}</h4>
                    <p className="text-xs text-gray-600">{skill.description}</p>
                  </div>
                  {renderStarRating(
                    formData.skillRatings[skill.key],
                    (rating) => updateSkillRating(skill.key, rating)
                  )}
                  {errors[skill.key] && (
                    <p className="mt-1 text-xs text-red-600">{errors[skill.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Strengths, Improvements, Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900">Strengths</h3>
              </div>
              {renderItemSection(
                '',
                'strengths',
                commonItems.strengths,
                'Add a strength...'
              )}
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-medium text-gray-900">Areas to Improve</h3>
              </div>
              {renderItemSection(
                '',
                'improvements',
                commonItems.improvements,
                'Add an improvement area...'
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900">Goals</h3>
              </div>
              {renderItemSection(
                '',
                'goals',
                commonItems.goals,
                'Add a goal...'
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              placeholder="Add any additional thoughts about your performance, what you learned, or specific moments from the event..."
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
          <span>{isLoading ? 'Saving...' : existingPerformance ? 'Update Assessment' : 'Save Assessment'}</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(PlayerPerformanceForm);