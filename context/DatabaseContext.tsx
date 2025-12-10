import { initDatabase } from '@/database/database';
import * as SQLite from 'expo-sqlite';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface DatabaseContextType {
  db: SQLite.SQLiteDatabase | null;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
  isLoading: true,
  isReady: false,
  error: null,
});

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const database = await initDatabase();
        setDb(database);
        setIsReady(true);

        console.log('Database context ready');
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Database initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    setupDatabase();
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isLoading, isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export default DatabaseContext;

