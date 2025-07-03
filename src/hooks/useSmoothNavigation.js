import { useRef, useState, useEffect, useCallback } from 'react';

// Enhanced hook with results section navigation
export const useSmoothNavigation = () => {
  const [activeSection, setActiveSection] = useState('stats');
  const [manualNavigation, setManualNavigation] = useState(false);
  
  // Refs for each section
  const statsRef = useRef(null);
  const actionsRef = useRef(null);
  const tournamentsRef = useRef(null);
  const leaguesRef = useRef(null);
  const membersRef = useRef(null);
  const resultsRef = useRef(null); // ADDED: Results section ref
  
  // Navigation items configuration
  const navItems = [
    { id: 'stats', label: 'Overview', ref: statsRef },
    { id: 'actions', label: 'Quick Actions', ref: actionsRef },
    { id: 'tournaments', label: 'Tournaments', ref: tournamentsRef },
    { id: 'leagues', label: 'Leagues', ref: leaguesRef },
    { id: 'members', label: 'Members', ref: membersRef },
    { id: 'results', label: 'Results', ref: resultsRef }, // ADDED: Results nav item
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
      
      // Consistent offset for all sections
      let offset = 120; // Slightly larger offset to account for sticky nav
      
      let targetScroll = Math.max(0, elementTop - offset);
      
      // Ensure we don't scroll past the maximum
      if (targetScroll > maxScroll) {
        targetScroll = maxScroll;
      }
      
      // Set manual navigation flag to prevent immediate override
      setManualNavigation(true);
      setActiveSection(sectionId);
      
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
      
      // Clear manual navigation flag after scroll completes
      setTimeout(() => {
        setManualNavigation(false);
      }, 1000);
    }
  }, [navItems]);
  
  // Enhanced scroll detection with results section logic
  useEffect(() => {
    const handleScroll = () => {
      // Don't update active section during manual navigation
      if (manualNavigation) return;
      
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Mobile-friendly detection point - closer to top of viewport
      const isMobile = window.innerWidth < 768;
      const detectionPoint = scrollPosition + (isMobile ? 200 : 250);
      
      let currentSection = 'stats'; // Default fallback
      
      // Check sections from bottom to top to find which one the detection point is in
      for (let i = navItems.length - 1; i >= 0; i--) {
        const element = navItems[i].ref.current;
        if (element) {
          const elementTop = element.offsetTop;
          const elementHeight = element.offsetHeight;
          const elementBottom = elementTop + elementHeight;
          
          // Check if detection point is within this section's bounds
          if (detectionPoint >= elementTop && detectionPoint <= elementBottom) {
            currentSection = navItems[i].id;
            break;
          }
          // If detection point is past the top of this section, use this section
          else if (detectionPoint >= elementTop) {
            currentSection = navItems[i].id;
            break;
          }
        }
      }
      
      setActiveSection(currentSection);
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
  }, [navItems, manualNavigation]);
  
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
      resultsRef, // ADDED: Results ref
    }
  };
};