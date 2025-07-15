// src/services/emailService.js
import emailjs from '@emailjs/browser';

// EmailJS Configuration
// TODO: Replace these with your actual EmailJS credentials
const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id',
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id',
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key'
};

// Initialize EmailJS
let isInitialized = false;

const initializeEmailJS = () => {
  if (!isInitialized) {
    try {
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      isInitialized = true;
      console.log('EmailJS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
      throw new Error('Email service is not properly configured');
    }
  }
};

// Validate EmailJS configuration
const validateConfig = () => {
  const { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } = EMAILJS_CONFIG;
  
  if (!SERVICE_ID || SERVICE_ID === 'your_service_id') {
    throw new Error('EmailJS Service ID is not configured');
  }
  if (!TEMPLATE_ID || TEMPLATE_ID === 'your_template_id') {
    throw new Error('EmailJS Template ID is not configured');
  }
  if (!PUBLIC_KEY || PUBLIC_KEY === 'your_public_key') {
    throw new Error('EmailJS Public Key is not configured');
  }
};

// Send issue report email
export const sendIssueReport = async (reportData) => {
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize EmailJS
    initializeEmailJS();

    // Prepare email template parameters
    const templateParams = {
      // User Information
      user_name: reportData.userName || 'Anonymous User',
      user_email: reportData.contactEmail,
      user_id: reportData.userId || 'anonymous',
      
      // Issue Details
      issue_type: reportData.issueType,
      issue_title: reportData.title,
      issue_description: reportData.description,
      allow_follow_up: reportData.allowFollowUp ? 'Yes' : 'No',
      
      // Technical Context
      current_url: reportData.currentUrl,
      browser_info: formatBrowserInfo(reportData.browserInfo),
      timestamp: new Date(reportData.timestamp).toLocaleString(),
      
      // Email metadata
      reply_to: reportData.contactEmail,
      report_id: generateReportId()
    };

    // Send email via EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      console.log('Issue report sent successfully:', response);
      return {
        success: true,
        reportId: templateParams.report_id,
        message: 'Report sent successfully'
      };
    } else {
      throw new Error(`Email service returned status: ${response.status}`);
    }

  } catch (error) {
    console.error('Failed to send issue report:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('not configured')) {
      throw new Error('Email service is not properly set up. Please contact support directly.');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error('Failed to send report. Please try again or contact support directly.');
    }
  }
};

// Helper function to format browser info for email
const formatBrowserInfo = (browserInfo) => {
  if (!browserInfo) return 'Not available';
  
  return [
    `Browser: ${browserInfo.browser} ${browserInfo.version}`,
    `OS: ${browserInfo.os}`,
    `Screen: ${browserInfo.screenResolution}`,
    `Viewport: ${browserInfo.viewportSize}`,
    `User Agent: ${browserInfo.userAgent}`
  ].join('\n');
};

// Generate unique report ID
const generateReportId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `RPT-${timestamp}-${random}`.toUpperCase();
};

// Test email configuration (useful for debugging)
export const testEmailConfiguration = async () => {
  try {
    validateConfig();
    initializeEmailJS();
    
    // Send a test email with minimal data
    const testParams = {
      user_name: 'Test User',
      user_email: 'test@example.com',
      issue_type: 'test',
      issue_title: 'Email Configuration Test',
      issue_description: 'This is a test email to verify EmailJS configuration.',
      current_url: window.location.href,
      browser_info: 'Test browser info',
      timestamp: new Date().toLocaleString(),
      report_id: 'TEST-' + Date.now()
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      testParams
    );

    return response.status === 200;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
};

// Export configuration status for debugging
export const getEmailServiceStatus = () => {
  try {
    validateConfig();
    return {
      configured: true,
      serviceId: EMAILJS_CONFIG.SERVICE_ID,
      templateId: EMAILJS_CONFIG.TEMPLATE_ID,
      publicKey: EMAILJS_CONFIG.PUBLIC_KEY ? '***' + EMAILJS_CONFIG.PUBLIC_KEY.slice(-4) : 'Not set'
    };
  } catch (error) {
    return {
      configured: false,
      error: error.message
    };
  }
};