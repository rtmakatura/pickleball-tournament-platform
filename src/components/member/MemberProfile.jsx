// src/components/member/MemberProfile.jsx (ENHANCED - Added Venmo Handle support)
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Trophy, Calendar, Save, Edit, Shield, DollarSign } from 'lucide-react';
import { Button, Input, Select, Card, Alert } from '../ui';
import { RoleIndicator } from '../ui/PermissionCheck';
import { useAuth } from '../../hooks/useAuth';
import { useMembers } from '../../hooks/useMembers';
import { useTournaments } from '../../hooks/useTournaments';
import { useLeagues } from '../../hooks/useLeagues';
import { SKILL_LEVELS } from '../../services/models';

/**
 * MemberProfile Component - Allows users to view and edit their own profile
 * 
 * Props:
 * - onClose: function - Called when profile modal should close
 * - showStats: boolean - Whether to show participation stats
 */
const MemberProfile = ({ 
  onClose,
  showStats = true 
}) => {
  const { user } = useAuth();
  const { members, updateMember } = useMembers();
  const { tournaments } = useTournaments();
  const { leagues } = useLeagues();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Find current user's member record
  const currentMember = members.find(m => m.authUid === user?.uid);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    venmoHandle: '', // NEW: Venmo handle
    skillLevel: ''
  });

  // Initialize form data when member is found
  useEffect(() => {
    if (currentMember) {
      setFormData({
        firstName: currentMember.firstName || '',
        lastName: currentMember.lastName || '',
        phoneNumber: currentMember.phoneNumber || '',
        venmoHandle: currentMember.venmoHandle || '', // NEW: Initialize venmo handle
        skillLevel: currentMember.skillLevel || ''
      });
    }
  }, [currentMember]);

  // Handle input changes
  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  // Show alert
  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Handle profile update
  const handleSave = async () => {
    if (!currentMember) return;

    // Validate venmo handle if provided
    if (formData.venmoHandle && !/^[a-zA-Z0-9_-]+$/.test(formData.venmoHandle)) {
      showAlert('error', 'Invalid Venmo Handle', 'Venmo handle can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    setLoading(true);
    try {
      await updateMember(currentMember.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        venmoHandle: formData.venmoHandle.trim(), // NEW: Include venmo handle
        skillLevel: formData.skillLevel,
        displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`
      });

      setEditing(false);
      showAlert('success', 'Profile Updated', 'Your profile has been updated successfully');
    } catch (error) {
      showAlert('error', 'Update Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    if (currentMember) {
      setFormData({
        firstName: currentMember.firstName || '',
        lastName: currentMember.lastName || '',
        phoneNumber: currentMember.phoneNumber || '',
        venmoHandle: currentMember.venmoHandle || '', // NEW: Reset venmo handle
        skillLevel: currentMember.skillLevel || ''
      });
    }
    setEditing(false);
  };

  // Calculate user stats
  const getUserStats = () => {
    if (!currentMember) return { tournaments: 0, leagues: 0, totalEvents: 0 };

    const userTournaments = tournaments.filter(t => 
      t.participants?.includes(currentMember.id)
    );
    
    const userLeagues = leagues.filter(l => 
      l.participants?.includes(currentMember.id)
    );

    return {
      tournaments: userTournaments.length,
      leagues: userLeagues.length,
      totalEvents: userTournaments.length + userLeagues.length,
      upcomingTournaments: userTournaments.filter(t => {
        if (!t.eventDate) return false;
        const eventDate = t.eventDate.seconds 
          ? new Date(t.eventDate.seconds * 1000)
          : new Date(t.eventDate);
        return eventDate > new Date();
      }).length,
      activeLeagues: userLeagues.filter(l => l.status === 'active').length
    };
  };

  const stats = getUserStats();

  // Skill level options
  const skillLevelOptions = Object.entries(SKILL_LEVELS).map(([key, value]) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  if (!currentMember) {
    return (
      <Card title="Profile">
        <Alert 
          type="error" 
          title="Profile Not Found" 
          message="Unable to load your profile. Please try refreshing the page." 
        />
      </Card>
    );
  }

  const joinDate = currentMember.createdAt 
    ? (currentMember.createdAt.seconds 
        ? new Date(currentMember.createdAt.seconds * 1000)
        : new Date(currentMember.createdAt)
      ).toLocaleDateString()
    : 'Unknown';

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Profile Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentMember.firstName} {currentMember.lastName}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <RoleIndicator />
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-600 capitalize">
                  {currentMember.skillLevel} Level
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  loading={loading}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card title="Profile Information">
            <div className="space-y-6">
              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {editing ? (
                    <Input
                      value={formData.firstName}
                      onChange={handleChange('firstName')}
                      placeholder="First name"
                      required
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{currentMember.firstName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {editing ? (
                    <Input
                      value={formData.lastName}
                      onChange={handleChange('lastName')}
                      placeholder="Last name"
                      required
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{currentMember.lastName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{currentMember.email}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Cannot be changed
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {editing ? (
                    <Input
                      value={formData.phoneNumber}
                      onChange={handleChange('phoneNumber')}
                      placeholder="(555) 123-4567"
                      type="tel"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {currentMember.phoneNumber || 'Not provided'}
                      </span>
                    </div>
                  )}
                </div>

                {/* NEW: Venmo Handle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venmo Handle
                  </label>
                  {editing ? (
                    <Input
                      value={formData.venmoHandle}
                      onChange={handleChange('venmoHandle')}
                      placeholder="your-venmo"
                      helperText="For easy payment collection (no @ symbol needed)"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {currentMember.venmoHandle ? `@${currentMember.venmoHandle}` : 'Not provided'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pickleball Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level
                </label>
                {editing ? (
                  <Select
                    value={formData.skillLevel}
                    onChange={handleChange('skillLevel')}
                    options={skillLevelOptions}
                    required
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 capitalize">
                      {currentMember.skillLevel}
                    </span>
                  </div>
                )}
              </div>

              {/* Role - Display only, not editable by users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Role
                </label>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 capitalize">
                    {currentMember.role}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Contact admin to change
                  </span>
                </div>
              </div>

              {/* Account Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Since
                    </label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{joinDate}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Status
                    </label>
                    <span className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${currentMember.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }
                    `}>
                      {currentMember.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats and Activity */}
        <div className="space-y-6">
          {/* Participation Stats */}
          {showStats && (
            <Card title="Your Activity">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <Trophy className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-900">{stats.tournaments}</p>
                    <p className="text-xs text-blue-700">Tournaments</p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <Shield className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-900">{stats.leagues}</p>
                    <p className="text-xs text-green-700">Leagues</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upcoming tournaments:</span>
                    <span className="font-medium">{stats.upcomingTournaments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active leagues:</span>
                    <span className="font-medium">{stats.activeLeagues}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total events:</span>
                    <span className="font-medium">{stats.totalEvents}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Information */}
          {currentMember.venmoHandle && (
            <Card title="Payment Information">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">Venmo Ready</h4>
                    <p className="text-sm text-green-800">@{currentMember.venmoHandle}</p>
                    <p className="text-xs text-green-700 mt-1">
                      Others can easily pay you for tournaments and leagues
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {/* Navigate to tournaments */}}
              >
                <Trophy className="h-4 w-4 mr-2" />
                View My Tournaments
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {/* Navigate to leagues */}}
              >
                <Shield className="h-4 w-4 mr-2" />
                View My Leagues
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {/* Navigate to payment history */}}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Payment History
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;