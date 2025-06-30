import React from 'react';
import { BarChart3, Zap, Trophy, Activity, Users, Award } from 'lucide-react';

// Sticky navigation component for dashboard sections
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

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="py-3">
          {/* Mobile: Compact grid to fit all items */}
          <div className="sm:hidden">
            <div className="grid grid-cols-5 gap-1">
              {navItems.map((item) => {
                // Short labels for mobile
                const mobileLabel = {
                  'Overview': 'Stats',
                  'Quick Actions': 'Actions', 
                  'Tournaments': 'Events',
                  'Leagues': 'Leagues',
                  'Members': 'People'
                }[item.label] || item.label;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      flex flex-col items-center py-2 px-1 rounded-lg transition-colors duration-200
                      ${activeSection === item.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                    type="button"
                  >
                    {getIcon(item.id)}
                    <span className="text-xs font-medium mt-1 leading-tight">{mobileLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop: Centered navigation */}
          <div className="hidden sm:flex justify-center">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                    ${activeSection === item.id 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
  );
};

export default StickyNavigation;