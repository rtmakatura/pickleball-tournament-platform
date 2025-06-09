// src/components/tournament/PaymentStatus.jsx
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
  AlertTriangle
} from 'lucide-react';
import { Button, Alert, Select } from '../ui';
import { PAYMENT_MODES } from '../../services/models';

/**
 * PaymentStatus Component - Track entry fee payments for tournaments and leagues
 * 
 * Props:
 * - event: object - Event data (tournament or league) with participants and fee
 * - eventType: string - 'tournament' or 'league'
 * - members: array - All members data for participant lookup
 * - onPaymentUpdate: function - Called when payment status changes
 * - currentUserId: string - ID of current user (for highlighting)
 */
const PaymentStatus = ({ 
  event, 
  eventType = 'tournament', // 'tournament' or 'league'
  members = [], 
  onPaymentUpdate,
  currentUserId 
}) => {
  const [paymentData, setPaymentData] = useState(
    event.paymentData || {}
  );
  const [selectedGroupPayer, setSelectedGroupPayer] = useState('');
  const [errors, setErrors] = useState([]);

  const paymentMode = event.paymentMode || PAYMENT_MODES.INDIVIDUAL;
  const isGroupPayment = paymentMode === PAYMENT_MODES.GROUP;
  
  // Get the appropriate fee field based on event type
  const feeFieldName = eventType === 'league' ? 'registrationFee' : 'entryFee';
  const fee = parseFloat(event[feeFieldName]) || 0;
  
  // Get appropriate terminology
  const feeLabel = eventType === 'league' ? 'Registration Fee' : 'Entry Fee';
  const eventLabel = eventType === 'league' ? 'League' : 'Tournament';

  // Validation helper
  const validatePaymentAmount = (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= 0;
  };

  // Get participant details with simplified payment info
  const getParticipantsWithPaymentInfo = () => {
    if (!event.participants || event.participants.length === 0) {
      return [];
    }

    return event.participants.map(participantId => {
      const member = members.find(m => m.id === participantId);
      const payment = paymentData[participantId] || {};
      
      // Simplified payment status calculation
      let status = 'unpaid';
      let amountPaid = 0;
      
      if (payment.amount && validatePaymentAmount(payment.amount)) {
        amountPaid = parseFloat(payment.amount);
        if (amountPaid >= fee) {
          status = amountPaid > fee ? 'overpaid' : 'paid';
        } else if (amountPaid > 0) {
          status = 'partial';
        }
      }
      
      return {
        id: participantId,
        member: member || { firstName: 'Unknown', lastName: 'Member', email: '' },
        status,
        amountPaid,
        amountOwed: Math.max(0, fee - amountPaid),
        overpaidAmount: Math.max(0, amountPaid - fee),
        paymentDate: payment.date || null,
        notes: payment.notes || ''
      };
    });
  };

  const participantsWithPayment = getParticipantsWithPaymentInfo();

  // Simplified payment summary calculation
  const getPaymentSummary = () => {
    const totalParticipants = participantsWithPayment.length;
    const totalExpected = fee * totalParticipants;
    
    // Calculate actual totals
    const totalPaid = participantsWithPayment.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalOwed = participantsWithPayment.reduce((sum, p) => sum + p.amountOwed, 0);
    const totalOverpaid = participantsWithPayment.reduce((sum, p) => sum + p.overpaidAmount, 0);
    
    // Count participants by status
    const paidCount = participantsWithPayment.filter(p => p.status === 'paid').length;
    const partialCount = participantsWithPayment.filter(p => p.status === 'partial').length;
    const unpaidCount = participantsWithPayment.filter(p => p.status === 'unpaid').length;
    const overpaidCount = participantsWithPayment.filter(p => p.status === 'overpaid').length;

    // Find group payer (if any)
    const groupPayer = participantsWithPayment.find(p => 
      p.amountPaid >= totalExpected && isGroupPayment
    );

    return {
      totalParticipants,
      totalExpected,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOwed: Math.round(totalOwed * 100) / 100,
      totalOverpaid: Math.round(totalOverpaid * 100) / 100,
      paidCount,
      partialCount,
      unpaidCount,
      overpaidCount,
      groupPayer: groupPayer?.member || null,
      isFullyPaid: totalOwed === 0,
      paymentRate: totalParticipants > 0 ? ((paidCount / totalParticipants) * 100).toFixed(1) : 0
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
    const newPaymentData = {
      ...paymentData,
      [participantId]: {
        amount: paymentAmount,
        date: new Date().toISOString(),
        method: isGroupPayment ? 'group' : 'individual',
        notes: notes || `Payment of $${paymentAmount}`,
        recordedBy: currentUserId
      }
    };
    
    setPaymentData(newPaymentData);
    setErrors([]);
    
    if (onPaymentUpdate) {
      onPaymentUpdate(event.id, { paymentData: newPaymentData });
    }
  };

  // Handle group payment - one person pays for everyone
  const handleGroupPayment = (payerId) => {
    const totalAmount = fee * participantsWithPayment.length;
    const newPaymentData = { ...paymentData };
    
    // Clear existing payments
    participantsWithPayment.forEach(p => {
      delete newPaymentData[p.id];
    });
    
    // Set group payer payment
    newPaymentData[payerId] = {
      amount: totalAmount,
      date: new Date().toISOString(),
      method: 'group_payment',
      notes: `Paid $${totalAmount} for entire group of ${participantsWithPayment.length}`,
      recordedBy: currentUserId
    };

    setPaymentData(newPaymentData);
    setSelectedGroupPayer('');
    setErrors([]);
    
    if (onPaymentUpdate) {
      onPaymentUpdate(event.id, { paymentData: newPaymentData });
    }
  };

  // Remove payment
  const removePayment = (participantId) => {
    const newPaymentData = { ...paymentData };
    delete newPaymentData[participantId];
    
    setPaymentData(newPaymentData);
    
    if (onPaymentUpdate) {
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

      {/* Payment Mode Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">
              {isGroupPayment ? 'Group Payment Mode' : 'Individual Payment Mode'}
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
              value={selectedGroupPayer}
              onChange={(e) => setSelectedGroupPayer(e.target.value)}
              options={[
                { value: '', label: 'Select group payer...' },
                ...participantsWithPayment.map(p => ({
                  value: p.id,
                  label: `${p.member.firstName} ${p.member.lastName}`
                }))
              ]}
              className="flex-1"
            />
            
            <Button
              onClick={() => {
                if (selectedGroupPayer) {
                  handleGroupPayment(selectedGroupPayer);
                }
              }}
              disabled={!selectedGroupPayer}
            >
              Process Group Payment
            </Button>
          </div>
        </div>
      )}

      {/* Participant Payment List */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Payment Status by Participant
          </h3>
          <p className="text-sm text-gray-600">
            {summary.paidCount} of {summary.totalParticipants} participants have paid in full
          </p>
        </div>
        
        <div className="divide-y">
          {participantsWithPayment.map((participant) => {
            const isCurrentUser = participant.id === currentUserId;
            const isGroupPayer = summary.groupPayer && 
              summary.groupPayer.firstName === participant.member.firstName &&
              summary.groupPayer.lastName === participant.member.lastName;
            const statusBadge = getStatusBadge(participant.status);
            
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
                        {isGroupPayer && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Group Payer
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {participant.member.email}
                      </p>
                      
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
                      // Individual payment mode
                      <>
                        {participant.status === 'unpaid' && (
                          <Button
                            size="sm"
                            onClick={() => handlePayment(participant.id, fee)}
                          >
                            Mark Paid (${fee})
                          </Button>
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
                      // Group payment mode
                      <>
                        {isGroupPayer ? (
                          <div className="text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <CreditCard className="h-4 w-4 mr-1" />
                              Paid ${participant.amountPaid}
                            </span>
                          </div>
                        ) : participant.amountPaid > 0 ? (
                          <span className="text-sm text-gray-500">
                            Covered by group payment
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Waiting for group payment
                          </span>
                        )}
                      </>
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

      {/* Group Payment Summary */}
      {isGroupPayment && summary.groupPayer && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-3 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Group Payment Summary
          </h4>
          
          <div className="space-y-2">
            <p className="text-sm text-green-800">
              <strong>{summary.groupPayer.firstName} {summary.groupPayer.lastName}</strong> paid ${summary.totalExpected} for the entire group of {summary.totalParticipants} participants.
            </p>
            
            <div className="text-sm text-green-700">
              <p>✓ {eventLabel} {feeLabel.toLowerCase()} are fully covered</p>
              <p>💰 Participants can arrange reimbursement directly with the group payer</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;