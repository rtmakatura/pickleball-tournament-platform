// src/components/payment/PaymentTracker.jsx - Dedicated Payment Tracking Modal
import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Trophy, 
  Activity, 
  ChevronDown,
  Users,
  Check,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  User
} from 'lucide-react';
import { Modal, Button, Alert } from '../ui';
import { PAYMENT_MODES } from '../../services/models';
import { 
  calculateOverallPaymentSummary,
  calculateDivisionPaymentSummary,
  calculateLeaguePaymentSummary,
  getParticipantPaymentStatus
} from '../../utils/paymentUtils';

const paymentTrackerStyles = `
  .payment-tracker-section {
    background: white;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .payment-tracker-header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .payment-tracker-header:hover {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  }
  
  .payment-tracker-content {
    padding: 24px;
  }
  
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
`;

const StyleSheet = () => (
  <style dangerouslySetInnerHTML={{ __html: paymentTrackerStyles }} />
);

const PaymentTracker = ({
  isOpen,
  onClose,
  tournaments,
  leagues,
  members,
  onUpdateTournament,
  onUpdateLeague,
  currentUserId
}) => {
  const [expandedSections, setExpandedSections] = useState({
    tournaments: true,
    leagues: true
  });

  // Calculate overall payment summary
  const paymentSummary = useMemo(() => {
    return calculateOverallPaymentSummary(tournaments, leagues);
  }, [tournaments, leagues]);

  // Get tournaments with paid divisions
  const tournamentsWithPaidDivisions = useMemo(() => {
    return tournaments.filter(t => 
      t.divisions && t.divisions.some(div => div.entryFee > 0)
    );
  }, [tournaments]);

  // Get leagues with registration fees
  const paidLeagues = useMemo(() => {
    return leagues.filter(l => l.registrationFee > 0);
  }, [leagues]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Tracking Overview"
      size="xl"
    >
      <StyleSheet />
      
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          
          {/* DEBUG: Test if component is rendering */}
          <div className="bg-red-100 border border-red-300 p-4 rounded mb-4">
            <h2 className="text-red-800 font-bold">PaymentTracker Component is Working!</h2>
            <p className="text-red-700">Tournaments: {tournaments?.length || 0}</p>
            <p className="text-red-700">Leagues: {leagues?.length || 0}</p>
            <p className="text-red-700">Members: {members?.length || 0}</p>
          </div>
          
          {/* Payment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h4 className="font-medium text-blue-900">Total Expected</h4>
              <p className="text-2xl font-bold text-blue-600">${paymentSummary.totalExpected}</p>
              <p className="text-xs text-blue-700 mt-1">
                {paymentSummary.paidTournaments} tournaments • {paymentSummary.paidDivisions} divisions • {paymentSummary.paidLeagues} leagues
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h4 className="font-medium text-green-900">Total Collected</h4>
              <p className="text-2xl font-bold text-green-600">${paymentSummary.totalCollected}</p>
              <p className="text-xs text-green-700 mt-1">
                {paymentSummary.participantsPaid} of {paymentSummary.participantsWithPayments} paid
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
              <h4 className="font-medium text-red-900">Outstanding</h4>
              <p className="text-2xl font-bold text-red-600">${paymentSummary.totalOwed}</p>
              <p className="text-xs text-red-700 mt-1">
                {paymentSummary.paymentRate}% payment rate
              </p>
            </div>
          </div>

          {/* Tournament Divisions Section */}
          {tournamentsWithPaidDivisions.length > 0 && (
            <div className="payment-tracker-section">
              <div 
                className="payment-tracker-header"
                onClick={() => toggleSection('tournaments')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Tournament Division Payments</h3>
                      <p className="text-sm text-gray-600 mt-1">Track entry fee payments by division</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.tournaments ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              <div className={`payment-expandable ${expandedSections.tournaments ? 'expanded' : 'collapsed'}`}>
                <div className="payment-tracker-content">
                  <div className="space-y-6">
                    {tournamentsWithPaidDivisions.map(tournament => {
                      const paidDivisions = tournament.divisions.filter(div => div.entryFee > 0);
                      
                      return (
                        <TournamentPaymentSection
                          key={tournament.id}
                          tournament={tournament}
                          paidDivisions={paidDivisions}
                          members={members}
                          onUpdateTournament={onUpdateTournament}
                          currentUserId={currentUserId}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* League Payments Section */}
          {paidLeagues.length > 0 && (
            <div className="payment-tracker-section">
              <div 
                className="payment-tracker-header"
                onClick={() => toggleSection('leagues')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">League Payments</h3>
                      <p className="text-sm text-gray-600 mt-1">Track registration fee payments for leagues</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSections.leagues ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              <div className={`payment-expandable ${expandedSections.leagues ? 'expanded' : 'collapsed'}`}>
                <div className="payment-tracker-content">
                  <div className="space-y-6">
                    {paidLeagues.map(league => (
                      <LeaguePaymentSection
                        key={league.id}
                        league={league}
                        members={members}
                        onUpdateLeague={onUpdateLeague}
                        currentUserId={currentUserId}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {paymentSummary.paidEvents === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
              <DollarSign className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Payment Tracking Needed</h3>
              <p className="text-gray-500 mb-4">No tournaments, divisions, or leagues with fees found.</p>
              <p className="text-sm text-gray-400">Create a tournament division or league with fees to start tracking payments.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Tournament Payment Section Component
const TournamentPaymentSection = ({ tournament, paidDivisions, members, onUpdateTournament, currentUserId }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 text-lg">{tournament.name}</h4>
        <p className="text-sm text-gray-600">
          {paidDivisions.length} paid division{paidDivisions.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="space-y-4">
        {paidDivisions.map(division => (
          <DivisionPaymentCard
            key={division.id}
            tournament={tournament}
            division={division}
            members={members}
            onUpdateTournament={onUpdateTournament}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
};

// League Payment Section Component
const LeaguePaymentSection = ({ league, members, onUpdateLeague, currentUserId }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-900 text-lg">{league.name}</h4>
        <span className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full font-medium">
          ${league.registrationFee} per person
        </span>
      </div>
      <LeaguePaymentCard
        league={league}
        members={members}
        onUpdateLeague={onUpdateLeague}
        currentUserId={currentUserId}
      />
    </div>
  );
};

// Division Payment Card Component
const DivisionPaymentCard = ({ tournament, division, members, onUpdateTournament, currentUserId }) => {
  const [processing, setProcessing] = useState(null);
  const [errors, setErrors] = useState([]);
  
  const summary = useMemo(() => {
    return calculateDivisionPaymentSummary(division);
  }, [division]);

  const participantsWithPayment = useMemo(() => {
    const fee = parseFloat(division.entryFee) || 0;
    const participants = division.participants || [];
    const paymentData = division.paymentData || {};

    return participants.map(participantId => {
      const member = members.find(m => m.id === participantId);
      const paymentStatus = getParticipantPaymentStatus(participantId, paymentData, fee);
      
      return {
        id: participantId,
        member: member || { firstName: 'Unknown', lastName: 'Member', email: '' },
        ...paymentStatus,
        isCurrentUser: participantId === currentUserId
      };
    }).sort((a, b) => {
      if (a.isCurrentUser && !b.isCurrentUser) return -1;
      if (!a.isCurrentUser && b.isCurrentUser) return 1;
      
      const statusOrder = { unpaid: 0, partial: 1, overpaid: 2, paid: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [division, members, currentUserId]);

  const handlePayment = async (participantId, amount) => {
    setProcessing(participantId);
    try {
      const paymentAmount = parseFloat(amount);
      const newPaymentRecord = {
        amount: paymentAmount,
        date: new Date().toISOString(),
        method: 'individual',
        notes: `Payment of $${paymentAmount}`,
        recordedBy: currentUserId
      };

      const updatedPaymentData = {
        ...division.paymentData,
        [participantId]: newPaymentRecord
      };
      
      const updatedDivisions = tournament.divisions.map(div => 
        div.id === division.id 
          ? { ...div, paymentData: updatedPaymentData }
          : div
      );
      
      await onUpdateTournament(tournament.id, { divisions: updatedDivisions });
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
      const updatedPaymentData = { ...division.paymentData };
      delete updatedPaymentData[participantId];
      
      const updatedDivisions = tournament.divisions.map(div => 
        div.id === division.id 
          ? { ...div, paymentData: updatedPaymentData }
          : div
      );
      
      await onUpdateTournament(tournament.id, { divisions: updatedDivisions });
      setErrors([]);
    } catch (error) {
      setErrors([`Failed to remove payment: ${error.message}`]);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {errors.length > 0 && (
        <Alert
          type="error"
          title="Payment Error"
          message={errors.join(', ')}
          onClose={() => setErrors([])}
          className="mb-4"
        />
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h5 className="font-medium text-gray-800 text-lg">{division.name}</h5>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
          ${division.entryFee} per person
        </span>
      </div>

      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 mb-4">
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

      {/* Participants */}
      <div className="space-y-3">
        {participantsWithPayment.map((participant) => (
          <ParticipantPaymentCard
            key={participant.id}
            participant={participant}
            fee={division.entryFee}
            onPayment={(amount) => handlePayment(participant.id, amount)}
            onRemovePayment={() => removePayment(participant.id)}
            processing={processing === participant.id}
          />
        ))}
      </div>

      {summary.isFullyPaid && (
        <div className="bg-green-600 text-white rounded-lg p-4 text-center mt-4">
          <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
          <p className="font-medium">All payments collected! 🎉</p>
        </div>
      )}
    </div>
  );
};

// League Payment Card Component
const LeaguePaymentCard = ({ league, members, onUpdateLeague, currentUserId }) => {
  const [processing, setProcessing] = useState(null);
  const [errors, setErrors] = useState([]);
  
  const summary = useMemo(() => {
    return calculateLeaguePaymentSummary(league);
  }, [league]);

  const participantsWithPayment = useMemo(() => {
    const fee = parseFloat(league.registrationFee) || 0;
    const participants = league.participants || [];
    const paymentData = league.paymentData || {};

    return participants.map(participantId => {
      const member = members.find(m => m.id === participantId);
      const paymentStatus = getParticipantPaymentStatus(participantId, paymentData, fee);
      
      return {
        id: participantId,
        member: member || { firstName: 'Unknown', lastName: 'Member', email: '' },
        ...paymentStatus,
        isCurrentUser: participantId === currentUserId
      };
    }).sort((a, b) => {
      if (a.isCurrentUser && !b.isCurrentUser) return -1;
      if (!a.isCurrentUser && b.isCurrentUser) return 1;
      
      const statusOrder = { unpaid: 0, partial: 1, overpaid: 2, paid: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [league, members, currentUserId]);

  const handlePayment = async (participantId, amount) => {
    setProcessing(participantId);
    try {
      const paymentAmount = parseFloat(amount);
      const newPaymentRecord = {
        amount: paymentAmount,
        date: new Date().toISOString(),
        method: 'individual',
        notes: `Payment of $${paymentAmount}`,
        recordedBy: currentUserId
      };

      const newPaymentData = {
        ...league.paymentData,
        [participantId]: newPaymentRecord
      };
      
      await onUpdateLeague(league.id, { paymentData: newPaymentData });
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
      const newPaymentData = { ...league.paymentData };
      delete newPaymentData[participantId];
      
      await onUpdateLeague(league.id, { paymentData: newPaymentData });
      setErrors([]);
    } catch (error) {
      setErrors([`Failed to remove payment: ${error.message}`]);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {errors.length > 0 && (
        <Alert
          type="error"
          title="Payment Error"
          message={errors.join(', ')}
          onClose={() => setErrors([])}
          className="mb-4"
        />
      )}

      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white bg-opacity-10 rounded p-3 text-center">
            <div className="text-xl font-bold">{summary.totalParticipants}</div>
            <div className="text-xs text-purple-100">Members</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-3 text-center">
            <div className="text-xl font-bold">${summary.totalExpected}</div>
            <div className="text-xs text-purple-100">Expected</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-3 text-center">
            <div className="text-xl font-bold">${summary.totalPaid}</div>
            <div className="text-xs text-purple-100">Collected</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-3 text-center">
            <div className="text-xl font-bold">{summary.paymentRate}%</div>
            <div className="text-xs text-purple-100">Paid</div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-3">
        {participantsWithPayment.map((participant) => (
          <ParticipantPaymentCard
            key={participant.id}
            participant={participant}
            fee={league.registrationFee}
            onPayment={(amount) => handlePayment(participant.id, amount)}
            onRemovePayment={() => removePayment(participant.id)}
            processing={processing === participant.id}
          />
        ))}
      </div>

      {summary.isFullyPaid && (
        <div className="bg-green-600 text-white rounded-lg p-4 text-center mt-4">
          <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
          <p className="font-medium">All registrations paid! 🎉</p>
        </div>
      )}
    </div>
  );
};

// Participant Payment Card Component
const ParticipantPaymentCard = ({ participant, fee, onPayment, onRemovePayment, processing }) => {
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
    <div className={`border-2 rounded-lg p-3 ${statusConfig.bgColor}`}>
      <div className="flex items-center justify-between">
        {/* Participant Info */}
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xs">
                {participant.member.firstName.charAt(0)}{participant.member.lastName.charAt(0)}
              </span>
            </div>
            {participant.isCurrentUser && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
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
        </div>
      </div>
    </div>
  );
};

export default PaymentTracker;