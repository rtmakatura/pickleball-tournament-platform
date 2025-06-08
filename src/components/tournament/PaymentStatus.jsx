// src/components/tournament/PaymentStatus.jsx
import React, { useState } from 'react';
import { 
  DollarSign, 
  Check, 
  Clock, 
  AlertCircle, 
  User,
  CreditCard,
  Users
} from 'lucide-react';
import { Button, Alert } from '../ui';

/**
 * PaymentStatus Component - Track tournament entry fee payments
 * 
 * Props:
 * - tournament: object - Tournament data with participants and entry fee
 * - members: array - All members data for participant lookup
 * - onPaymentUpdate: function - Called when payment status changes
 * - currentUserId: string - ID of current user (for highlighting)
 */
const PaymentStatus = ({ 
  tournament, 
  members = [], 
  onPaymentUpdate,
  currentUserId 
}) => {
  const [paymentData, setPaymentData] = useState(
    tournament.paymentData || {}
  );
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Get participant details with payment status
  const getParticipantsWithPaymentInfo = () => {
    if (!tournament.participants || tournament.participants.length === 0) {
      return [];
    }

    return tournament.participants.map(participantId => {
      const member = members.find(m => m.id === participantId);
      const payment = paymentData[participantId] || {};
      
      return {
        id: participantId,
        member: member || { firstName: 'Unknown', lastName: 'Member', email: '' },
        paymentStatus: payment.status || 'unpaid', // 'paid', 'unpaid', 'pending'
        paidAmount: payment.amount || 0,
        paymentDate: payment.date || null,
        paymentMethod: payment.method || null,
        notes: payment.notes || '',
        paidBy: payment.paidBy || participantId // Who actually paid (for reimbursements)
      };
    });
  };

  const participantsWithPayment = getParticipantsWithPaymentInfo();

  // Calculate payment summary
  const paymentSummary = {
    totalParticipants: participantsWithPayment.length,
    totalPaid: participantsWithPayment.filter(p => p.paymentStatus === 'paid').length,
    totalOwed: tournament.entryFee * participantsWithPayment.length,
    totalCollected: participantsWithPayment.reduce((sum, p) => 
      p.paymentStatus === 'paid' ? sum + (p.paidAmount || tournament.entryFee) : sum, 0
    ),
    remainingBalance: 0
  };
  paymentSummary.remainingBalance = paymentSummary.totalOwed - paymentSummary.totalCollected;

  // Update payment status
  const updatePaymentStatus = (participantId, updates) => {
    const newPaymentData = {
      ...paymentData,
      [participantId]: {
        ...paymentData[participantId],
        ...updates,
        date: updates.status === 'paid' ? new Date().toISOString() : null
      }
    };
    
    setPaymentData(newPaymentData);
    
    // Save to tournament
    if (onPaymentUpdate) {
      onPaymentUpdate({
        ...tournament,
        paymentData: newPaymentData
      });
    }
  };

  // Mark as paid
  const markAsPaid = (participantId, paidBy = participantId, amount = tournament.entryFee) => {
    updatePaymentStatus(participantId, {
      status: 'paid',
      amount: amount,
      paidBy: paidBy,
      method: 'manual' // Could be extended to include Venmo, Cash, etc.
    });
  };

  // Mark as unpaid
  const markAsUnpaid = (participantId) => {
    updatePaymentStatus(participantId, {
      status: 'unpaid',
      amount: 0,
      paidBy: participantId,
      method: null
    });
  };

  // Get payment status color and icon
  const getPaymentStatusDisplay = (status) => {
    switch (status) {
      case 'paid':
        return {
          color: 'text-green-600 bg-green-100',
          icon: Check,
          label: 'Paid'
        };
      case 'pending':
        return {
          color: 'text-yellow-600 bg-yellow-100',
          icon: Clock,
          label: 'Pending'
        };
      default:
        return {
          color: 'text-red-600 bg-red-100',
          icon: AlertCircle,
          label: 'Unpaid'
        };
    }
  };

  // Group payments by who paid (for reimbursement tracking)
  const getReimbursementInfo = () => {
    const paidByOthers = participantsWithPayment.filter(p => 
      p.paymentStatus === 'paid' && p.paidBy !== p.id
    );
    
    if (paidByOthers.length === 0) return null;

    // Group by who paid
    const reimbursements = {};
    paidByOthers.forEach(p => {
      const payer = members.find(m => m.id === p.paidBy);
      const payerName = payer ? `${payer.firstName} ${payer.lastName}` : 'Unknown';
      
      if (!reimbursements[payerName]) {
        reimbursements[payerName] = [];
      }
      reimbursements[payerName].push({
        participant: p.member,
        amount: p.paidAmount
      });
    });

    return reimbursements;
  };

  const reimbursementInfo = getReimbursementInfo();

  if (!tournament.entryFee || tournament.entryFee === 0) {
    return (
      <Alert 
        type="info" 
        title="Free Tournament" 
        message="This tournament has no entry fee." 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Participants</p>
              <p className="text-lg font-semibold text-blue-900">
                {paymentSummary.totalParticipants}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm text-green-600">Paid</p>
              <p className="text-lg font-semibold text-green-900">
                {paymentSummary.totalPaid} / {paymentSummary.totalParticipants}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-gray-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-lg font-semibold text-gray-900">
                ${paymentSummary.totalCollected}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${
          paymentSummary.remainingBalance > 0 ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <div className="flex items-center">
            <AlertCircle className={`h-5 w-5 mr-2 ${
              paymentSummary.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'
            }`} />
            <div>
              <p className={`text-sm ${
                paymentSummary.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {paymentSummary.remainingBalance > 0 ? 'Remaining' : 'Complete'}
              </p>
              <p className={`text-lg font-semibold ${
                paymentSummary.remainingBalance > 0 ? 'text-red-900' : 'text-green-900'
              }`}>
                ${Math.abs(paymentSummary.remainingBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Payment List */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Payment Status - ${tournament.entryFee} per person
          </h3>
        </div>
        
        <div className="divide-y">
          {participantsWithPayment.map((participant) => {
            const statusDisplay = getPaymentStatusDisplay(participant.paymentStatus);
            const StatusIcon = statusDisplay.icon;
            const isCurrentUser = participant.id === currentUserId;
            const paidByOther = participant.paidBy !== participant.id;
            const payer = paidByOther ? members.find(m => m.id === participant.paidBy) : null;
            
            return (
              <div 
                key={participant.id} 
                className={`p-4 ${isCurrentUser ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    
                    {/* Member info */}
                    <div>
                      <p className="font-medium text-gray-900">
                        {participant.member.firstName} {participant.member.lastName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {participant.member.email}
                      </p>
                      {paidByOther && payer && (
                        <p className="text-xs text-orange-600">
                          Paid by {payer.firstName} {payer.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Payment status */}
                    <div className={`flex items-center px-2 py-1 rounded-full ${statusDisplay.color}`}>
                      <StatusIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{statusDisplay.label}</span>
                    </div>

                    {/* Payment amount */}
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${participant.paidAmount || tournament.entryFee}
                      </p>
                      {participant.paymentDate && (
                        <p className="text-xs text-gray-500">
                          {new Date(participant.paymentDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex space-x-2">
                      {participant.paymentStatus !== 'paid' ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => markAsPaid(participant.id)}
                          >
                            Mark Paid
                          </Button>
                          {/* Quick option for someone else paying */}
                          {currentUserId && currentUserId !== participant.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsPaid(participant.id, currentUserId)}
                            >
                              I Paid
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsUnpaid(participant.id)}
                        >
                          Mark Unpaid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reimbursement Tracking */}
      {reimbursementInfo && (
        <div className="border rounded-lg p-4 bg-orange-50">
          <h4 className="font-medium text-orange-900 mb-3 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Reimbursement Needed
          </h4>
          
          {Object.entries(reimbursementInfo).map(([payerName, payments]) => {
            const totalOwed = payments.reduce((sum, p) => sum + p.amount, 0);
            
            return (
              <div key={payerName} className="mb-3 last:mb-0">
                <p className="font-medium text-orange-800">
                  {payerName} is owed ${totalOwed}
                </p>
                <ul className="ml-4 text-sm text-orange-700">
                  {payments.map((payment, index) => (
                    <li key={index}>
                      • {payment.participant.firstName} {payment.participant.lastName}: ${payment.amount}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;