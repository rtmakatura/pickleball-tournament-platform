// src/components/tournament/PaymentStatus.jsx - REDESIGNED AS PURE WIDGET
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
  AlertCircle
} from 'lucide-react';
import { Button, Alert, Select } from '../ui';
import { PAYMENT_MODES } from '../../services/models';
import { 
  calculateDivisionPaymentSummary, 
  calculateTournamentPaymentSummary,
  calculateLeaguePaymentSummary,
  getParticipantPaymentStatus
} from '../../utils/paymentUtils';

/**
 * PaymentStatus - Pure Widget Component
 * 
 * No self-contained layout - relies entirely on parent containers
 * for spacing, width, and visual structure.
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
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    participants: true,
    actions: false
  });

  // Event structure detection
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

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const formatPaymentDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Early return for free events
  if (fee <= 0) {
    return (
      <Alert 
        type="info" 
        title={`Free ${eventLabel}`} 
        message={`This ${eventType} has no ${feeLabel.toLowerCase()}.`} 
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert
          type="error"
          title="Payment Error"
          message={errors.join(', ')}
          onClose={() => setErrors([])}
        />
      )}

      {/* Division Selector */}
      {isDivisionBased && event.divisions.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
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
                label: `${div.name} - $${div.entryFee}`
              }))
            }
            className="w-full max-w-md"
          />
        </div>
      )}

      {/* Payment Summary Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Payment Summary</h3>
            <p className="text-blue-100 text-sm">
              {isGroupPayment ? 'Group Payment Mode' : 'Individual Payment Mode'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              ${isGroupPayment ? (fee * participants.length) : fee}
            </p>
            <p className="text-blue-100 text-sm">
              {isGroupPayment ? 'total' : 'per person'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white bg-opacity-10 rounded p-3 text-center">
            <div className="text-xl font-bold">{summary.totalParticipants}</div>
            <div className="text-xs text-blue-100">Participants</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-3 text-center">
            <div className="text-xl font-bold">${summary.totalExpected}</div>
            <div className="text-xs text-blue-100">Expected</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-3 text-center">
            <div className="text-xl font-bold">${summary.totalPaid}</div>
            <div className="text-xs text-blue-100">Collected</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-3 text-center">
            <div className="text-xl font-bold">{summary.paymentRate}%</div>
            <div className="text-xs text-blue-100">Paid</div>
          </div>
        </div>
      </div>

      {/* Group Payment Selector */}
      {isGroupPayment && summary.totalPaid === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Select Group Payer</h4>
          <p className="text-sm text-blue-700 mb-4">
            Choose who will pay ${fee * participants.length} for all {participants.length} participants
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {participantsWithPayment.slice(0, 6).map(p => (
              <button
                key={p.id}
                className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                onClick={() => handleGroupPayment(p.id)}
                disabled={processing === 'group'}
              >
                <div className="font-medium text-sm">{p.member.firstName}</div>
                <div className="text-xs text-gray-600">{p.member.lastName}</div>
              </button>
            ))}
          </div>
          
          {processing === 'group' && (
            <div className="text-center mt-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-sm mt-2 text-blue-700">Processing group payment...</p>
            </div>
          )}
        </div>
      )}

      {/* Participants List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div 
          className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('participants')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900">Participants ({participantsWithPayment.length})</h3>
                <p className="text-sm text-gray-600">Manage individual payments</p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.participants ? 'rotate-180' : ''}`} />
          </div>
        </div>
        
        {expandedSections.participants && (
          <div className="p-4 space-y-3">
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
        )}
      </div>

      {/* Completion Celebration */}
      {summary.isFullyPaid && (
        <div className="bg-green-600 text-white rounded-lg p-4 text-center">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="text-lg font-bold mb-2">Payment Complete! 🎉</h4>
          <p className="text-green-100">
            All participants have paid their {feeLabel.toLowerCase()}.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Participant Card Component
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
        label: 'Unpaid',
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-700'
      },
      partial: { 
        icon: AlertTriangle, 
        label: 'Partial',
        bgColor: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-700'
      },
      paid: { 
        icon: CheckCircle2, 
        label: 'Paid',
        bgColor: 'bg-green-50 border-green-200',
        textColor: 'text-green-700'
      },
      overpaid: { 
        icon: TrendingUp, 
        label: 'Overpaid',
        bgColor: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-700'
      }
    };
    return configs[status] || configs.unpaid;
  };

  const statusConfig = getStatusConfig(participant.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`border-2 rounded-lg p-4 ${statusConfig.bgColor}`}>
      <div className="flex items-center justify-between">
        {/* Participant Info */}
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {participant.member.firstName.charAt(0)}{participant.member.lastName.charAt(0)}
              </span>
            </div>
            {participant.isCurrentUser && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                <User className="h-2 w-2" />
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900 text-sm">
                {participant.member.firstName} {participant.member.lastName}
              </h4>
              {participant.isCurrentUser && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">You</span>
              )}
            </div>
            
            {/* Payment Status */}
            <div className="mt-1 text-xs">
              {participant.status === 'paid' && (
                <span className={statusConfig.textColor}>✓ Paid ${participant.amountPaid}</span>
              )}
              {participant.status === 'partial' && (
                <span className={statusConfig.textColor}>⚠ Paid ${participant.amountPaid}, owes ${participant.amountOwed}</span>
              )}
              {participant.status === 'overpaid' && (
                <span className={statusConfig.textColor}>↗ Overpaid ${participant.amountPaid}</span>
              )}
              {participant.status === 'unpaid' && (
                <span className={statusConfig.textColor}>✗ Owes ${fee}</span>
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
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.textColor} bg-white bg-opacity-50`}>
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
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-center"
                    step="0.01"
                    min="0"
                  />
                  <Button
                    onClick={() => onPayment(customAmount)}
                    loading={processing}
                    disabled={processing || !customAmount || parseFloat(customAmount) <= 0}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {participant.status !== 'unpaid' && (
                <Button
                  onClick={onRemovePayment}
                  loading={processing}
                  disabled={processing}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="h-3 w-3" />
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