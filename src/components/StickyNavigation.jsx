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
        <div className="flex justify-between items-center px-4 py-2">
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
                  flex flex-col items-center py-2 px-2 rounded-lg transition-all duration-200 flex-1 mx-1
                  ${activeSection === item.id 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
                type="button"
              >
                {getIcon(item.id)}
                <span className="text-xs font-medium mt-1">{mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Sticky Top Navigation (unchanged) */}
      <div className="hidden sm:block sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-2xl mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="py-4">
            <div className="flex justify-center">
              <div className="flex space-x-2 bg-white/70 backdrop-blur-sm p-2 rounded-2xl overflow-x-auto max-w-full shadow-lg border border-white/20">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      flex items-center space-x-3 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap transform hover:scale-105
                      ${activeSection === item.id 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/80 hover:shadow-md'
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