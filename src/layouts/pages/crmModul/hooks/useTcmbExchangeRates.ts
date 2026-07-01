import { useEffect, useState } from "react";
import { fetchTcmbExchangeRates, type TcmbExchangeRates } from "../tcmbExchangeRates";

export const useTcmbExchangeRates = () => {
  const [rates, setRates] = useState<TcmbExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRates = async () => {
      try {
        setLoading(true);
        const data = await fetchTcmbExchangeRates();
        if (cancelled) return;
        setRates(data);
        setError(null);
      } catch {
        if (cancelled) return;
        setRates(null);
        setError("TCMB kurları yüklenemedi");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRates();

    return () => {
      cancelled = true;
    };
  }, []);

  return { rates, loading, error };
};
