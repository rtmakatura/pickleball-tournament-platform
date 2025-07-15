// src/components/ui/Footer.jsx
import React, { useState } from 'react';
import { Mail, Heart, ExternalLink } from 'lucide-react';
import ReportIssueModal from './ReportIssueModal';

const Footer = () => {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col space-y-4 sm:hidden">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-600 text-sm">
                <span>Made for Denver Picklr Group</span>
              </div>
            </div>
            
            <div className="flex justify-center space-x-6">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>Report Issue</span>
              </button>
              
              <a
                href="mailto:support@pickleportal.com"
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Contact</span>
              </a>
            </div>
            
            <div className="text-center text-xs text-gray-500">
              © 2025 PicklePortal. All rights reserved.
            </div>
          </div>

          {/* Desktop Layout - Inline */}
          <div className="hidden sm:flex sm:justify-between sm:items-center">
            <div className="flex items-center space-x-2 text-gray-600 text-sm">
              <span>Made for Denver Picklr Group</span>
              <span className="text-gray-400">•</span>
              <span className="text-xs text-gray-500">© 2025 PicklePortal</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                <Mail className="h-4 w-4" />
                <span>Report Issue</span>
              </button>
              
              <a
                href="mailto:support@pickleportal.com"
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Contact Support</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </>
  );
};

export default Footer;