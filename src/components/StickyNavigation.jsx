import React from 'react';
import { BarChart3, Zap, Trophy, Activity, Users } from 'lucide-react';

// Sticky navigation component for dashboard sections
const StickyNavigation = ({ activeSection, onNavigate, navItems }) => {
  // Icon mapping for visual appeal
  const getIcon = (sectionId) => {
    const iconProps = { className: "h-4 w-4" };
    switch (sectionId) {
      case 'stats': return <BarChart3 {...iconProps} />;
      case 'actions': return <Zap {...iconProps} />;
      case 'tournaments': return <Trophy {...iconProps} />;
      case 'leagues': return <Activity {...iconProps} />;
      case 'members': return <Users {...iconProps} />;
      default: return null;
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-center py-3">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${activeSection === item.id 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                type="button"
              >
                {getIcon(item.id)}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default StickyNavigation;