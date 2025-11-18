import React from 'react';

export const MagicWandIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.25278C12 6.25278 10.2222 3.7037 8.5 2.5C6.77778 1.2963 5 3.11111 5 3.11111C5 3.11111 2.83333 5.5 4 7.5C5.16667 9.5 7.5 7.5 7.5 7.5"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.5 9C14.5 9 13.0648 6.91667 11.5 6C9.93519 5.08333 8.5 6.5 8.5 6.5"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.5 12C17.5 12 16.0648 9.91667 14.5 9C12.9352 8.08333 11.5 9.5 11.5 9.5"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.5 3.5L20.25 14.25L14.25 20.25L3.5 9.5L9.5 3.5Z"
    />
  </svg>
);

export const BookOpenIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m10-1_M21 12h-4m2 2l-2-2m0 0l-2 2m2-2v-4m2 2h4m-4-2l2-2m0 0l2 2m-2-2V6" />
    </svg>
);

export const HistoryIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
