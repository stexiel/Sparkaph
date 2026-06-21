import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LinkifyProps {
  text: string;
  className?: string;
}

export const Linkify: React.FC<LinkifyProps> = ({ text, className = '' }) => {
  const navigate = useNavigate();

  const handleClick = (match: string, type: 'user' | 'app' | 'group') => {
    const handle = match.substring(1);
    
    switch (type) {
      case 'user':
        navigate(`/user/${handle}`);
        break;
      case 'app':
        navigate(`/${handle}`);
        break;
      case 'group':
        navigate(`/chat?group=${handle}`);
        break;
    }
  };

  const pattern = /@(\w+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedText = match[0];
    
    parts.push(
      React.createElement(
        'span',
        {
          key: match.index,
          onClick: () => handleClick(matchedText, 'user'),
          className: 'text-[var(--color-ios-blue)] hover:underline cursor-pointer'
        },
        matchedText
      )
    );

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return React.createElement('span', { className }, ...parts);
};

export const linkifyText = (text: string): string => {
  return text.replace(/@(\w+)/g, '<span class="text-[var(--color-ios-blue)] hover:underline cursor-pointer">@$1</span>');
};
