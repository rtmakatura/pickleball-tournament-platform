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
import { getAutomaticTournamentStatus, getAutomaticLeagueStatus } from '../../utils/statusUtils';

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
  
  /* Mobile optimizations - Aggressive text reduction */
  @media (max-width: 768px) {
    .payment-tracker-header {
      padding: 12px;
    }
    
    .payment-tracker-content {
      padding: 12px;
    }
    
    .payment-mobile-card {
      margin-bottom: 12px;
    }
    
    .payment-mobile-summary {
      padding: 8px !important;
    }
    
    .payment-mobile-summary h4 {
      font-size: 0.75rem !important;
      margin-bottom: 2px !important;
    }
    
    .payment-mobile-summary .text-2xl,
    .payment-mobile-summary .text-xl {
      font-size: 1.125rem !important;
      line-height: 1.2 !important;
    }
    
    .payment-mobile-summary .text-xs {
      font-size: 0.625rem !important;
      margin-top: 2px !important;
    }
    
    .payment-mobile-button {
      min-height: 44px !important;
      min-width: 44px !important;
      font-size: 12px !important;
    }
    
    .payment-participant-card {
      padding: 8px !important;
    }
    
    .payment-participant-card .text-sm {
      font-size: 0.75rem !important;
    }
    
    .payment-participant-card h4 {
      font-size: 0.8rem !important;
    }
    
    .payment-participant-card .text-xs {
      font-size: 0.625rem !important;
    }
    
    .payment-section-title {
      font-size: 0.9rem !important;
      line-height: 1.2 !important;
    }
    
    .payment-section-subtitle {
      font-size: 0.65rem !important;
      margin-top: 1px !important;
    }
  }
  
  @media (max-width: 480px) {
    .payment-tracker-header {
      padding: 8px;
    }
    
    .payment-tracker-content {
      padding: 8px;
    }
    
    .payment-mobile-summary {
      padding: 6px !important;
    }
    
    .payment-mobile-summary h4 {
      font-size: 0.6875rem !important;
      margin-bottom: 1px !important;
    }
    
    .payment-mobile-summary .text-2xl,
    .payment-mobile-summary .text-xl {
      font-size: 1rem !important;
      line-height: 1.1 !important;
    }
    
    .payment-mobile-summary .text-xs {
      font-size: 0.5625rem !important;
      margin-top: 1px !important;
    }
    
    .payment-section-title {
      font-size: 0.8rem !important;
      line-height: 1.1 !important;
    }
    
    .payment-section-subtitle {
      font-size: 0.6rem !important;
      margin-top: 0px !important;
    }
    
    .payment-participant-card {
      padding: 6px !important;
    }
    
    .payment-participant-card h4 {
      font-size: 0.75rem !important;
    }
    
    .payment-participant-card .text-xs {
      font-size: 0.5625rem !important;
    }
    
    /* Mobile participant card fixes */
    .mobile-participant-card {
      margin: 0 !important;
      padding: 8px !important;
      border-radius: 8px !important;
    }
    
    .mobile-participant-info {
      min-width: 0 !important;
      flex: 1 !important;
    }
    
    .mobile-participant-name {
      font-size: 0.75rem !important;
      line-height: 1.1 !important;
      font-weight: 500 !important;
    }
    
    .mobile-participant-status {
      font-size: 0.625rem !important;
      line-height: 1.1 !important;
      margin-top: 2px !important;
    }
    
    .mobile-participant-actions {
      flex-shrink: 0 !important;
      margin-left: 8px !important;
    }
    
    .mobile-payment-input {
      width: 50px !important;
      height: 32px !important;
      font-size: 0.75rem !important;
      padding: 2px 4px !important;
    }
    
    .mobile-payment-button {
      width: 32px !important;
      height: 32px !important;
      padding: 0 !important;
      min-width: 32px !important;
    }
    
    .mobile-status-badge {
      padding: 2px 6px !important;
      font-size: 0.625rem !important;
      border-radius: 4px !important;
    }
  }
`;

const PaymentTracker = ({
  isOpen,
  onClose,
  tournaments = [],
  leagues = [],
  members = [],
  onUpdateTournament,
  onUpdateLeague,
  currentUserId,
  initialTargetEvent = null
}) => {
  // Add styles to document head
  React.useEffect(() => {
    const styleId = 'payment-tracker-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = paymentTrackerStyles;
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);
  const [expandedSections, setExpandedSections] = useState({
    tournaments: true,
    leagues: true
  });

  // ADDED: Auto-expand and scroll to target event
  const targetSectionRef = React.useRef(null);
  
  React.useEffect(() => {
    if (isOpen && initialTargetEvent) {
      // Auto-expand the relevant section
      if (initialTargetEvent.type === 'tournament') {
        setExpandedSections(prev => ({ ...prev, tournaments: true }));
      } else if (initialTargetEvent.type === 'league') {
        setExpandedSections(prev => ({ ...prev, leagues: true }));
      }
      
      // Scroll to target after modal is rendered
      setTimeout(() => {
        const targetElement = document.getElementById(`payment-${initialTargetEvent.type}-${initialTargetEvent.id}`);
        if (targetElement) {
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          // Add highlight effect
          targetElement.style.backgroundColor = '#fef3c7';
          targetElement.style.border = '2px solid #f59e0b';
          targetElement.style.borderRadius = '12px';
          setTimeout(() => {
            targetElement.style.backgroundColor = '';
            targetElement.style.border = '';
            targetElement.style.borderRadius = '';
          }, 3000);
        }
      }, 300);
    }
  }, [isOpen, initialTargetEvent]);

  // Get tournaments with paid divisions (excluding archived/deleted)
  const tournamentsWithPaidDivisions = useMemo(() => {
    return tournaments.filter(t => 
      t.status !== 'archived' && 
      t.status !== 'deleted' &&
      t.divisions && 
      t.divisions.some(div => div.entryFee > 0)
    );
  }, [tournaments]);

  // Get leagues with registration fees (excluding archived/deleted)
  const paidLeagues = useMemo(() => {
    return leagues.filter(l => 
      l.status !== 'archived' && 
      l.status !== 'deleted' &&
      l.registrationFee > 0
    );
  }, [leagues]);

  // Calculate overall payment summary with real-time updates
  const paymentSummary = useMemo(() => {
    return calculateOverallPaymentSummary(tournamentsWithPaidDivisions, paidLeagues);
  }, [tournamentsWithPaidDivisions, paidLeagues]);

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
      title="Payment Tracker"
      size="xl"
    >
      
      <div className="p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Debug section removed to save mobile space */}
          
          {/* Payment Summary Cards */}
          <div className="grid grid-cols-3 gap-1 sm:gap-4 mb-2 sm:mb-8">
            <div className="bg-blue-50 payment-mobile-summary p-1 sm:p-4 rounded-md sm:rounded-lg border border-blue-200 sm:border-2 text-center">
              <h4 className="font-medium text-blue-900 text-xs sm:text-base mb-1">
                <span className="hidden sm:inline">Expected</span>
                <span className="sm:hidden">Exp.</span>
              </h4>
              <p className="text-sm sm:text-2xl font-bold text-blue-600">${paymentSummary.totalExpected}</p>
              <p className="text-xs text-blue-700 leading-tight mt-0.5 sm:mt-1">
                <span className="hidden sm:inline">{paymentSummary.paidTournaments} tournaments • {paymentSummary.paidDivisions} divisions • {paymentSummary.paidLeagues} leagues</span>
                <span className="sm:hidden">{paymentSummary.paidTournaments + paymentSummary.paidDivisions + paymentSummary.paidLeagues} events</span>
              </p>
            </div>
            <div className="bg-green-50 payment-mobile-summary p-1 sm:p-4 rounded-md sm:rounded-lg border border-green-200 sm:border-2 text-center">
              <h4 className="font-medium text-green-900 text-xs sm:text-base mb-1">
                <span className="hidden sm:inline">Collected</span>
                <span className="sm:hidden">Paid</span>
              </h4>
              <p className="text-sm sm:text-2xl font-bold text-green-600">${paymentSummary.totalCollected}</p>
              <p className="text-xs text-green-700 leading-tight mt-0.5 sm:mt-1">
                <span className="hidden sm:inline">{paymentSummary.participantsPaid} of {paymentSummary.participantsWithPayments} paid</span>
                <span className="sm:hidden">{paymentSummary.participantsPaid}/{paymentSummary.participantsWithPayments}</span>
              </p>
            </div>
            <div className="bg-red-50 payment-mobile-summary p-1 sm:p-4 rounded-md sm:rounded-lg border border-red-200 sm:border-2 text-center">
              <h4 className="font-medium text-red-900 text-xs sm:text-base mb-1">
                <span className="hidden sm:inline">Outstanding</span>
                <span className="sm:hidden">Owed</span>
              </h4>
              <p className="text-sm sm:text-2xl font-bold text-red-600">${paymentSummary.totalOwed}</p>
              <p className="text-xs text-red-700 leading-tight mt-0.5 sm:mt-1">
                <span className="hidden sm:inline">{paymentSummary.paymentRate}% payment rate</span>
                <span className="sm:hidden">{paymentSummary.paymentRate}%</span>
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
                    <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                    <div>
                      <h3 className="payment-section-title text-base sm:text-xl font-semibold text-gray-900">
                        <span className="hidden sm:inline">Tournament Division Payments</span>
                        <span className="sm:hidden">Tournaments</span>
                      </h3>
                      <p className="payment-section-subtitle text-xs sm:text-sm text-gray-600">
                        <span className="hidden sm:inline">Track entry fee payments by division</span>
                        <span className="sm:hidden">Entry fees</span>
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform ${expandedSections.tournaments ? 'rotate-180' : ''}`} />
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
                    <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                    <div>
                      <h3 className="payment-section-title text-base sm:text-xl font-semibold text-gray-900">
                        <span className="hidden sm:inline">League Payments</span>
                        <span className="sm:hidden">Leagues</span>
                      </h3>
                      <p className="payment-section-subtitle text-xs sm:text-sm text-gray-600">
                        <span className="hidden sm:inline">Track registration fee payments for leagues</span>
                        <span className="sm:hidden">Registration fees</span>
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform ${expandedSections.leagues ? 'rotate-180' : ''}`} />
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
            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-gray-200 mx-2 sm:mx-0">
              <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2 px-4">No Payment Tracking Needed</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4 px-4">No tournaments, divisions, or leagues with fees found.</p>
              <p className="text-xs sm:text-sm text-gray-400 px-4">Create a tournament division or league with fees to start tracking payments.</p>
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
    <div 
      id={`payment-tournament-${tournament.id}`}
      className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-4"
    >
      <div className="mb-2 sm:mb-4">
        <h4 className="font-medium text-gray-900 text-sm sm:text-lg">{tournament.name}</h4>
        <p className="text-xs sm:text-sm text-gray-600">
          {paidDivisions.length} paid division{paidDivisions.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="space-y-2 sm:space-y-4">
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
    <div 
      id={`payment-league-${league.id}`}
      className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-4"
    >
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <h4 className="font-medium text-gray-900 text-sm sm:text-lg">{league.name}</h4>
        <span className="text-xs sm:text-sm text-gray-500 bg-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-medium">
          ${league.registrationFee}
          <span className="hidden sm:inline"> per person</span>
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
      
      // Create updated tournament for status check
      const updatedTournament = { ...tournament, divisions: updatedDivisions };
      const suggestedStatus = getAutomaticTournamentStatus(updatedTournament);
      
      // Update tournament with new divisions and potentially new status
      const updateData = { divisions: updatedDivisions };
      if (suggestedStatus !== tournament.status) {
        console.log(`Auto-updating tournament status from ${tournament.status} to ${suggestedStatus} after payment`);
        updateData.status = suggestedStatus;
      }
      
      await onUpdateTournament(tournament.id, updateData);
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
    <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-4">
      {errors.length > 0 && (
        <Alert
          type="error"
          title="Payment Error"
          message={errors.join(', ')}
          onClose={() => setErrors([])}
          className="mb-2 sm:mb-4"
        />
      )}
      
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <h5 className="font-medium text-gray-800 text-sm sm:text-lg">{division.name}</h5>
        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-medium">
          ${division.entryFee}
          <span className="hidden sm:inline"> per person</span>
        </span>
      </div>

      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-2 sm:p-4 mb-2 sm:mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-3">
          <div className="bg-white bg-opacity-10 rounded p-1.5 sm:p-3 text-center">
            <div className="text-sm sm:text-xl font-bold">{summary.totalParticipants}</div>
            <div className="text-xs text-blue-100">
              <span className="hidden sm:inline">Participants</span>
              <span className="sm:hidden">People</span>
            </div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-1.5 sm:p-3 text-center">
            <div className="text-sm sm:text-xl font-bold">${summary.totalExpected}</div>
            <div className="text-xs text-blue-100">Expected</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-1.5 sm:p-3 text-center">
            <div className="text-sm sm:text-xl font-bold">${summary.totalPaid}</div>
            <div className="text-xs text-blue-100">
              <span className="hidden sm:inline">Collected</span>
              <span className="sm:hidden">Paid</span>
            </div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-1.5 sm:p-3 text-center">
            <div className="text-sm sm:text-xl font-bold">{summary.paymentRate}%</div>
            <div className="text-xs text-blue-100">
              <span className="hidden sm:inline">Paid</span>
              <span className="sm:hidden">Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-1 sm:space-y-3">
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
        <div className="bg-green-600 text-white rounded-lg p-2 sm:p-4 text-center mt-2 sm:mt-4">
          <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
          <p className="font-medium text-sm sm:text-base">
            <span className="hidden sm:inline">All payments collected! 🎉</span>
            <span className="sm:hidden">Complete! 🎉</span>
          </p>
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
    <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-4">
      {errors.length > 0 && (
        <Alert
          type="error"
          title="Payment Error"
          message={errors.join(', ')}
          onClose={() => setErrors([])}
          className="mb-2 sm:mb-4"
        />
      )}

      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-2 sm:p-4 mb-2 sm:mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-3">
          <div className="bg-white bg-opacity-10 rounded p-1.5 sm:p-3 text-center">
            <div className="text-sm sm:text-xl font-bold">{summary.totalParticipants}</div>
            <div className="text-xs text-purple-100">Members</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-1.5 sm:p-3 text-center">
            <div className="text-sm sm:text-xl font-bold">${summary.totalExpected}</div>
            <div className="text-xs text-purple-100">Expected</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-1.5 sm:p-3 text-center">
            <div className="text-sm sm:text-xl font-bold">${summary.totalPaid}</div>
            <div className="text-xs text-purple-100">
              <span className="hidden sm:inline">Collected</span>
              <span className="sm:hidden">Paid</span>
            </div>
          </div>
          <div className="bg-white bg-opacity-10 rounded p-1.5 sm:p-3 text-center">
            <div className="text-sm sm:text-xl font-bold">{summary.paymentRate}%</div>
            <div className="text-xs text-purple-100">
              <span className="hidden sm:inline">Paid</span>
              <span className="sm:hidden">Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-1 sm:space-y-3">
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
        <div className="bg-green-600 text-white rounded-lg p-2 sm:p-4 text-center mt-2 sm:mt-4">
          <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
          <p className="font-medium text-sm sm:text-base">
            <span className="hidden sm:inline">All registrations paid! 🎉</span>
            <span className="sm:hidden">Complete! 🎉</span>
          </p>
        </div>
      )}
    </div>
  );
};

// Mobile-Responsive Participant Payment Card Component
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
    <div className={`border rounded-lg p-2 sm:p-3 ${statusConfig.bgColor} mx-0 mb-2`}>
      {/* Mobile: Stack vertically */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {participant.member.firstName.charAt(0)}{participant.member.lastName.charAt(0)}
              </span>
            </div>
            <h4 className="font-medium text-gray-900 text-xs truncate">
              {participant.member.firstName} {participant.member.lastName}
            </h4>
          </div>
          <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${statusConfig.textColor} bg-white`}>
            <StatusIcon className="h-2 w-2 mr-1" />
            {statusConfig.label}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs flex-1">
            {participant.status === 'paid' && (
              <span className={statusConfig.textColor}>✓ ${participant.amountPaid}</span>
            )}
            {participant.status === 'partial' && (
              <span className={statusConfig.textColor}>⚠ ${participant.amountPaid}, owes ${participant.amountOwed}</span>
            )}
            {participant.status === 'overpaid' && (
              <span className={statusConfig.textColor}>↗ ${participant.amountPaid}</span>
            )}
            {participant.status === 'unpaid' && (
              <span className={statusConfig.textColor}>✗ ${fee}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {participant.status === 'unpaid' && (
              <>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-12 px-1 py-1 text-xs border border-gray-300 rounded text-center"
                  step="0.01"
                  min="0"
                />
                <Button
                  onClick={() => onPayment(customAmount)}
                  loading={processing}
                  disabled={processing || !customAmount || parseFloat(customAmount) <= 0}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white w-8 h-8 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
              </>
            )}
            
            {participant.status !== 'unpaid' && (
              <Button
                onClick={onRemovePayment}
                loading={processing}
                disabled={processing}
                size="sm"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 w-8 h-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Original horizontal layout */}
      <div className="hidden sm:flex items-center justify-between">
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

        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.textColor} bg-white bg-opacity-50`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </span>

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