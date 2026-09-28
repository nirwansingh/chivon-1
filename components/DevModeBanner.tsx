'use client';

import { useState } from 'react';
import { switchUserAction } from '@/app/dashboard/switch-user-action';

interface UserOption {
  id: string;
  name: string;
  email: string;
  roleName: string;
}

interface DevModeBannerProps {
  currentUser: { id: string; name: string; roleName: string };
  allUsers: UserOption[];
}

export function DevModeBanner({ currentUser, allUsers }: DevModeBannerProps) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (userId: string) => {
    if (userId === currentUser.id) { setOpen(false); return; }
    setSwitching(true);
    setOpen(false);
    try {
      await switchUserAction(userId);
    } catch {
      setSwitching(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-amber-500 text-amber-950 px-4 py-1 text-xs font-semibold shadow-sm">
      <span className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        DEV MODE — acting as <strong className="mx-1">{currentUser.name}</strong> ({currentUser.roleName})
      </span>

      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          disabled={switching}
          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white rounded px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-60"
          id="dev-user-switch-btn"
          aria-label="Switch active user (dev mode)"
        >
          {switching ? 'Switching…' : 'Switch User'}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50" role="menu">
            {allUsers.map(u => (
              <button
                key={u.id}
                onClick={() => handleSwitch(u.id)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex flex-col gap-0.5 ${u.id === currentUser.id ? 'bg-blue-50' : ''}`}
                role="menuitem"
                id={`switch-user-${u.id}`}
              >
                <span className="font-medium text-gray-800">{u.name}</span>
                <span className="text-gray-500">{u.roleName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
