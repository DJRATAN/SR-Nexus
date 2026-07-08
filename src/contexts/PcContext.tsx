import { createContext, useContext, useState, ReactNode } from "react";

type PcType = "PC1" | "PC2";

interface PcContextType {
  activePc: PcType;
  setActivePc: (pc: PcType) => void;
}

const PcContext = createContext<PcContextType | undefined>(undefined);

export function PcProvider({ children }: { children: ReactNode }) {
  const [activePc, setActivePc] = useState<PcType>("PC1");

  return (
    <PcContext.Provider value={{ activePc, setActivePc }}>
      {children}
    </PcContext.Provider>
  );
}

export function usePc() {
  const context = useContext(PcContext);
  if (!context) {
    throw new Error("usePc must be used within a PcProvider");
  }
  return context;
}
