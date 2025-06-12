// src/utils/mentionUtils.js - Utilities for parsing and formatting @mentions

/**
 * Parse @mentions from text and return mentioned members
 * @param {string} text - The text to parse
 * @param {Array} members - Array of member objects
 * @returns {Array} Array of mentioned member objects
 */
export const parseMentions = (text, members) => {
  if (!text || !members || !Array.isArray(members)) return [];
  
  const mentions = [];
  const mentionRegex = /@([A-Za-z]+(?:\s+[A-Za-z]+)*)/g;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionText = match[1].trim();
    
    // Find member by first and last name
    const mentionedMember = members.find(member => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      return fullName === mentionText.toLowerCase();
    });
    
    if (mentionedMember && !mentions.find(m => m.id === mentionedMember.id)) {
      mentions.push(mentionedMember);
    }
  }
  
  return mentions;
};

/**
 * Format text with @mentions highlighted for display
 * @param {string} text - The text to format
 * @param {Array} members - Array of member objects
 * @returns {string} HTML string with mentions highlighted
 */
export const formatMentionText = (text, members) => {
  if (!text || !members || !Array.isArray(members)) return text;
  
  const mentionRegex = /@([A-Za-z]+(?:\s+[A-Za-z]+)*)/g;
  
  return text.replace(mentionRegex, (match, mentionText) => {
    const trimmedMention = mentionText.trim();
    
    // Check if this mention corresponds to a real member
    const mentionedMember = members.find(member => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      return fullName === trimmedMention.toLowerCase();
    });
    
    if (mentionedMember) {
      return `<span class="mention bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium">@${trimmedMention}</span>`;
    }
    
    // Return original text if no member found
    return match;
  });
};

/**
 * Extract @mention text from HTML formatted text
 * @param {string} htmlText - HTML formatted text
 * @returns {string} Plain text with @mentions
 */
export const extractMentionText = (htmlText) => {
  if (!htmlText) return '';
  
  // Remove HTML tags but preserve @mention content
  return htmlText
    .replace(/<span class="mention[^"]*">@([^<]+)<\/span>/g, '@$1')
    .replace(/<[^>]*>/g, '');
};

/**
 * Validate that a mention exists in the members list
 * @param {string} mentionName - The name being mentioned
 * @param {Array} members - Array of member objects
 * @returns {boolean} True if member exists
 */
export const validateMention = (mentionName, members) => {
  if (!mentionName || !members || !Array.isArray(members)) return false;
  
  return members.some(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return fullName === mentionName.toLowerCase();
  });
};

/**
 * Get suggested members for autocomplete
 * @param {string} searchTerm - Partial name being typed
 * @param {Array} members - Array of member objects
 * @param {number} limit - Maximum number of suggestions
 * @returns {Array} Array of suggested member objects
 */
export const getMentionSuggestions = (searchTerm, members, limit = 5) => {
  if (!searchTerm || !members || !Array.isArray(members)) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return members
    .filter(member => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const firstName = member.firstName.toLowerCase();
      const lastName = member.lastName.toLowerCase();
      
      return fullName.includes(lowerSearchTerm) ||
             firstName.startsWith(lowerSearchTerm) ||
             lastName.startsWith(lowerSearchTerm);
    })
    .slice(0, limit);
};

/**
 * Convert @mentions in text to member IDs for storage
 * @param {string} text - The text containing @mentions
 * @param {Array} members - Array of member objects
 * @returns {Object} Object with cleanText and mentionIds
 */
export const processMentionsForStorage = (text, members) => {
  if (!text || !members || !Array.isArray(members)) {
    return { cleanText: text || '', mentionIds: [] };
  }
  
  const mentions = parseMentions(text, members);
  const mentionIds = mentions.map(member => member.id);
  
  return {
    cleanText: text,
    mentionIds
  };
};

/**
 * Check if current user is mentioned in a comment
 * @param {string} commentText - The comment text
 * @param {Object} currentMember - Current user's member object
 * @param {Array} members - Array of all members
 * @returns {boolean} True if current user is mentioned
 */
export const isUserMentioned = (commentText, currentMember, members) => {
  if (!commentText || !currentMember || !members) return false;
  
  const mentions = parseMentions(commentText, members);
  return mentions.some(mention => mention.id === currentMember.id);
};

/**
 * Format mention display name for notifications
 * @param {Object} member - Member object
 * @returns {string} Formatted display name
 */
export const formatMentionDisplayName = (member) => {
  if (!member) return 'Unknown User';
  return `${member.firstName} ${member.lastName}`;
};

/**
 * Replace @mentions with clickable links (for advanced UI)
 * @param {string} text - The text to process
 * @param {Array} members - Array of member objects
 * @param {Function} onMemberClick - Callback when member link is clicked
 * @returns {string} HTML string with clickable mentions
 */
export const createClickableMentions = (text, members, onMemberClick = null) => {
  if (!text || !members || !Array.isArray(members)) return text;
  
  const mentionRegex = /@([A-Za-z]+(?:\s+[A-Za-z]+)*)/g;
  
  return text.replace(mentionRegex, (match, mentionText) => {
    const trimmedMention = mentionText.trim();
    
    const mentionedMember = members.find(member => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      return fullName === trimmedMention.toLowerCase();
    });
    
    if (mentionedMember) {
      const clickHandler = onMemberClick ? `onclick="(${onMemberClick.toString()})(${JSON.stringify(mentionedMember)})"` : '';
      return `<span class="mention bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium cursor-pointer hover:bg-blue-200" ${clickHandler}>@${trimmedMention}</span>`;
    }
    
    return match;
  });
};

export default {
  parseMentions,
  formatMentionText,
  extractMentionText,
  validateMention,
  getMentionSuggestions,
  processMentionsForStorage,
  isUserMentioned,
  formatMentionDisplayName,
  createClickableMentions
};