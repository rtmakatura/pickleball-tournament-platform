import React from 'react';
import { BarChart3, Zap, Trophy, Activity, Users } from 'lucide-react';

// Sticky navigation component for dashboard sections
const StickyNavigation = ({ activeSection, onNavigate, navItems }) => {
  // Icon mapping for visual appeal with optimized sizing
  const getIcon = (sectionId) => {
    const iconProps = { 
      className: "h-3.5 w-3.5" // Slightly smaller icons for more compact design
    };
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
        <nav className="flex items-center justify-center py-2">
          {/* Mobile: Compact responsive navigation */}
          <div className="sm:hidden flex gap-0.5 w-full px-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-md transition-all duration-200 min-h-[36px]
                  ${activeSection === item.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                  }
                `}
                type="button"
              >
                {getIcon(item.id)}
                <span className="text-[10px] font-medium mt-0.5 leading-none text-center">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Desktop: Compact horizontal navigation */}
          <div className="hidden sm:flex space-x-1 bg-gray-100 p-1 rounded-lg">
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
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default StickyNavigation;