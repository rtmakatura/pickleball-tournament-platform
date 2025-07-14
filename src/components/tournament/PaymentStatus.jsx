// src/components/tournament/PaymentStatus.jsx - REDESIGNED WITH BEAUTIFUL STYLING
import React, { useState, useMemo, useCallback } from 'react';
import { 
  DollarSign, 
  Check, 
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  ChevronDown,
  CreditCard,
  Receipt,
  TrendingUp,
  AlertCircle,
  Info,
  Trophy,
  Activity
} from 'lucide-react';
import { Button, Alert, Select, Card } from '../ui';
import { PAYMENT_MODES } from '../../services/models';
import { 
  calculateDivisionPaymentSummary, 
  calculateTournamentPaymentSummary,
  calculateLeaguePaymentSummary,
  getParticipantPaymentStatus
} from '../../utils/paymentUtils';

// Beautiful payment status styles matching TournamentForm aesthetic
const paymentStatusStyles = `
  /* Base payment container */
  .payment-status {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  /* Consistent section spacing system - exactly 24px everywhere */
  .payment-section {
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    position: relative;
    z-index: 1;
  }
  
  .payment-section:last-child {
    margin-bottom: 0;
  }
  
  .payment-section-content {
    padding: 24px;
    position: relative;
    z-index: 15;
  }
  
  .payment-section-header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .payment-section-header:hover {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  }
  
  .payment-section-header:active {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  }
  
  /* Standardized input group spacing - exactly 24px always */
  .payment-input-group {
    margin-bottom: 24px;
  }
  
  .payment-input-group:last-child {
    margin-bottom: 0;
  }
  
  /* Touch-optimized buttons */
  .payment-touch-button {
    min-height: 52px;
    min-width: 52px;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    border-radius: 12px;
  }
  
  .payment-touch-button:active {
    transform: scale(0.96);
  }
  
  /* Progressive disclosure animations */
  .payment-expandable {
    transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
    overflow: hidden;
  }
  
  .payment-expandable.collapsed {
    max-height: 0;
    opacity: 0;
  }
  
  .payment-expandable.expanded {
    max-height: 2000px;
    opacity: 1;
  }
  
  /* Payment mode cards */
  .payment-mode-card {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .payment-mode-card.group-mode {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }
  
  /* Payment summary cards */
  .payment-summary-card {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .payment-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    text-align: center;
  }
  
  @media (min-width: 640px) {
    .payment-stats {
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
  }
  
  .payment-stat-item {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 16px 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .payment-stat-number {
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  
  @media (min-width: 640px) {
    .payment-stat-number {
      font-size: 1.75rem;
    }
  }
  
  .payment-stat-label {
    font-size: 0.75rem;
    opacity: 0.9;
    line-height: 1.2;
    font-weight: 500;
  }
  
  /* Progress bar styling */
  .payment-progress-container {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
  }
  
  .payment-progress-bar {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    height: 8px;
    overflow: hidden;
  }
  
  .payment-progress-fill {
    background: white;
    height: 100%;
    border-radius: 12px;
    transition: width 0.5s ease;
  }
  
  /* Participant cards */
  .participant-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .participant-card:last-child {
    margin-bottom: 0;
  }
  
  .participant-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .participant-card.status-paid {
    border-color: #10b981;
    background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  }
  
  .participant-card.status-unpaid {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%);
  }
  
  .participant-card.status-partial {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fffbeb 0%, #fefce8 100%);
  }
  
  .participant-card.status-overpaid {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  }
  
  /* Status badges */
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
  
  .status-badge.paid {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }
  
  .status-badge.unpaid {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
  
  .status-badge.partial {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }
  
  .status-badge.overpaid {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }
  
  /* Action buttons */
  .payment-action-button {
    min-height: 44px;
    border-radius: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .payment-action-button.primary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
  }
  
  .payment-action-button.primary:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  .payment-action-button.danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border: none;
  }
  
  .payment-action-button.danger:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
  
  /* Payment input styling */
  .payment-amount-input {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    transition: all 0.2s ease;
    width: 100px;
  }
  
  .payment-amount-input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  /* Completion celebration */
  .payment-completion-card {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    text-align: center;
  }
  
  .payment-completion-icon {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }
  
  /* Responsive grid system */
  .payment-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  @media (min-width: 640px) {
    .payment-grid-sm {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .payment-grid-lg {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  /* Group payment special styling */
  .group-payment-selector {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .group-payment-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }
  
  .group-payment-option {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }
  
  .group-payment-option:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }
  
  .group-payment-option:active {
    transform: translateY(0);
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: paymentStatusStyles }} />
);

/**
 * REDESIGNED Payment Status Component with Beautiful Styling
 * 
 * Now matches TournamentForm aesthetic with:
 * - Collapsible sections with smooth animations
 * - Beautiful gradient cards and summary displays
 * - Touch-optimized interactions
 * - Consistent 24px spacing system
 * - Progressive disclosure
 * - Modern visual design
 */
const PaymentStatus = ({ 
  event, 
  eventType = 'tournament',
  divisionId = null,
  members = [], 
  onPaymentUpdate,
  currentUserId 
}) => {
  const [errors, setErrors] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState(
    divisionId || (event.divisions?.[0]?.id || '')
  );
  const [processing, setProcessing] = useState(null);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Section expansion logic
  const getInitialSectionState = useCallback(() => {
    if (!isMobile) {
      return {
        overview: true,
        participants: true,
        actions: true
      };
    }
    
    return {
      overview: true,
      participants: true,
      actions: false
    };
  }, [isMobile]);

  const [expandedSections, setExpandedSections] = useState(() => getInitialSectionState());

  // Mobile detection effect
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Section state updates
  React.useEffect(() => {
    const newSectionState = getInitialSectionState();
    setExpandedSections(newSectionState);
  }, [getInitialSectionState]);

  // Section toggle
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Determine event structure and payment context
  const isDivisionBased = eventType === 'tournament' && event.divisions && Array.isArray(event.divisions);
  const isLegacyTournament = eventType === 'tournament' && !isDivisionBased;
  const isLeague = eventType === 'league';

  const currentDivision = isDivisionBased 
    ? event.divisions.find(div => div.id === selectedDivision)
    : null;

  const getPaymentContext = () => {
    if (isDivisionBased && currentDivision) {
      return {
        fee: parseFloat(currentDivision.entryFee) || 0,
        participants: currentDivision.participants || [],
        paymentData: currentDivision.paymentData || {},
        paymentMode: currentDivision.paymentMode || PAYMENT_MODES.INDIVIDUAL,
        feeLabel: 'Entry Fee',
        eventLabel: 'Division'
      };
    } else if (isLegacyTournament) {
      return {
        fee: parseFloat(event.entryFee) || 0,
        participants: event.participants || [],
        paymentData: event.paymentData || {},
        paymentMode: event.paymentMode || PAYMENT_MODES.INDIVIDUAL,
        feeLabel: 'Entry Fee',
        eventLabel: 'Tournament'
      };
    } else if (isLeague) {
      return {
        fee: parseFloat(event.registrationFee) || 0,
        participants: event.participants || [],
        paymentData: event.paymentData || {},
        paymentMode: event.paymentMode || PAYMENT_MODES.INDIVIDUAL,
        feeLabel: 'Registration Fee',
        eventLabel: 'League'
      };
    }
    
    return {
      fee: 0,
      participants: [],
      paymentData: {},
      paymentMode: PAYMENT_MODES.INDIVIDUAL,
      feeLabel: 'Fee',
      eventLabel: 'Event'
    };
  };

  const { fee, participants, paymentData, paymentMode, feeLabel, eventLabel } = getPaymentContext();
  const isGroupPayment = paymentMode === PAYMENT_MODES.GROUP;

  // Get participants with payment info
  const participantsWithPayment = useMemo(() => {
    if (participants.length === 0) return [];

    return participants.map(participantId => {
      const member = members.find(m => m.id === participantId);
      const paymentStatus = getParticipantPaymentStatus(participantId, paymentData, fee);
      
      return {
        id: participantId,
        member: member || { firstName: 'Unknown', lastName: 'Member', email: '' },
        ...paymentStatus,
        paymentDate: paymentData[participantId]?.date || null,
        notes: paymentData[participantId]?.notes || '',
        isCurrentUser: participantId === currentUserId
      };
    }).sort((a, b) => {
      // Sort: current user first, then by payment status, then by name
      if (a.isCurrentUser && !b.isCurrentUser) return -1;
      if (!a.isCurrentUser && b.isCurrentUser) return 1;
      
      const statusOrder = { unpaid: 0, partial: 1, overpaid: 2, paid: 3 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      return `${a.member.firstName} ${a.member.lastName}`.localeCompare(
        `${b.member.firstName} ${b.member.lastName}`
      );
    });
  }, [participants, members, paymentData, fee, currentUserId]);

  // Calculate payment summary
  const summary = useMemo(() => {
    if (isDivisionBased && currentDivision) {
      return calculateDivisionPaymentSummary(currentDivision);
    } else if (isLegacyTournament) {
      return calculateTournamentPaymentSummary(event);
    } else if (isLeague) {
      return calculateLeaguePaymentSummary(event);
    }
    
    return {
      totalParticipants: 0,
      totalExpected: 0,
      totalPaid: 0,
      totalOwed: 0,
      paidCount: 0,
      unpaidCount: 0,
      isFullyPaid: true,
      paymentRate: 100
    };
  }, [isDivisionBased, currentDivision, isLegacyTournament, isLeague, event]);

  // Payment handlers
  const handlePayment = async (participantId, amount) => {
    setProcessing(participantId);
    try {
      const paymentAmount = parseFloat(amount);
      const newPaymentRecord = {
        amount: paymentAmount,
        date: new Date().toISOString(),
        method: isGroupPayment ? 'group' : 'individual',
        notes: `Payment of $${paymentAmount}`,
        recordedBy: currentUserId
      };

      if (isDivisionBased && currentDivision) {
        const updatedPaymentData = {
          ...currentDivision.paymentData,
          [participantId]: newPaymentRecord
        };
        
        const updatedDivisions = event.divisions.map(div => 
          div.id === selectedDivision 
            ? { ...div, paymentData: updatedPaymentData }
            : div
        );
        
        await onPaymentUpdate(event.id, { divisions: updatedDivisions });
      } else {
        const newPaymentData = {
          ...paymentData,
          [participantId]: newPaymentRecord
        };
        
        await onPaymentUpdate(event.id, { paymentData: newPaymentData });
      }
      
      setErrors([]);
    } catch (error) {
      setErrors([`Payment failed: ${error.message}`]);
    } finally {
      setProcessing(null);
    }
  };

  const removePayment = async (participantId) => {
    setProcessing(participantId);
    try {
      if (isDivisionBased && currentDivision) {
        const updatedPaymentData = { ...currentDivision.paymentData };
        delete updatedPaymentData[participantId];
        
        const updatedDivisions = event.divisions.map(div => 
          div.id === selectedDivision 
            ? { ...div, paymentData: updatedPaymentData }
            : div
        );
        
        await onPaymentUpdate(event.id, { divisions: updatedDivisions });
      } else {
        const newPaymentData = { ...paymentData };
        delete newPaymentData[participantId];
        
        await onPaymentUpdate(event.id, { paymentData: newPaymentData });
      }
      
      setErrors([]);
    } catch (error) {
      setErrors([`Failed to remove payment: ${error.message}`]);
    } finally {
      setProcessing(null);
    }
  };

  const handleGroupPayment = async (payerId) => {
    setProcessing('group');
    try {
      const totalAmount = fee * participants.length;
      let newPaymentData = {};
      
      newPaymentData[payerId] = {
        amount: totalAmount,
        date: new Date().toISOString(),
        method: 'group_payment',
        notes: `Paid $${totalAmount} for entire group of ${participants.length}`,
        recordedBy: currentUserId
      };

      if (isDivisionBased && currentDivision) {
        const updatedDivisions = event.divisions.map(div => 
          div.id === selectedDivision 
            ? { ...div, paymentData: newPaymentData }
            : div
        );
        
        await onPaymentUpdate(event.id, { divisions: updatedDivisions });
      } else {
        await onPaymentUpdate(event.id, { paymentData: newPaymentData });
      }
      
      setErrors([]);
    } catch (error) {
      setErrors([`Group payment failed: ${error.message}`]);
    } finally {
      setProcessing(null);
    }
  };

  const formatPaymentDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (fee <= 0) {
    return (
      <div className="payment-status">
        <StyleSheet />
        <div className="p-6">
          <Alert 
            type="info" 
            title={`Free ${eventLabel}`} 
            message={`This ${eventType} has no ${feeLabel.toLowerCase()}.`} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="payment-status">
      <StyleSheet />
      
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="payment-section">
              <div className="payment-section-content">
                <Alert
                  type="error"
                  title="Payment Error"
                  message={errors.join(', ')}
                  onClose={() => setErrors([])}
                />
              </div>
            </div>
          )}

          {/* Header */}
          <div className="payment-input-group">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <DollarSign className="h-6 w-6 text-green-600 mr-2" />
                  Payment Tracking
                </h2>
                <p className="text-gray-600 text-sm">
                  {event.name} • ${fee} per person
                </p>
              </div>
            </div>
          </div>

          {/* Division Selector */}
          {isDivisionBased && event.divisions.length > 1 && (
            <div className="payment-section">
              <div className="payment-section-content">
                <div className="payment-input-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Division
                  </label>
                  <Select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    options={event.divisions
                      .filter(div => div.entryFee > 0)
                      .map(div => ({
                        value: div.id,
                        label: `${div.name} - ${div.entryFee}`
                      }))
                    }
                    className="w-full max-w-md"
                  />
                </div>
              </div>
            </div>
          )}

        {/* Payment Overview Section */}
        <div className="payment-section">
          <div 
            className="payment-section-header"
            onClick={() => toggleSection('overview')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Receipt className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment Overview</h3>
                  <p className="text-sm text-gray-600 mt-1">Summary and payment mode details</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.overview ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          <div className={`payment-expandable ${expandedSections.overview ? 'expanded' : 'collapsed'}`}>
            <div className="payment-section-content">
              {/* Payment Mode Card */}
              <div className={`payment-mode-card ${isGroupPayment ? 'group-mode' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      {isGroupPayment ? 'Group Payment Mode' : 'Individual Payment Mode'}
                    </h4>
                    <p className="text-sm opacity-90">
                      {isGroupPayment 
                        ? 'One person pays for everyone' 
                        : 'Each participant pays their own fee'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ${isGroupPayment ? (fee * participants.length) : fee}
                    </p>
                    <p className="text-sm opacity-90">
                      {isGroupPayment ? 'total' : 'per person'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="payment-summary-card">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Payment Summary
                </h4>
                <div className="payment-stats">
                  <div className="payment-stat-item">
                    <div className="payment-stat-number">{summary.totalParticipants}</div>
                    <div className="payment-stat-label">Participants</div>
                  </div>
                  <div className="payment-stat-item">
                    <div className="payment-stat-number">${summary.totalExpected}</div>
                    <div className="payment-stat-label">Expected</div>
                  </div>
                  <div className="payment-stat-item">
                    <div className="payment-stat-number">${summary.totalPaid}</div>
                    <div className="payment-stat-label">Collected</div>
                  </div>
                  <div className="payment-stat-item">
                    <div className="payment-stat-number">${summary.totalOwed}</div>
                    <div className="payment-stat-label">Outstanding</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="payment-progress-container">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Payment Progress</span>
                    <span className="text-sm">{summary.paidCount}/{summary.totalParticipants} paid</span>
                  </div>
                  <div className="payment-progress-bar">
                    <div 
                      className="payment-progress-fill"
                      style={{ width: `${summary.paymentRate}%` }}
                    ></div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-lg font-bold">{summary.paymentRate}%</span>
                    <span className="text-sm ml-1">complete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Group Payment Selector */}
        {isGroupPayment && summary.totalPaid === 0 && (
          <div className="payment-section">
            <div 
              className="payment-section-header"
              onClick={() => toggleSection('actions')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Group Payment</h3>
                    <p className="text-sm text-gray-600 mt-1">Select who will pay for everyone</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.actions ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            <div className={`payment-expandable ${expandedSections.actions ? 'expanded' : 'collapsed'}`}>
              <div className="payment-section-content">
                <div className="group-payment-selector">
                  <h4 className="text-lg font-semibold mb-2">Select Group Payer</h4>
                  <p className="text-sm opacity-90 mb-4">
                    Choose who will pay ${fee * participants.length} for all {participants.length} participants
                  </p>
                  
                  <div className="group-payment-options">
                    {participantsWithPayment.slice(0, 6).map(p => (
                      <div
                        key={p.id}
                        className="group-payment-option"
                        onClick={() => handleGroupPayment(p.id)}
                      >
                        <div className="font-medium">{p.member.firstName}</div>
                        <div className="text-xs opacity-75 mt-1">{p.member.lastName}</div>
                      </div>
                    ))}
                  </div>
                  
                  {processing === 'group' && (
                    <div className="text-center mt-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <p className="text-sm mt-2">Processing group payment...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participants List */}
        <div className="payment-section">
          <div 
            className="payment-section-header"
            onClick={() => toggleSection('participants')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Participants ({participantsWithPayment.length})</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage individual payments</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.participants ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          <div className={`payment-expandable ${expandedSections.participants ? 'expanded' : 'collapsed'}`}>
            <div className="payment-section-content">
              <div>
                {participantsWithPayment.map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    fee={fee}
                    isGroupPayment={isGroupPayment}
                    onPayment={(amount) => handlePayment(participant.id, amount)}
                    onRemovePayment={() => removePayment(participant.id)}
                    processing={processing === participant.id}
                    formatPaymentDate={formatPaymentDate}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Completion Celebration */}
        {summary.isFullyPaid && (
          <div className="payment-completion-card">
            <div className="payment-completion-icon">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold mb-2">Payment Complete! 🎉</h4>
            <p className="opacity-90">
              All participants have paid their {feeLabel.toLowerCase()}.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

/**
 * Beautiful Participant Card Component
 */
const ParticipantCard = ({ 
  participant,
  fee,
  isGroupPayment,
  onPayment,
  onRemovePayment,
  processing,
  formatPaymentDate
}) => {
  const [customAmount, setCustomAmount] = useState(fee.toString());

  const getStatusConfig = (status) => {
    const configs = {
      unpaid: { 
        icon: XCircle, 
        label: 'Unpaid'
      },
      partial: { 
        icon: AlertTriangle, 
        label: 'Partial'
      },
      paid: { 
        icon: CheckCircle2, 
        label: 'Paid'
      },
      overpaid: { 
        icon: TrendingUp, 
        label: 'Overpaid'
      }
    };
    return configs[status] || configs.unpaid;
  };

  const statusConfig = getStatusConfig(participant.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`participant-card status-${participant.status}`}>
      <div className="flex items-center justify-between">
        {/* Participant Info */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {participant.member.firstName.charAt(0)}{participant.member.lastName.charAt(0)}
              </span>
            </div>
            {participant.isCurrentUser && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900">
                {participant.member.firstName} {participant.member.lastName}
              </h4>
              {participant.isCurrentUser && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">You</span>
              )}
            </div>
            <p className="text-sm text-gray-600">{participant.member.email}</p>
            
            {/* Payment Details */}
            <div className="mt-2 text-sm">
              {participant.status === 'paid' && (
                <span className="text-green-600 font-medium">✓ Paid ${participant.amountPaid}</span>
              )}
              {participant.status === 'partial' && (
                <span className="text-yellow-600 font-medium">⚠ Paid ${participant.amountPaid}, owes ${participant.amountOwed}</span>
              )}
              {participant.status === 'overpaid' && (
                <span className="text-blue-600 font-medium">↗ Overpaid ${participant.amountPaid}</span>
              )}
              {participant.status === 'unpaid' && (
                <span className="text-red-600 font-medium">✗ Owes ${fee}</span>
              )}
              {participant.paymentDate && (
                <span className="text-gray-500 ml-2">• {formatPaymentDate(participant.paymentDate)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-3">
          {/* Status Badge */}
          <span className={`status-badge ${participant.status}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </span>

          {/* Action Buttons */}
          {!isGroupPayment && (
            <div className="flex items-center space-x-2">
              {participant.status === 'unpaid' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="payment-amount-input"
                    step="0.01"
                    min="0"
                  />
                  <Button
                    onClick={() => onPayment(customAmount)}
                    loading={processing}
                    disabled={processing || !customAmount || parseFloat(customAmount) <= 0}
                    className="payment-action-button primary"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Paid
                  </Button>
                </div>
              )}
              
              {participant.status !== 'unpaid' && (
                <Button
                  onClick={onRemovePayment}
                  loading={processing}
                  disabled={processing}
                  className="payment-action-button danger"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;