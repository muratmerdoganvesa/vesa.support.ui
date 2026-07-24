import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isReAuthOpen, subscribeReAuth } from "utils/reAuthGate";

export type BusySeverity = string;

export interface BusyDispatchArgs {
  //   severity: BusySeverity,
  isBusy: boolean;
}

export type BusyContextInterface = (args: BusyDispatchArgs) => void;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emptyState: BusyContextInterface = (args) => {
  return;
};

export const BusyContext = createContext<BusyContextInterface>(emptyState);

export const useBusy: () => BusyContextInterface = () => useContext(BusyContext);

interface BusyProviderProps {
  children: React.ReactNode;
}

export function BusyProvider({ children }: BusyProviderProps): JSX.Element {
  const [activeRequests, setActiveRequests] = useState(0);
  const [reAuthOpen, setReAuthOpen] = useState(isReAuthOpen());

  useEffect(() => subscribeReAuth(setReAuthOpen), []);

  const dispatchBusy = useCallback(({ isBusy }: BusyDispatchArgs) => {
    setActiveRequests((prevCount) => {
      if (isBusy) {
        return prevCount + 1;
      } else {
        return Math.max(0, prevCount - 1);
      }
    });
  }, []);

  // Re-auth modal açıkken busy overlay'i gizle — aksi halde z-index ile modalı kilitler
  const isVisible = activeRequests > 0 && !reAuthOpen;

  return (
    <BusyContext.Provider value={dispatchBusy}>
      {children}
      {isVisible && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white/80 px-6 py-4 shadow-md">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            <span className="text-xs font-medium text-gray-600">
              Yükleniyor...
            </span>
          </div>
        </div>
      )}
    </BusyContext.Provider>
  );
}
