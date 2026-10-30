import React from 'react';
import { CheckCircle2, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { RagStatus } from '@/types/chat';
import { RAG_STATUS_CONFIG } from '@/constants/statuses';

interface ChatStatusBadgeProps {
  status?: RagStatus;
}

export const ChatStatusBadge: React.FC<ChatStatusBadgeProps> = ({ status }) => {
  if (!status) return null;

  const config = RAG_STATUS_CONFIG[status] || RAG_STATUS_CONFIG.service_unavailable;

  const renderIcon = () => {
    switch (status) {
      case 'answered':
        return <CheckCircle2 size={12} />;
      case 'insufficient_evidence':
        return <AlertCircle size={12} />;
      case 'needs_review':
        return <Info size={12} />;
      case 'out_of_scope':
      case 'invalid_question':
        return <HelpCircle size={12} />;
      case 'service_unavailable':
      default:
        return <AlertCircle size={12} />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
    >
      {renderIcon()}
      <span>{config.label}</span>
    </span>
  );
};

