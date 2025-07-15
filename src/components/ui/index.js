// src/components/ui/index.js
// Export all UI components from one place for easy importing
export { default as Modal, ModalHeaderButton } from './Modal';
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as Table, TableActions } from './Table';
export { default as Card, CardGrid } from './Card';
export { default as Alert } from './Alert';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as Footer } from './Footer';
export { default as ReportIssueModal } from './ReportIssueModal';

// Usage Examples:
// import { Button, Modal, Input, ConfirmDialog, Footer, ReportIssueModal } from '../ui';
// OR
// import { Button } from '../ui/Button';
// import Footer from '../ui/Footer';