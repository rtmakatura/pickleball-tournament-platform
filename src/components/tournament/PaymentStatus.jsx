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
  UserCheck
} from 'lucide-react';
import { Button, Alert, Select } from '../ui';
import { PAYMENT_MODES } from '../../services/models';

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
  const [selectedGroupPayer, setSelectedGroupPayer] = useState('');

  const paymentMode = tournament.paymentMode || PAYMENT_MODES.INDIVIDUAL;
  const isGroupPayment = paymentMode === PAYMENT_MODES.GROUP;

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
        paymentStatus: payment.status || 'unpaid',
        paidAmount: payment.amount || 0,
        paymentDate: payment.date || null,
        paymentMethod: payment.method || null,
        notes: payment.notes || '',
        paidBy: payment.paidBy || participantId,
        reimburseAmount: payment.reimburseAmount || 0
      };
    });
  };

  const participantsWithPayment = getParticipantsWithPaymentInfo();

  // Calculate payment summary based on mode
  const getPaymentSummary = () => {
    if (isGroupPayment) {
      return getGroupPaymentSummary();
    } else {
      return getIndividualPaymentSummary();
    }
  };

  const getIndividualPaymentSummary = () => {
    const totalParticipants = participantsWithPayment.length;
    const totalPaid = participantsWithPayment.filter(p => p.paymentStatus === 'paid').length;
    const totalOwed = tournament.entryFee * totalParticipants;
    const totalCollected = participantsWithPayment.reduce((sum, p) => 
      p.paymentStatus === 'paid' ? sum + (p.paidAmount || tournament.entryFee) : sum, 0
    );

    return {
      totalParticipants,
      totalPaid,
      totalOwed,
      totalCollected,
      remainingBalance: totalOwed - totalCollected,
      paymentRate: totalParticipants > 0 ? (totalPaid / totalParticipants * 100).toFixed(1) : 0
    };
  };

  const getGroupPaymentSummary = () => {
    const totalParticipants = participantsWithPayment.length;
    const totalOwed = tournament.entryFee * totalParticipants;
    
    // Find who paid for the group
    const groupPayer = participantsWithPayment.find(p => 
      p.paymentStatus === 'paid' && p.paidAmount >= totalOwed
    );
    
    // Count reimbursements
    const reimbursed = participantsWithPayment.filter(p => 
      p.id !== groupPayer?.id && p.paymentStatus === 'paid'
    ).length;

    const totalReimbursed = participantsWithPayment.reduce((sum, p) => 
      p.id !== groupPayer?.id && p.paymentStatus === 'paid' ? sum + tournament.entryFee : sum, 0
    );

    return {
      totalParticipants,
      totalOwed,
      groupPayer: groupPayer?.member,
      groupPayerPaid: groupPayer ? totalOwed : 0,
      reimbursed,
      totalReimbursed,
      remainingReimbursements: groupPayer ? totalOwed - totalReimbursed : 0,
      fullyPaid: !!groupPayer,
      fullyReimbursed: groupPayer && reimbursed === totalParticipants - 1
    };
  };

  const paymentSummary = getPaymentSummary();

  // Handle group payment - one person pays for everyone
  const handleGroupPayment = async (payerId) => {
    const totalAmount = tournament.entryFee * participantsWithPayment.length;
    
    const newPaymentData = { ...paymentData };
    
    // Mark the payer as paid for the full amount
    newPaymentData[payerId] = {
      status: 'paid',
      amount: totalAmount,
      paidBy: payerId,
      method: 'group_payment',
      date: new Date().toISOString(),
      notes: 'Paid for entire group'
    };

    // Mark other participants as owing reimbursement
    participantsWithPayment.forEach(participant => {
      if (participant.id !== payerId) {
        newPaymentData[participant.id] = {
          status: 'owes_reimbursement',
          amount: 0,
          paidBy: payerId,
          reimburseAmount: tournament.entryFee,
          method: 'reimbursement_owed',
          date: null,
          notes: `Owes $${tournament.entryFee} to group payer`
        };
      }
    });

    setPaymentData(newPaymentData);
    
    if (onPaymentUpdate) {
      onPaymentUpdate(tournament.id, { paymentData: newPaymentData });
    }
  };

  // Handle individual reimbursement
  const handleReimbursement = (participantId) => {
    const newPaymentData = {
      ...paymentData,
      [participantId]: {
        ...paymentData[participantId],
        status: 'paid',
        amount: tournament.entryFee,
        date: new Date().toISOString(),
        method: 'reimbursement',
        notes: 'Reimbursed group payer'
      }
    };
    
    setPaymentData(newPaymentData);
    
    if (onPaymentUpdate) {
      onPaymentUpdate(tournament.id, { paymentData: newPaymentData });
    }
  };

  // Regular individual payment
  const markAsPaid = (participantId, amount = tournament.entryFee) => {
    const newPaymentData = {
      ...paymentData,
      [participantId]: {
        status: 'paid',
        amount: amount,
        paidBy: participantId,
        method: 'individual',
        date: new Date().toISOString()
      }
    };
    
    setPaymentData(newPaymentData);
    
    if (onPaymentUpdate) {
      onPaymentUpdate(tournament.id, { paymentData: newPaymentData });
    }
  };

  // Mark as unpaid
  const markAsUnpaid = (participantId) => {
    const newPaymentData = { ...paymentData };
    delete newPaymentData[participantId];
    setPaymentData(newPaymentData);
    
    if (onPaymentUpdate) {
      onPaymentUpdate(tournament.id, { paymentData: newPaymentData });
    }
  };

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
      {/* Payment Mode Indicator */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">
              Payment Mode: {isGroupPayment ? 'Group Payment' : 'Individual Payments'}
            </h4>
            <p className="text-sm text-blue-700">
              {isGroupPayment 
                ? 'One person pays for the group, others reimburse that person'
                : 'Each participant pays their own entry fee'
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-900">${tournament.entryFee}</p>
            <p className="text-sm text-blue-700">per person</p>
          </div>
        </div>
      </div>

      {/* Payment Summary Cards */}
      {isGroupPayment ? (
        // Group Payment Summary
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Total Participants</p>
                <p className="text-lg font-semibold text-blue-900">
                  {paymentSummary.totalParticipants}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${paymentSummary.fullyPaid ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <CreditCard className={`h-5 w-5 mr-2 ${paymentSummary.fullyPaid ? 'text-green-600' : 'text-gray-600'}`} />
              <div>
                <p className={`text-sm ${paymentSummary.fullyPaid ? 'text-green-600' : 'text-gray-600'}`}>
                  Group Payment
                </p>
                <p className={`text-lg font-semibold ${paymentSummary.fullyPaid ? 'text-green-900' : 'text-gray-900'}`}>
                  ${paymentSummary.groupPayerPaid}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-yellow-600">Reimbursed</p>
                <p className="text-lg font-semibold text-yellow-900">
                  {paymentSummary.reimbursed} / {paymentSummary.totalParticipants - (paymentSummary.groupPayer ? 1 : 0)}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${paymentSummary.remainingReimbursements === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center">
              <DollarSign className={`h-5 w-5 mr-2 ${paymentSummary.remainingReimbursements === 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className={`text-sm ${paymentSummary.remainingReimbursements === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Remaining
                </p>
                <p className={`text-lg font-semibold ${paymentSummary.remainingReimbursements === 0 ? 'text-green-900' : 'text-red-900'}`}>
                  ${paymentSummary.remainingReimbursements}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Individual Payment Summary
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
      )}

      {/* Group Payment Actions */}
      {isGroupPayment && !paymentSummary.fullyPaid && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-3">Set Group Payer</h4>
          <p className="text-sm text-yellow-800 mb-4">
            Select who will pay the ${paymentSummary.totalOwed} entry fee for the entire group:
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
                  setSelectedGroupPayer('');
                }
              }}
              disabled={!selectedGroupPayer}
            >
              Set as Group Payer
            </Button>
          </div>
        </div>
      )}

      {/* Participant List */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Payment Status
          </h3>
        </div>
        
        <div className="divide-y">
          {participantsWithPayment.map((participant) => {
            const isGroupPayer = isGroupPayment && paymentSummary.groupPayer && 
              paymentSummary.groupPayer.firstName === participant.member.firstName &&
              paymentSummary.groupPayer.lastName === participant.member.lastName;
            const owesReimbursement = participant.paymentStatus === 'owes_reimbursement';
            const isCurrentUser = participant.id === currentUserId;
            
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
                      {owesReimbursement && (
                        <p className="text-xs text-orange-600">
                          Owes ${tournament.entryFee} reimbursement
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Status and Actions */}
                    {isGroupPayment ? (
                      // Group payment actions
                      <div className="flex items-center space-x-3">
                        {isGroupPayer ? (
                          <div className="text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <Check className="h-4 w-4 mr-1" />
                              Paid ${paymentSummary.totalOwed}
                            </span>
                          </div>
                        ) : owesReimbursement ? (
                          participant.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <Check className="h-4 w-4 mr-1" />
                              Reimbursed
                            </span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                                <Clock className="h-4 w-4 mr-1" />
                                Owes ${tournament.entryFee}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleReimbursement(participant.id)}
                              >
                                Mark Reimbursed
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            <Clock className="h-4 w-4 mr-1" />
                            Waiting
                          </span>
                        )}
                      </div>
                    ) : (
                      // Individual payment actions
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            participant.paymentStatus === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {participant.paymentStatus === 'paid' ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Paid ${participant.paidAmount}
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Unpaid
                              </>
                            )}
                          </span>
                        </div>
                        
                        {participant.paymentStatus !== 'paid' ? (
                          <Button
                            size="sm"
                            onClick={() => markAsPaid(participant.id)}
                          >
                            Mark Paid
                          </Button>
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Group Payment Summary */}
      {isGroupPayment && paymentSummary.groupPayer && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-3 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Group Payment Summary
          </h4>
          
          <div className="space-y-2">
            <p className="text-sm text-green-800">
              <strong>{paymentSummary.groupPayer.firstName} {paymentSummary.groupPayer.lastName}</strong> paid ${paymentSummary.totalOwed} for the entire group
            </p>
            
            <div className="text-sm text-green-700">
              <p>✓ {paymentSummary.reimbursed} of {paymentSummary.totalParticipants - 1} participants have reimbursed</p>
              <p>💰 ${paymentSummary.totalReimbursed} collected in reimbursements</p>
              {paymentSummary.remainingReimbursements > 0 && (
                <p className="text-orange-600">⏳ ${paymentSummary.remainingReimbursements} still owed in reimbursements</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;