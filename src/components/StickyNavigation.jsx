import React from 'react';
import { BarChart3, Zap, Trophy, Activity, Users, Award } from 'lucide-react';

// Enhanced Navigation: Better mobile sticky header, desktop unchanged
const StickyNavigation = ({ activeSection, onNavigate, navItems }) => {
  // Icon mapping for visual appeal
  const getIcon = (sectionId) => {
    const iconProps = { 
      className: "h-4 w-4" 
    };
    switch (sectionId) {
      case 'stats': return <BarChart3 {...iconProps} />;
      case 'actions': return <Zap {...iconProps} />;
      case 'tournaments': return <Trophy {...iconProps} />;
      case 'leagues': return <Activity {...iconProps} />;
      case 'members': return <Users {...iconProps} />;
      case 'results': return <Award {...iconProps} />;
      default: return null;
    }
  };

  // Filter out actions for navigation since we have FAB
  const filteredNavItems = navItems.filter(item => item.id !== 'actions');

  return (
    <>
      {/* Mobile: Fixed Sticky Navigation */}
      <div className="block sm:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-md mb-6">
        <div className="flex justify-between items-center px-3 py-1">
          {filteredNavItems.map((item) => {
            const mobileLabel = {
              'Overview': 'Stats',
              'Tournaments': 'Events',
              'Leagues': 'Leagues', 
              'Members': 'People',
              'Results': 'Results'
            }[item.label] || item.label;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex flex-col items-center py-1 px-1 rounded-md transition-colors duration-150 flex-1 mx-0.5
                  ${activeSection === item.id 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
                type="button"
              >
                {getIcon(item.id)}
                <span className="text-xs font-medium mt-0.5">{mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Sticky Top Navigation (unchanged) */}
      <div className="hidden sm:block sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-2xl mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="py-2">
            <div className="flex justify-center">
              <div className="flex space-x-1 bg-white/70 backdrop-blur-sm p-1 rounded-xl overflow-x-auto max-w-full shadow-lg border border-white/20">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap
                      ${activeSection === item.id 
                        ? 'bg-blue-500 text-white' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/80'
                      }
                    `}
                    type="button"
                  >
                    {getIcon(item.id)}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default StickyNavigation;