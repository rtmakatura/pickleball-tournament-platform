// src/components/ui/ReportIssueModal.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle, Bug, Lightbulb, MessageSquare, Star, HelpCircle } from 'lucide-react';
import { Modal, Button, Alert, ModalHeaderButton } from './index';
import { useAuth } from '../../hooks';
import { sendIssueReport } from '../../services/emailService';
import { getBrowserInfo } from '../../utils/browserUtils';

const ISSUE_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'improvement', label: 'Improvement Suggestion', icon: Star, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'general', label: 'General Feedback', icon: MessageSquare, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' }
];

const ReportIssueModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    issueType: 'bug',
    title: '',
    description: '',
    contactEmail: '',
    allowFollowUp: true
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        issueType: 'bug',
        title: '',
        description: '',
        contactEmail: user?.email || '',
        allowFollowUp: true
      });
      setSubmitted(false);
      setAlert(null);
    }
  }, [isOpen, user?.email]);

  // Auto-clear alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Please provide a title for your issue');
      }
      if (!formData.description.trim()) {
        throw new Error('Please describe the issue');
      }
      if (!formData.contactEmail.trim()) {
        throw new Error('Please provide an email address for follow-up');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail)) {
        throw new Error('Please provide a valid email address');
      }

      // Collect additional context
      const browserInfo = getBrowserInfo();
      const reportData = {
        ...formData,
        browserInfo,
        currentUrl: window.location.href,
        timestamp: new Date().toISOString(),
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || 'Unknown User'
      };

      // Send email
      await sendIssueReport(reportData);

      setSubmitted(true);
      setAlert({
        type: 'success',
        title: 'Issue reported successfully!',
        message: 'Thank you for your feedback. We\'ll review your report and follow up if needed.'
      });

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Failed to send issue report:', error);
      setAlert({
        type: 'error',
        title: 'Failed to send report',
        message: error.message || 'Please try again or contact support directly.'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedIssueType = ISSUE_TYPES.find(type => type.value === formData.issueType);

  if (submitted) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Report Sent Successfully"
        size="md"
      >
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
            Thank you for your feedback!
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-8 leading-relaxed px-4">
            We've received your report and will review it promptly. 
            {formData.allowFollowUp && (
              <span className="hidden sm:inline"> We may reach out for additional details.</span>
            )}
          </p>
          <Button onClick={onClose} variant="primary" size="lg" className="px-6 sm:px-8">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report an Issue"
      size="xl"
      headerAction={
        <>
          <ModalHeaderButton
            variant="outline"
            onClick={onClose}
            disabled={loading}
            icon={<X className="h-4 w-4" />}
          >
            Cancel
          </ModalHeaderButton>
          <ModalHeaderButton
            variant="primary"
            type="submit"
            form="report-issue-form"
            loading={loading}
            disabled={loading}
            icon={<Send className="h-4 w-4" />}
          >
            Send Report
          </ModalHeaderButton>
        </>
      }
    >
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Beautiful Introduction Card - Consistent Medium Fonts */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-blue-900 mb-2">
                Help us improve PicklePortal
              </h3>
              <p className="text-sm sm:text-base text-blue-700 leading-relaxed">
                <span className="hidden sm:inline">Found a bug? Have a feature idea? We'd love to hear from you! Your feedback helps make the platform better for everyone in the Denver Picklr community.</span>
                <span className="sm:hidden">Found a bug? Have a feature idea? Your feedback helps improve the platform!</span>
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form id="report-issue-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Issue Type - Consistent Medium Fonts */}
          <div className="space-y-3">
            <label className="block text-sm sm:text-base font-semibold text-gray-900">
              What type of issue are you reporting? *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {ISSUE_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = formData.issueType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('issueType', type.value)}
                    className={`
                      p-2 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left
                      ${isSelected 
                        ? `${type.color} border-current ring-2 ring-blue-500 ring-opacity-20` 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 text-center sm:text-left">
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isSelected ? 'text-current' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium leading-tight ${isSelected ? 'text-current' : 'text-gray-700'}`}>
                        <span className="sm:hidden">
                          {type.value === 'improvement' ? 'Improvement' : 
                           type.value === 'feature' ? 'Feature' :
                           type.value === 'general' ? 'Feedback' :
                           type.label}
                        </span>
                        <span className="hidden sm:inline">{type.label}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title - Consistent Medium Fonts */}
          <div className="space-y-2">
            <label className="block text-sm sm:text-base font-semibold text-gray-900">
              Issue Title *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Brief summary of the issue..."
                className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base placeholder-gray-400"
                maxLength={100}
                required
              />
              <div className="absolute top-full mt-1 right-0 text-xs text-gray-500 font-medium">
                {formData.title.length}/100 characters
              </div>
            </div>
          </div>

          {/* Description - Consistent Medium Fonts */}
          <div className="space-y-2">
            <label className="block text-sm sm:text-base font-semibold text-gray-900">
              Detailed Description *
            </label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the issue and steps to reproduce..."
                rows={4}
                className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical text-sm sm:text-base placeholder-gray-400 leading-relaxed"
                maxLength={1000}
                required
              />
              <div className="absolute top-full mt-1 right-0 text-xs text-gray-500 font-medium">
                {formData.description.length}/1000 characters
              </div>
            </div>
          </div>

          {/* Contact Email - Consistent Medium Fonts */}
          <div className="space-y-2">
            <label className="block text-sm sm:text-base font-semibold text-gray-900">
              Your Email Address *
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base placeholder-gray-400"
              required
            />
            <p className="text-xs sm:text-sm text-gray-600 ml-1">
              We'll use this to follow up on your report if needed
            </p>
          </div>

          {/* Follow-up Permission - Consistent Medium Fonts */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  id="allowFollowUp"
                  checked={formData.allowFollowUp}
                  onChange={(e) => handleInputChange('allowFollowUp', e.target.checked)}
                  className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div>
                <span className="text-sm sm:text-base font-medium text-gray-900">
                  I'm okay with being contacted for follow-up questions
                </span>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  <span className="hidden sm:inline">This helps us gather additional details if needed to resolve your issue</span>
                  <span className="sm:hidden">Helps us get more details if needed</span>
                </p>
              </div>
            </label>
          </div>

          {/* Privacy Notice - Consistent Medium Fonts */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm">
                <h4 className="font-semibold text-amber-900 mb-2">Privacy Notice</h4>
                <p className="text-amber-800 leading-relaxed">
                  <span className="hidden sm:inline">This report will include your browser information and current page URL to help us reproduce and fix issues. No sensitive personal data will be collected. Your information is only used to improve PicklePortal.</span>
                  <span className="sm:hidden">Includes browser info and page URL to help fix issues. No sensitive data collected.</span>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ReportIssueModal;