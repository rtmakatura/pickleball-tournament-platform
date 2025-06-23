// src/components/tournament/PaymentStatus.jsx (MOBILE-FIRST REDESIGN)
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Check, 
  Clock, 
  AlertCircle, 
  User,
  CreditCard,
  Users,
  UserCheck,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Trophy,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  Target,
  Zap,
  RefreshCw,
  Bell,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { Button, Alert, Select, Card, Modal } from '../ui';
import { PAYMENT_MODES } from '../../services/models';
import { 
  calculateDivisionPaymentSummary, 
  calculateTournamentPaymentSummary,
  calculateLeaguePaymentSummary,
  getParticipantPaymentStatus
} from '../../utils/paymentUtils';

// Mobile-optimized styles
const mobilePaymentStyles = `
  /* Touch-optimized payment interfaces */
  .payment-card {
    transition: all 0.2s ease;
  }
  
  .payment-card:active {
    transform: scale(0.98);
  }
  
  .payment-action-button {
    min-height: 52px;
    min-width: 120px;
    transition: all 0.2s ease;
  }
  
  .payment-action-button:active {
    transform: scale(0.95);
  }
  
  /* Status indicators optimized for mobile */
  .payment-status-indicator {
    position: relative;
    overflow: hidden;
  }
  
  .payment-status-indicator::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    transition: background-color 0.3s ease;
  }
  
  .status-unpaid::before { background-color: #ef4444; }
  .status-partial::before { background-color: #f59e0b; }
  .status-paid::before { background-color: #10b981; }
  .status-overpaid::before { background-color: #3b82f6; }
  
  /* Pull-to-refresh feel */
  .payment-list {
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Mobile payment amount input */
  .payment-input {
    font-size: 18px;
    font-weight: 600;
    text-align: center;
  }
  
  /* Venmo link styling */
  .venmo-link {
    background: linear-gradient(135deg, #3D95CE 0%, #008CFF 100%);
    transition: all 0.2s ease;
  }
  
  .venmo-link:active {
    transform: scale(0.98);
  }
  
  /* Swipe actions hint */
  .swipe-hint {
    background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 50%, transparent 100%);
    animation: swipeHint 2s ease-in-out infinite;
  }
  
  @keyframes swipeHint {
    0%, 100% { transform: translateX(-10px); opacity: 0.3; }
    50% { transform: translateX(10px); opacity: 0.7; }
  }
  
  /* Success animations */
  .payment-success {
    animation: paymentSuccess 0.5s ease-out;
  }
  
  @keyframes paymentSuccess {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: mobilePaymentStyles }} />
);

/**
 * Mobile-First Payment Status Component
 * 
 * Features:
 * - Card-based participant layouts
 * - Touch-optimized payment actions
 * - Progressive disclosure for payment details
 * - Quick payment workflows
 * - Venmo integration
 * - Visual payment status indicators
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
  
  // Mobile-specific state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedPayments, setExpandedPayments] = useState(new Set());
  const [showQuickPay, setShowQuickPay] = useState(null);
  const [showGroupPayModal, setShowGroupPayModal] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
  const getParticipantsWithPaymentInfo = () => {
    if (participants.length === 0) return [];

    return participants.map(participantId => {
      const member = members.find(m => m.id === participantId);
      const paymentStatus = getParticipantPaymentStatus(participantId, paymentData, fee);
      
      return {
        id: participantId,
        member: member || { firstName: 'Unknown', lastName: 'Member', email: '', venmoHandle: '', phoneNumber: '' },
        ...paymentStatus,
        paymentDate: paymentData[participantId]?.date || null,
        notes: paymentData[participantId]?.notes || '',
        isCurrentUser: participantId === currentUserId
      };
    });
  };

  const participantsWithPayment = getParticipantsWithPaymentInfo();

  // Calculate payment summary
  const getPaymentSummary = () => {
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
      totalOverpaid: 0,
      paidCount: 0,
      partialCount: 0,
      unpaidCount: 0,
      overpaidCount: 0,
      isFullyPaid: true,
      paymentRate: 100,
      hasPaymentIssues: false
    };
  };

  const summary = getPaymentSummary();

  // Filter participants
  const getFilteredParticipants = () => {
    let filtered = participantsWithPayment;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => {
        const name = `${p.member.firstName} ${p.member.lastName}`.toLowerCase();
        const email = p.member.email.toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Sort: current user first, then by payment status, then by name
    return filtered.sort((a, b) => {
      if (a.isCurrentUser && !b.isCurrentUser) return -1;
      if (!a.isCurrentUser && b.isCurrentUser) return 1;
      
      const statusOrder = { unpaid: 0, partial: 1, overpaid: 2, paid: 3 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      return `${a.member.firstName} ${a.member.lastName}`.localeCompare(
        `${b.member.firstName} ${b.member.lastName}`
      );
    });
  };

  const filteredParticipants = getFilteredParticipants();

  // Payment handlers
  const handlePayment = async (participantId, amount, notes = '') => {
    setProcessing(participantId);
    try {
      const paymentAmount = parseFloat(amount);
      const newPaymentRecord = {
        amount: paymentAmount,
        date: new Date().toISOString(),
        method: isGroupPayment ? 'group' : 'individual',
        notes: notes || `Payment of $${paymentAmount}`,
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
      
      setLastUpdated(new Date());
      setShowQuickPay(null);
      setErrors([]);
    } catch (error) {
      setErrors([`Payment failed: ${error.message}`]);
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
      
      setShowGroupPayModal(false);
      setLastUpdated(new Date());
      setErrors([]);
    } catch (error) {
      setErrors([`Group payment failed: ${error.message}`]);
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
      
      setLastUpdated(new Date());
      setErrors([]);
    } catch (error) {
      setErrors([`Failed to remove payment: ${error.message}`]);
    } finally {
      setProcessing(null);
    }
  };

  // Venmo link generation
  const getVenmoLink = (venmoHandle, amount) => {
    if (!venmoHandle) return null;
    const note = encodeURIComponent(`${eventLabel} ${feeLabel} - ${event.name}${currentDivision ? ` (${currentDivision.name})` : ''}`);
    return `https://venmo.com/${venmoHandle}?txn=pay&amount=${amount}&note=${note}`;
  };

  // Toggle expanded payment details
  const togglePaymentDetails = (participantId) => {
    const newExpanded = new Set(expandedPayments);
    if (newExpanded.has(participantId)) {
      newExpanded.delete(participantId);
    } else {
      newExpanded.add(participantId);
    }
    setExpandedPayments(newExpanded);
  };

  if (fee <= 0) {
    return (
      <div className="p-4">
        <StyleSheet />
        <Alert 
          type="info" 
          title={`Free ${eventLabel}`} 
          message={`This ${eventType} has no ${feeLabel.toLowerCase()}.`} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StyleSheet />
      
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="sticky top-0 z-40 p-4">
          <Alert
            type="error"
            title="Payment Error"
            message={errors.join(', ')}
            onClose={() => setErrors([])}
          />
        </div>
      )}

      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className={`font-bold text-gray-900 flex items-center ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                <DollarSign className={`text-green-600 mr-2 ${isMobile ? 'h-5 w-5' : 'h-8 w-8'}`} />
                Payment Tracking
              </h1>
              <p className="text-gray-600 text-sm truncate">
                {event.name} • ${fee} per person
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLastUpdated(new Date())}
                className="touch-target"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {isGroupPayment && summary.totalPaid === 0 && (
                <Button
                  size="sm"
                  onClick={() => setShowGroupPayModal(true)}
                  className="touch-target"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Group Pay
                </Button>
              )}
            </div>
          </div>

          {/* Division Selector */}
          {isDivisionBased && event.divisions.length > 1 && (
            <div className="mb-4">
              <Select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                options={event.divisions
                  .filter(div => div.entryFee > 0)
                  .map(div => ({
                    value: div.id,
                    label: `${div.name} - $${div.entryFee}`
                  }))
                }
                className="w-full"
              />
            </div>
          )}

          {/* Payment Mode Info */}
          <div className={`rounded-lg p-3 mb-4 ${isGroupPayment ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-medium ${isGroupPayment ? 'text-blue-900' : 'text-green-900'}`}>
                  {isGroupPayment ? 'Group Payment Mode' : 'Individual Payment Mode'}
                </h4>
                <p className={`text-sm ${isGroupPayment ? 'text-blue-700' : 'text-green-700'}`}>
                  {isGroupPayment 
                    ? 'One person pays for everyone' 
                    : 'Each participant pays their own fee'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${isGroupPayment ? 'text-blue-900' : 'text-green-900'}`}>
                  ${isGroupPayment ? (fee * participants.length) : fee}
                </p>
                <p className={`text-sm ${isGroupPayment ? 'text-blue-700' : 'text-green-700'}`}>
                  {isGroupPayment ? 'total' : 'per person'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="p-4">
        <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <div className="bg-white rounded-xl p-4 border shadow-sm text-center">
            <Users className="h-6 w-6 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{summary.totalParticipants}</p>
            <p className="text-sm text-gray-600">Participants</p>
          </div>

          <div className="bg-white rounded-xl p-4 border shadow-sm text-center">
            <Receipt className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">${summary.totalExpected}</p>
            <p className="text-sm text-blue-600">Expected</p>
          </div>

          <div className="bg-white rounded-xl p-4 border shadow-sm text-center">
            <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">${summary.totalPaid}</p>
            <p className="text-sm text-green-600">Collected</p>
          </div>

          <div className="bg-white rounded-xl p-4 border shadow-sm text-center">
            <div className="h-6 w-6 mx-auto mb-2">
              {summary.totalOwed === 0 ? (
                summary.totalOverpaid > 0 ? (
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                )
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <p className={`text-2xl font-bold ${
              summary.totalOwed === 0 
                ? summary.totalOverpaid > 0 
                  ? 'text-yellow-900' 
                  : 'text-green-900'
                : 'text-red-900'
            }`}>
              ${summary.totalOwed > 0 ? summary.totalOwed : summary.totalOverpaid}
            </p>
            <p className={`text-sm ${
              summary.totalOwed === 0 
                ? summary.totalOverpaid > 0 
                  ? 'text-yellow-600' 
                  : 'text-green-600'
                : 'text-red-600'
            }`}>
              {summary.totalOwed === 0 
                ? summary.totalOverpaid > 0 
                  ? 'Overpaid' 
                  : 'Complete'
                : 'Outstanding'
              }
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-4 border shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Payment Progress</span>
            <span className="text-sm text-gray-600">{summary.paidCount}/{summary.totalParticipants} paid</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${summary.paymentRate}%` }}
            ></div>
          </div>
          <div className="text-center mt-2">
            <span className="text-lg font-bold text-green-600">{summary.paymentRate}%</span>
            <span className="text-sm text-gray-600 ml-1">complete</span>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search participants..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Participants' },
                { value: 'unpaid', label: 'Unpaid Only' },
                { value: 'partial', label: 'Partial Payments' },
                { value: 'paid', label: 'Paid Only' },
                { value: 'overpaid', label: 'Overpaid Only' }
              ]}
              className="w-full"
            />

            <div className="text-sm text-gray-600 text-center">
              Showing {filteredParticipants.length} of {participantsWithPayment.length} participants
            </div>
          </div>
        </Card>

        {/* Participant Payment Cards */}
        <div className="space-y-4 payment-list">
          {filteredParticipants.map((participant) => (
            <MobilePaymentCard
              key={participant.id}
              participant={participant}
              fee={fee}
              isGroupPayment={isGroupPayment}
              isExpanded={expandedPayments.has(participant.id)}
              onToggle={() => togglePaymentDetails(participant.id)}
              onPayment={(amount, notes) => handlePayment(participant.id, amount, notes)}
              onRemovePayment={() => removePayment(participant.id)}
              processing={processing === participant.id}
              venmoLink={participant.member.venmoHandle ? getVenmoLink(participant.member.venmoHandle, fee) : null}
              isMobile={isMobile}
              showQuickPay={showQuickPay === participant.id}
              onShowQuickPay={() => setShowQuickPay(participant.id)}
              onHideQuickPay={() => setShowQuickPay(null)}
            />
          ))}
        </div>

        {filteredParticipants.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No participants found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Completion Message */}
        {summary.isFullyPaid && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-green-900">Payment Complete! 🎉</h4>
                <p className="text-sm text-green-700 mt-1">
                  All participants have paid their {feeLabel.toLowerCase()}.
                  {summary.totalOverpaid > 0 && ` Note: $${summary.totalOverpaid} in overpayments may need to be refunded.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom padding for mobile */}
        <div className="h-20"></div>
      </div>

      {/* Group Payment Modal */}
      <Modal
        isOpen={showGroupPayModal}
        onClose={() => setShowGroupPayModal(false)}
        title="Group Payment Setup"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Group Payment</h4>
            <p className="text-sm text-blue-800">
              Select who will pay the <strong>${fee * participants.length}</strong> total for all {participants.length} participants:
            </p>
          </div>

          <div className="space-y-3">
            {participantsWithPayment.map(p => (
              <div 
                key={p.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleGroupPayment(p.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-semibold">
                        {p.member.firstName.charAt(0)}{p.member.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {p.member.firstName} {p.member.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{p.member.email}</p>
                      {p.member.venmoHandle && (
                        <p className="text-xs text-green-600">@{p.member.venmoHandle}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>

          {processing === 'group' && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-2">Setting up group payment...</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

/**
 * Mobile Payment Card Component
 * 
 * Features:
 * - Touch-optimized payment actions
 * - Visual payment status indicators
 * - Quick payment workflows
 * - Venmo integration
 * - Progressive disclosure for details
 */
const MobilePaymentCard = ({ 
  participant,
  fee,
  isGroupPayment,
  isExpanded,
  onToggle,
  onPayment,
  onRemovePayment,
  processing,
  venmoLink,
  isMobile,
  showQuickPay,
  onShowQuickPay,
  onHideQuickPay
}) => {
  const [customAmount, setCustomAmount] = useState(fee.toString());

  const getStatusConfig = (status) => {
    const configs = {
      unpaid: { 
        color: 'bg-red-50 border-red-200 text-red-800', 
        icon: XCircle, 
        label: 'Unpaid',
        statusClass: 'status-unpaid'
      },
      partial: { 
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800', 
        icon: AlertTriangle, 
        label: 'Partial',
        statusClass: 'status-partial'
      },
      paid: { 
        color: 'bg-green-50 border-green-200 text-green-800', 
        icon: CheckCircle2, 
        label: 'Paid',
        statusClass: 'status-paid'
      },
      overpaid: { 
        color: 'bg-blue-50 border-blue-200 text-blue-800', 
        icon: TrendingUp, 
        label: 'Overpaid',
        statusClass: 'status-overpaid'
      }
    };
    return configs[status] || configs.unpaid;
  };

  const statusConfig = getStatusConfig(participant.status);
  const StatusIcon = statusConfig.icon;

  const handleQuickPayment = () => {
    onPayment(customAmount);
  };

  const formatPaymentDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className={`payment-card payment-status-indicator ${statusConfig.statusClass} bg-white rounded-xl border shadow-sm overflow-hidden`}>
      {/* Card Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className={`
              h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 relative
              ${participant.status === 'paid' ? 'bg-green-100' : 
                participant.status === 'overpaid' ? 'bg-blue-100' :
                participant.status === 'partial' ? 'bg-yellow-100' : 'bg-red-100'}
            `}>
              <span className={`text-lg font-semibold ${
                participant.status === 'paid' ? 'text-green-700' : 
                participant.status === 'overpaid' ? 'text-blue-700' :
                participant.status === 'partial' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {participant.member.firstName.charAt(0)}{participant.member.lastName.charAt(0)}
              </span>
              
              {participant.isCurrentUser && (
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  <User className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Name and Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {participant.member.firstName} {participant.member.lastName}
                </h3>
                {participant.isCurrentUser && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    You
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </span>
                
                {participant.status === 'paid' && participant.paymentDate && (
                  <span className="text-xs text-gray-500">
                    {formatPaymentDate(participant.paymentDate)}
                  </span>
                )}
              </div>

              {/* Payment Amount */}
              <div className="mt-2">
                {participant.status === 'paid' && (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ Paid ${participant.amountPaid}
                  </p>
                )}
                {participant.status === 'partial' && (
                  <p className="text-sm text-yellow-600 font-medium">
                    ⚠ Paid ${participant.amountPaid}, owes ${participant.amountOwed}
                  </p>
                )}
                {participant.status === 'overpaid' && (
                  <p className="text-sm text-blue-600 font-medium">
                    ↗ Overpaid ${participant.amountPaid} (excess: ${participant.overpaidAmount})
                  </p>
                )}
                {participant.status === 'unpaid' && (
                  <p className="text-sm text-red-600 font-medium">
                    ✗ Owes ${fee}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status and Expand Icon */}
          <div className="flex items-center space-x-2">
            <ChevronDown 
              className={`h-5 w-5 text-gray-400 transition-transform ${
                isExpanded ? 'transform rotate-180' : ''
              }`} 
            />
          </div>
        </div>

        {/* Quick Actions Bar */}
        {!isGroupPayment && (
          <div className="mt-4 flex space-x-2">
            {participant.status === 'unpaid' && (
              <>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPayment(fee);
                  }}
                  loading={processing}
                  disabled={processing}
                  className="payment-action-button flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark Paid (${fee})
                </Button>
                
                {venmoLink && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(venmoLink, '_blank');
                    }}
                    className="venmo-link text-white payment-action-button"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Venmo
                  </Button>
                )}
              </>
            )}
            
            {participant.status !== 'unpaid' && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePayment();
                }}
                loading={processing}
                disabled={processing}
                className="payment-action-button flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Remove Payment
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="space-y-4">
            {/* Contact Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{participant.member.email}</span>
                </div>
                {participant.member.phoneNumber && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{participant.member.phoneNumber}</span>
                  </div>
                )}
                {participant.member.venmoHandle && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>@{participant.member.venmoHandle}</span>
                    </div>
                    {venmoLink && (
                      <Button
                        size="sm"
                        onClick={() => window.open(venmoLink, '_blank')}
                        className="venmo-link text-white"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Pay
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            {participant.status !== 'unpaid' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-medium">${participant.amountPaid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Date:</span>
                      <span>{formatPaymentDate(participant.paymentDate) || 'Unknown'}</span>
                    </div>
                    {participant.notes && (
                      <div className="pt-2 border-t">
                        <span className="text-gray-600 text-xs">Notes:</span>
                        <p className="text-gray-800 text-sm mt-1">{participant.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Payment Amount */}
            {!isGroupPayment && participant.status === 'unpaid' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Custom Payment Amount</h4>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1 payment-input p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Amount"
                    step="0.01"
                    min="0"
                  />
                  <Button
                    onClick={handleQuickPayment}
                    loading={processing}
                    disabled={processing || !customAmount || parseFloat(customAmount) <= 0}
                    className="payment-action-button"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Pay
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;