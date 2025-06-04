"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

interface Bet {
  id: number;
  name: string;
  odd: number;
  date: string;
  active: boolean;
  is_winner: boolean | null;
}

interface BetContextType {
  bets: Bet[];
  loading: boolean;
  refreshBets: () => Promise<void>;
}

const BetContext = createContext<BetContextType | undefined>(undefined);

export function BetProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from<Bet>("bets")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching bets:", error);
      setBets([]);
    } else if (data) {
      setBets(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBets();
  }, []);

  return (
    <BetContext.Provider value={{ bets, loading, refreshBets: fetchBets }}>
      {children}
    </BetContext.Provider>
  );
}

export function useBets() {
  const context = useContext(BetContext);
  if (!context) {
    throw new Error("useBets must be used within a BetProvider");
  }
  return context;
}
