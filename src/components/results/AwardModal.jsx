// src/components/results/AwardModal.jsx
import React, { useState } from 'react';
import { Award, Star, Trophy, Users, Zap, Target, Heart, Plus, X } from 'lucide-react';
import { Button, Input, Select, Modal } from '../ui';
import { AWARD_TYPES, createAward } from '../../services/models';

/**
 * AwardModal Component - Modal for adding awards to participants
 * 
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - onClose: function - Called when modal is closed
 * - onAddAward: function - Called when award is added
 * - participantName: string - Name of participant receiving award
 */
const AwardModal = ({ 
  isOpen, 
  onClose, 
  onAddAward, 
  participantName = '' 
}) => {
  const [formData, setFormData] = useState({
    type: '',
    customTitle: '',
    description: '',
    value: 0
  });

  const [errors, setErrors] = useState({});

  // Award type configurations
  const awardConfigs = {
    [AWARD_TYPES.CHAMPION]: {
      icon: Trophy,
      color: 'text-yellow-600',
      title: 'Champion',
      description: 'Winner of the tournament/league',
      defaultDescription: 'Tournament/League Champion'
    },
    [AWARD_TYPES.RUNNER_UP]: {
      icon: Trophy,
      color: 'text-gray-500',
      title: 'Runner Up',
      description: 'Second place finisher',
      defaultDescription: 'Runner Up - Second Place'
    },
    [AWARD_TYPES.THIRD_PLACE]: {
      icon: Trophy,
      color: 'text-amber-600',
      title: 'Third Place',
      description: 'Third place finisher',
      defaultDescription: 'Third Place Finisher'
    },
    [AWARD_TYPES.MOST_IMPROVED]: {
      icon: Zap,
      color: 'text-blue-600',
      title: 'Most Improved',
      description: 'Greatest improvement during event',
      defaultDescription: 'Most Improved Player'
    },
    [AWARD_TYPES.BEST_SPORTSMANSHIP]: {
      icon: Heart,
      color: 'text-red-600',
      title: 'Best Sportsmanship',
      description: 'Exemplary sportsmanship and conduct',
      defaultDescription: 'Best Sportsmanship Award'
    },
    [AWARD_TYPES.MOST_GAMES_WON]: {
      icon: Target,
      color: 'text-green-600',
      title: 'Most Games Won',
      description: 'Highest number of games won',
      defaultDescription: 'Most Games Won'
    },
    [AWARD_TYPES.HIGHEST_SCORING]: {
      icon: Star,
      color: 'text-purple-600',
      title: 'Highest Scoring',
      description: 'Highest total points scored',
      defaultDescription: 'Highest Scoring Player'
    },
    [AWARD_TYPES.PERFECT_ATTENDANCE]: {
      icon: Users,
      color: 'text-indigo-600',
      title: 'Perfect Attendance',
      description: 'Participated in all matches/sessions',
      defaultDescription: 'Perfect Attendance Award'
    },
    [AWARD_TYPES.COMEBACK_PLAYER]: {
      icon: Zap,
      color: 'text-orange-600',
      title: 'Comeback Player',
      description: 'Most dramatic comeback performance',
      defaultDescription: 'Comeback Player Award'
    },
    [AWARD_TYPES.CUSTOM]: {
      icon: Award,
      color: 'text-gray-600',
      title: 'Custom Award',
      description: 'Create your own award',
      defaultDescription: 'Special Recognition'
    }
  };

  // Handle input changes
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }

    // Auto-fill description for predefined awards
    if (field === 'type' && value !== AWARD_TYPES.CUSTOM) {
      const config = awardConfigs[value];
      if (config && !formData.description) {
        setFormData(prev => ({
          ...prev,
          description: config.defaultDescription
        }));
      }
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Award type is required';
    }

    if (formData.type === AWARD_TYPES.CUSTOM && !formData.customTitle.trim()) {
      newErrors.customTitle = 'Custom award title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.value < 0) {
      newErrors.value = 'Value cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const award = createAward({
      type: formData.type,
      title: formData.type === AWARD_TYPES.CUSTOM ? formData.customTitle : awardConfigs[formData.type]?.title,
      description: formData.description,
      customTitle: formData.type === AWARD_TYPES.CUSTOM ? formData.customTitle : '',
      value: parseFloat(formData.value) || 0,
      awardedAt: new Date()
    });

    onAddAward(award);
    handleClose();
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      type: '',
      customTitle: '',
      description: '',
      value: 0
    });
    setErrors({});
    onClose();
  };

  // Award type options
  const awardTypeOptions = Object.entries(AWARD_TYPES).map(([key, value]) => ({
    value,
    label: awardConfigs[value]?.title || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));

  const selectedConfig = formData.type ? awardConfigs[formData.type] : null;
  const SelectedIcon = selectedConfig?.icon || Award;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Award${participantName ? ` for ${participantName}` : ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Award Type Selection */}
        <div>
          <Select
            label="Award Type"
            value={formData.type}
            onChange={handleChange('type')}
            options={awardTypeOptions}
            error={errors.type}
            required
            placeholder="Select an award type"
          />
          
          {selectedConfig && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-start space-x-3">
              <SelectedIcon className={`h-5 w-5 ${selectedConfig.color} flex-shrink-0 mt-0.5`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedConfig.title}</p>
                <p className="text-xs text-gray-600">{selectedConfig.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Custom Title (only for custom awards) */}
        {formData.type === AWARD_TYPES.CUSTOM && (
          <Input
            label="Custom Award Title"
            type="text"
            value={formData.customTitle}
            onChange={handleChange('customTitle')}
            error={errors.customTitle}
            required
            placeholder="Enter custom award title"
            helperText="Give your custom award a descriptive title"
          />
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm text-sm
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${errors.description 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
              }
            `}
            rows={3}
            value={formData.description}
            onChange={handleChange('description')}
            placeholder="Describe this award and why it's being given"
            required
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <X className="h-4 w-4 mr-1" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Monetary Value (optional) */}
        <Input
          label="Monetary Value (optional)"
          type="number"
          min="0"
          step="0.01"
          value={formData.value}
          onChange={handleChange('value')}
          error={errors.value}
          placeholder="0.00"
          helperText="Enter monetary value if this award comes with a cash prize"
        />

        {/* Award Preview */}
        {formData.type && (formData.type !== AWARD_TYPES.CUSTOM || formData.customTitle) && formData.description && (
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Award Preview
            </h4>
            <div className="bg-white p-3 rounded border border-blue-200">
              <div className="flex items-start space-x-3">
                <SelectedIcon className={`h-6 w-6 ${selectedConfig?.color} flex-shrink-0 mt-1`} />
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">
                    {formData.type === AWARD_TYPES.CUSTOM ? formData.customTitle : selectedConfig?.title}
                  </h5>
                  <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                  {formData.value > 0 && (
                    <p className="text-sm font-medium text-green-600 mt-1">
                      Value: ${formData.value}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex space-x-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={!formData.type || !formData.description}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Award
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/**
 * AwardDisplay Component - Display awards in a compact format
 * 
 * Props:
 * - awards: array - Array of award objects
 * - maxDisplay: number - Maximum number of awards to display before showing "more"
 * - showValues: boolean - Whether to show monetary values
 */
export const AwardDisplay = ({ 
  awards = [], 
  maxDisplay = 3,
  showValues = false 
}) => {
  const awardConfigs = {
    [AWARD_TYPES.CHAMPION]: { icon: Trophy, color: 'text-yellow-600 bg-yellow-100' },
    [AWARD_TYPES.RUNNER_UP]: { icon: Trophy, color: 'text-gray-600 bg-gray-100' },
    [AWARD_TYPES.THIRD_PLACE]: { icon: Trophy, color: 'text-amber-600 bg-amber-100' },
    [AWARD_TYPES.MOST_IMPROVED]: { icon: Zap, color: 'text-blue-600 bg-blue-100' },
    [AWARD_TYPES.BEST_SPORTSMANSHIP]: { icon: Heart, color: 'text-red-600 bg-red-100' },
    [AWARD_TYPES.MOST_GAMES_WON]: { icon: Target, color: 'text-green-600 bg-green-100' },
    [AWARD_TYPES.HIGHEST_SCORING]: { icon: Star, color: 'text-purple-600 bg-purple-100' },
    [AWARD_TYPES.PERFECT_ATTENDANCE]: { icon: Users, color: 'text-indigo-600 bg-indigo-100' },
    [AWARD_TYPES.COMEBACK_PLAYER]: { icon: Zap, color: 'text-orange-600 bg-orange-100' },
    [AWARD_TYPES.CUSTOM]: { icon: Award, color: 'text-gray-600 bg-gray-100' }
  };

  if (awards.length === 0) {
    return (
      <span className="text-gray-400 text-sm italic">No awards</span>
    );
  }

  const displayAwards = awards.slice(0, maxDisplay);
  const remainingCount = awards.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayAwards.map((award, index) => {
        const config = awardConfigs[award.type] || awardConfigs[AWARD_TYPES.CUSTOM];
        const Icon = config.icon;
        
        return (
          <div
            key={index}
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}
            title={award.description}
          >
            <Icon className="h-3 w-3 mr-1" />
            {award.title || award.customTitle}
            {showValues && award.value > 0 && (
              <span className="ml-1 font-semibold">${award.value}</span>
            )}
          </div>
        );
      })}
      
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

export default AwardModal;