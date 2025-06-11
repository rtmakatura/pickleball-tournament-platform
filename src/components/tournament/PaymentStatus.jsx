// src/components/tournament/PaymentStatus.jsx (UPDATED - Division Support)
import React, { useState } from 'react';
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
  Trophy
} from 'lucide-react';
import { Button, Alert, Select, Card } from '../ui';
import { PAYMENT_MODES } from '../../services/models';
import { 
  calculateDivisionPaymentSummary, 
  calculateTournamentPaymentSummary,
  calculateLeaguePaymentSummary,
  getParticipantPaymentStatus
} from '../../utils/paymentUtils';

/**
 * PaymentStatus Component - Track entry fee payments for tournaments and leagues
 * UPDATED: Now supports division-based payment tracking for tournaments
 * 
 * Props:
 * - event: object - Event data (tournament with divisions or league)
 * - eventType: string - 'tournament' or 'league'
 * - divisionId: string - Optional division ID for single division view
 * - members: array - All members data for participant lookup
 * - onPaymentUpdate: function - Called when payment status changes
 * - currentUserId: string - ID of current user (for highlighting)
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

  // Determine if this is a division-based tournament
  const isDivisionBased = eventType === 'tournament' && event.divisions && Array.isArray(event.divisions);
  const isLegacyTournament = eventType === 'tournament' && !isDivisionBased;
  const isLeague = eventType === 'league';

  // Get current division for division-based tournaments
  const currentDivision = isDivisionBased 
    ? event.divisions.find(div => div.id === selectedDivision)
    : null;

  // Get payment data and fee based on event type and structure
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

  // Validation helper
  const validatePaymentAmount = (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= 0;
  };

  // Get participant details with payment info and venmo handles
  const getParticipantsWithPaymentInfo = () => {
    if (participants.length === 0) return [];

    return participants.map(participantId => {
      const member = members.find(m => m.id === participantId);
      const paymentStatus = getParticipantPaymentStatus(participantId, paymentData, fee);
      
      return {
        id: participantId,
        member: member || { firstName: 'Unknown', lastName: 'Member', email: '', venmoHandle: '' },
        ...paymentStatus,
        paymentDate: paymentData[participantId]?.date || null,
        notes: paymentData[participantId]?.notes || ''
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

  // Handle individual payment
  const handlePayment = (participantId, amount, notes = '') => {
    if (!validatePaymentAmount(amount)) {
      setErrors(['Invalid payment amount']);
      return;
    }

    const paymentAmount = parseFloat(amount);
    const newPaymentRecord = {
      amount: paymentAmount,
      date: new Date().toISOString(),
      method: isGroupPayment ? 'group' : 'individual',
      notes: notes || `Payment of $${paymentAmount}`,
      recordedBy: currentUserId
    };

    // Update payment data based on event structure
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
      
      onPaymentUpdate(event.id, { divisions: updatedDivisions });
    } else {
      const newPaymentData = {
        ...paymentData,
        [participantId]: newPaymentRecord
      };
      
      onPaymentUpdate(event.id, { paymentData: newPaymentData });
    }
    
    setErrors([]);
  };

  // Handle group payment
  const handleGroupPayment = (payerId) => {
    const totalAmount = fee * participants.length;
    let newPaymentData = {};
    
    // Set group payer payment
    newPaymentData[payerId] = {
      amount: totalAmount,
      date: new Date().toISOString(),
      method: 'group_payment',
      notes: `Paid $${totalAmount} for entire group of ${participants.length}`,
      recordedBy: currentUserId
    };

    // Update based on event structure
    if (isDivisionBased && currentDivision) {
      const updatedDivisions = event.divisions.map(div => 
        div.id === selectedDivision 
          ? { ...div, paymentData: newPaymentData }
          : div
      );
      
      onPaymentUpdate(event.id, { divisions: updatedDivisions });
    } else {
      onPaymentUpdate(event.id, { paymentData: newPaymentData });
    }
    
    setErrors([]);
  };

  // Remove payment
  const removePayment = (participantId) => {
    if (isDivisionBased && currentDivision) {
      const updatedPaymentData = { ...currentDivision.paymentData };
      delete updatedPaymentData[participantId];
      
      const updatedDivisions = event.divisions.map(div => 
        div.id === selectedDivision 
          ? { ...div, paymentData: updatedPaymentData }
          : div
      );
      
      onPaymentUpdate(event.id, { divisions: updatedDivisions });
    } else {
      const newPaymentData = { ...paymentData };
      delete newPaymentData[participantId];
      
      onPaymentUpdate(event.id, { paymentData: newPaymentData });
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const badges = {
      unpaid: { color: 'bg-red-100 text-red-800', label: 'Unpaid' },
      partial: { color: 'bg-yellow-100 text-yellow-800', label: 'Partial' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      overpaid: { color: 'bg-blue-100 text-blue-800', label: 'Overpaid' }
    };
    return badges[status] || badges.unpaid;
  };

  // Get Venmo link for easy payment
  const getVenmoLink = (venmoHandle, amount) => {
    if (!venmoHandle) return null;
    const note = encodeURIComponent(`${eventLabel} ${feeLabel} - ${event.name}${currentDivision ? ` (${currentDivision.name})` : ''}`);
    return `https://venmo.com/${venmoHandle}?txn=pay&amount=${amount}&note=${note}`;
  };

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
    <div className="space-y-6">
      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert
          type="error"
          title="Payment Error"
          message={errors.join(', ')}
          onClose={() => setErrors([])}
        />
      )}

      {/* Division Selector for Division-Based Tournaments */}
      {isDivisionBased && event.divisions.length > 1 && (
        <Card title="Select Division">
          <Select
            label="Division"
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            options={event.divisions
              .filter(div => div.entryFee > 0)
              .map(div => ({
                value: div.id,
                label: `${div.name} - $${div.entryFee} (${div.participants?.length || 0} participants)`
              }))
            }
            helperText="Select a division to manage payments"
          />
          
          {currentDivision && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Event Type:</span>
                  <p className="capitalize">{currentDivision.eventType?.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Skill Level:</span>
                  <p className="capitalize">{currentDivision.skillLevel}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Entry Fee:</span>
                  <p>${currentDivision.entryFee}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Participants:</span>
                  <p>{currentDivision.participants?.length || 0}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Payment Mode Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">
              {isGroupPayment ? 'Group Payment Mode' : 'Individual Payment Mode'}
              {isDivisionBased && currentDivision && (
                <span className="ml-2 text-sm text-blue-700">({currentDivision.name})</span>
              )}
            </h4>
            <p className="text-sm text-blue-700">
              {isGroupPayment 
                ? 'One person pays for everyone' 
                : 'Each participant pays their own fee'
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-900">${fee}</p>
            <p className="text-sm text-blue-700">per person</p>
          </div>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Participants</p>
              <p className="text-lg font-semibold text-gray-900">
                {summary.totalParticipants}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Receipt className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Expected</p>
              <p className="text-lg font-semibold text-blue-900">
                ${summary.totalExpected}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm text-green-600">Collected</p>
              <p className="text-lg font-semibold text-green-900">
                ${summary.totalPaid}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${
          summary.totalOwed === 0 
            ? summary.totalOverpaid > 0 
              ? 'bg-yellow-50' 
              : 'bg-green-50'
            : 'bg-red-50'
        }`}>
          <div className="flex items-center">
            {summary.totalOwed === 0 ? (
              summary.totalOverpaid > 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              )
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            )}
            <div>
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
              <p className={`text-lg font-semibold ${
                summary.totalOwed === 0 
                  ? summary.totalOverpaid > 0 
                    ? 'text-yellow-900' 
                    : 'text-green-900'
                  : 'text-red-900'
              }`}>
                ${summary.totalOwed > 0 ? summary.totalOwed : summary.totalOverpaid}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Group Payment Setup */}
      {isGroupPayment && summary.totalPaid === 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-3">Set Group Payer</h4>
          <p className="text-sm text-yellow-800 mb-4">
            Select who will pay the ${summary.totalExpected} {feeLabel.toLowerCase()} for the entire group:
          </p>
          
          <div className="flex items-center space-x-4">
            <Select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleGroupPayment(e.target.value);
                }
              }}
              options={[
                { value: '', label: 'Select group payer...' },
                ...participantsWithPayment.map(p => ({
                  value: p.id,
                  label: `${p.member.firstName} ${p.member.lastName}${p.member.venmoHandle ? ` (@${p.member.venmoHandle})` : ''}`
                }))
              ]}
              className="flex-1"
            />
          </div>
        </div>
      )}

      {/* Participant Payment List */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Payment Status by Participant
            {isDivisionBased && currentDivision && (
              <span className="ml-2 text-sm text-gray-600">({currentDivision.name})</span>
            )}
          </h3>
          <p className="text-sm text-gray-600">
            {summary.paidCount} of {summary.totalParticipants} participants have paid in full
          </p>
        </div>
        
        <div className="divide-y">
          {participantsWithPayment.map((participant) => {
            const isCurrentUser = participant.id === currentUserId;
            const statusBadge = getStatusBadge(participant.status);
            const hasVenmo = participant.member.venmoHandle;
            const venmoLink = hasVenmo ? getVenmoLink(participant.member.venmoHandle, fee) : null;
            
            return (
              <div 
                key={participant.id} 
                className={`p-4 ${isCurrentUser ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {participant.member.firstName} {participant.member.lastName}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {participant.member.email}
                      </p>
                      
                      {/* Venmo Handle Display */}
                      {hasVenmo && (
                        <div className="flex items-center space-x-2 mt-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-700">@{participant.member.venmoHandle}</span>
                          {venmoLink && (
                            <a 
                              href={venmoLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          )}
                        </div>
                      )}
                      
                      {/* Payment details */}
                      <div className="mt-1 text-sm">
                        {participant.status === 'paid' && (
                          <p className="text-green-600">
                            ✓ Paid ${participant.amountPaid} {participant.paymentDate && `on ${new Date(participant.paymentDate).toLocaleDateString()}`}
                          </p>
                        )}
                        {participant.status === 'partial' && (
                          <p className="text-yellow-600">
                            ⚠ Partial payment: ${participant.amountPaid} (owes ${participant.amountOwed})
                          </p>
                        )}
                        {participant.status === 'overpaid' && (
                          <p className="text-blue-600">
                            ↗ Overpaid: ${participant.amountPaid} (excess: ${participant.overpaidAmount})
                          </p>
                        )}
                        {participant.status === 'unpaid' && (
                          <p className="text-red-600">
                            ✗ Unpaid (owes ${fee})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Actions */}
                  <div className="flex items-center space-x-3">
                    {!isGroupPayment ? (
                      <>
                        {participant.status === 'unpaid' && (
                          <div className="flex items-center space-x-2">
                            {hasVenmo && venmoLink && (
                              <a
                                href={venmoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 flex items-center"
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pay via Venmo
                              </a>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handlePayment(participant.id, fee)}
                            >
                              Mark Paid (${fee})
                            </Button>
                          </div>
                        )}
                        
                        {participant.status !== 'unpaid' && (
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                              ${participant.amountPaid}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removePayment(participant.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center">
                        <span className="text-sm text-gray-500">
                          {summary.isFullyPaid ? 'Covered by group payment' : 'Waiting for group payment'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Complete Summary */}
      {summary.isFullyPaid && (
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h4 className="font-medium text-green-900">Payment Complete</h4>
              <p className="text-sm text-green-700">
                All participants have paid their {feeLabel.toLowerCase()}.
                {summary.totalOverpaid > 0 && ` Note: $${summary.totalOverpaid} in overpayments may need to be refunded.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Overview for Division-Based Tournaments */}
      {isDivisionBased && (
        <Card title="Tournament Payment Overview">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-3">
              Payment status across all divisions with entry fees
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {event.divisions
                .filter(div => div.entryFee > 0)
                .map(division => {
                  const divSummary = calculateDivisionPaymentSummary(division);
                  
                  return (
                    <div key={division.id} className="bg-gray-50 p-4 rounded border">
                      <div className="flex items-center space-x-2 mb-2">
                        <Trophy className="h-4 w-4 text-gray-600" />
                        <h4 className="font-medium text-gray-900">{division.name}</h4>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">
                          ${division.entryFee} × {divSummary.totalParticipants} = ${divSummary.totalExpected}
                        </p>
                        <p className={`font-medium ${
                          divSummary.isFullyPaid ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {divSummary.isFullyPaid ? '✓ Complete' : `$${divSummary.totalOwed} owed`}
                        </p>
                        <p className="text-gray-500">
                          {divSummary.paidCount}/{divSummary.totalParticipants} paid ({divSummary.paymentRate}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PaymentStatus;