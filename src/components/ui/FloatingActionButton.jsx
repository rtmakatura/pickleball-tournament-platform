// src/components/ui/FloatingActionButton.jsx - Self-Contained with Inline Styles
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trophy, Users, Calendar, X } from 'lucide-react';

/**
 * Self-Contained Floating Action Button Component
 * Includes all styles inline - no external CSS needed
 */
const FloatingActionButton = ({ 
  onCreateTournament, 
  onCreateLeague, 
  onCreateMember,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const fabRef = useRef(null);

  // Inline styles
  const fabStyles = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    transition: 'all 0.3s ease',
    zIndex: 1000,
    opacity: disabled ? 0.5 : 1,
    transform: isAnimating ? 'scale(0.9)' : 'scale(1)',
  };

  const fabHoverStyles = {
    background: '#059669',
    transform: 'scale(1.05)',
    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.5)',
  };

  const backdropStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.1)',
    zIndex: 999,
    opacity: 0,
    animation: 'fadeIn 0.3s ease forwards',
  };

  const menuItemBaseStyles = {
    position: 'absolute',
    right: 0,
    width: '48px',
    height: '48px',
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    marginBottom: '8px',
  };

  const menuItemPositions = {
    tournament: { bottom: '80px' },
    league: { bottom: '140px' },
    member: { bottom: '200px' },
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle main FAB click
  const handleMainClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    // Add click animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Toggle menu
    setIsOpen(prev => !prev);
  };

  // Handle menu item clicks
  const handleMenuClick = (action, actionName) => {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`FAB: ${actionName} clicked`);
      
      // Close menu first
      setIsOpen(false);
      
      // Execute action after brief delay for better UX
      setTimeout(() => {
        if (action && typeof action === 'function') {
          action();
        } else {
          console.warn(`FAB: ${actionName} action not provided or not a function`);
        }
      }, 150);
    };
  };

  // Hover handlers for main button
  const [isHovered, setIsHovered] = useState(false);

  const currentFabStyles = {
    ...fabStyles,
    ...(isHovered && !disabled ? fabHoverStyles : {}),
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          style={backdropStyles}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB Container */}
      <div 
        ref={fabRef} 
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          zIndex: 1001 
        }}
        role="group"
        aria-label="Quick actions"
      >
        {/* Menu Items - Render when open */}
        {isOpen && (
          <>
            {/* Create Member */}
            <button
              style={{
                ...menuItemBaseStyles,
                ...menuItemPositions.member,
                animation: 'slideIn 0.3s ease 0.3s both',
              }}
              onClick={handleMenuClick(onCreateMember, 'Create Member')}
              title="Add New Member"
              aria-label="Add new member"
              onMouseEnter={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <Users style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </button>

            {/* Create League */}
            <button
              style={{
                ...menuItemBaseStyles,
                ...menuItemPositions.league,
                animation: 'slideIn 0.3s ease 0.2s both',
              }}
              onClick={handleMenuClick(onCreateLeague, 'Create League')}
              title="Create New League"
              aria-label="Create new league"
              onMouseEnter={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <Calendar style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </button>

            {/* Create Tournament */}
            <button
              style={{
                ...menuItemBaseStyles,
                ...menuItemPositions.tournament,
                animation: 'slideIn 0.3s ease 0.1s both',
              }}
              onClick={handleMenuClick(onCreateTournament, 'Create Tournament')}
              title="Create New Tournament"
              aria-label="Create new tournament"
              onMouseEnter={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <Trophy style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </button>
          </>
        )}

        {/* Main FAB Button */}
        <button
          style={currentFabStyles}
          onClick={handleMainClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={disabled}
          title={isOpen ? "Close menu" : "Quick actions"}
          aria-label={isOpen ? "Close quick actions menu" : "Open quick actions menu"}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {isOpen ? (
            <X style={{ width: '24px', height: '24px', transition: 'transform 0.2s' }} />
          ) : (
            <Plus style={{ width: '24px', height: '24px', transition: 'transform 0.2s' }} />
          )}
        </button>
      </div>

      {/* Inline CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px) scale(0.5);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @media (max-width: 768px) {
          .fab-mobile {
            bottom: 16px !important;
            right: 16px !important;
            width: 52px !important;
            height: 52px !important;
          }
          
          .fab-menu-mobile {
            width: 44px !important;
            height: 44px !important;
          }
        }
      `}</style>
    </>
  );
};

/**
 * Simple FAB for basic usage
 */
export const SimpleFAB = ({ onClick, icon: Icon = Plus, title = "Add", disabled = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    // Add click animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Execute action
    if (onClick && typeof onClick === 'function') {
      onClick(e);
    }
  };

  const fabStyles = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    transition: 'all 0.3s ease',
    zIndex: 1000,
    opacity: disabled ? 0.5 : 1,
    transform: isAnimating ? 'scale(0.9)' : isHovered ? 'scale(1.05)' : 'scale(1)',
    background: isHovered && !disabled ? '#059669' : '#10b981',
  };

  return (
    <button
      style={fabStyles}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      <Icon style={{ width: '24px', height: '24px' }} />
    </button>
  );
};

export default FloatingActionButton;