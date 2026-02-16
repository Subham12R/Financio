import { useState, useEffect } from 'react';
import { getDatabase, initDatabase } from '../lib/database';

export const useDatabase = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await getDatabase();
        await initDatabase();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database initialization failed');
      }
    };
    init();
  }, []);

  return { isReady, error };
};
