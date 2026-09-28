'use client';

import { useState } from 'react';
import { switchUserAction } from '@/app/dashboard/switch-user-action';
import { ChevronDown, FlaskConical } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { scaleIn } from '@/lib/motion';

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
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-amber-500/95 text-amber-950 px-4 h-8 text-xs font-semibold shadow-sm backdrop-blur-sm"
      style={{ height: 'var(--dev-bar-height)' }}
      role="banner"
      aria-label="Development mode banner"
    >
      <span className="flex items-center gap-1.5">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">DEV MODE —</span>
        <span>acting as</span>
        <strong className="font-semibold">{currentUser.name}</strong>
        <span className="text-amber-800">({currentUser.roleName})</span>
      </span>

      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          disabled={switching}
          className="flex items-center gap-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-0.5 text-xs font-medium transition-colors duration-150 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          id="dev-user-switch-btn"
          aria-label="Switch active user (dev mode)"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {switching ? (
            <span className="animate-pulse">Switching…</span>
          ) : (
            <>
              Switch User
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <>
              {/* Click-away backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
              <m.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ originY: 0, originX: 1 }}
                className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-border rounded-lg shadow-lg py-1 z-50 overflow-hidden"
                role="listbox"
                aria-label="Select user to switch to"
              >
                {allUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSwitch(u.id)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors duration-100 flex flex-col gap-0.5 hover:bg-surface-blue focus:bg-surface-blue focus:outline-none ${
                      u.id === currentUser.id ? 'bg-primary/5' : ''
                    }`}
                    role="option"
                    aria-selected={u.id === currentUser.id}
                    id={`switch-user-${u.id}`}
                  >
                    <span className="font-semibold text-foreground">{u.name}</span>
                    <span className="text-muted-foreground">{u.roleName}</span>
                  </button>
                ))}
              </m.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
