import { useRef, useState, useEffect, useCallback } from 'react';

// Simplified hook focused on fixing bottom section navigation
export const useSmoothNavigation = () => {
  const [activeSection, setActiveSection] = useState('stats');
  
  // Refs for each section
  const statsRef = useRef(null);
  const actionsRef = useRef(null);
  const tournamentsRef = useRef(null);
  const leaguesRef = useRef(null);
  const membersRef = useRef(null);
  
  // Navigation items configuration
  const navItems = [
    { id: 'stats', label: 'Overview', ref: statsRef },
    { id: 'actions', label: 'Quick Actions', ref: actionsRef },
    { id: 'tournaments', label: 'Tournaments', ref: tournamentsRef },
    { id: 'leagues', label: 'Leagues', ref: leaguesRef },
    { id: 'members', label: 'Members', ref: membersRef },
  ];
  
  // Enhanced smooth scroll with special handling for bottom sections
  const scrollToSection = useCallback((sectionId) => {
    const navItem = navItems.find(item => item.id === sectionId);
    if (navItem?.ref.current) {
      const element = navItem.ref.current;
      const elementTop = element.offsetTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const maxScroll = documentHeight - windowHeight;
      
      // Different offset strategies based on section
      let offset = 90; // Default offset for header
      
      // Special handling for sections near the bottom
      if (sectionId === 'leagues' || sectionId === 'members') {
        // For bottom sections, use a smaller offset or position them in the middle of viewport
        offset = windowHeight * 0.3; // Position section 30% from top of viewport
      }
      
      let targetScroll = Math.max(0, elementTop - offset);
      
      // Ensure we don't scroll past the maximum
      if (targetScroll > maxScroll) {
        targetScroll = maxScroll;
      }
      
      // Force immediate active state for better UX
      setActiveSection(sectionId);
      
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [navItems]);
  
  // Simplified scroll detection with better bottom section logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if we're in the bottom 20% of the page
      const isNearBottom = (scrollPosition + windowHeight) > (documentHeight * 0.8);
      
      if (isNearBottom) {
        // In the bottom area, determine between leagues and members
        const leaguesElement = leaguesRef.current;
        const membersElement = membersRef.current;
        
        if (leaguesElement && membersElement) {
          const leaguesTop = leaguesElement.offsetTop;
          const membersTop = membersElement.offsetTop;
          const currentScroll = scrollPosition + windowHeight * 0.5; // Middle of viewport
          
          // If we're closer to members section, activate it, otherwise leagues
          if (Math.abs(currentScroll - membersTop) < Math.abs(currentScroll - leaguesTop)) {
            setActiveSection('members');
          } else {
            setActiveSection('leagues');
          }
        }
        return;
      }
      
      // Normal detection for top sections
      const checkPosition = scrollPosition + 150;
      
      // Check sections from bottom to top
      for (let i = navItems.length - 1; i >= 0; i--) {
        const section = navItems[i].ref.current;
        if (section && section.offsetTop <= checkPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };
    
    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [navItems]);
  
  return {
    activeSection,
    scrollToSection,
    navItems,
    refs: {
      statsRef,
      actionsRef,
      tournamentsRef,
      leaguesRef,
      membersRef,
    }
  };
};