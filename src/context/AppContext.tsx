// src/context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { processesApi, Process } from '../services/api';

interface AppContextType {
    processes: Process[];
    currentProcess: Process | null;
    currentSessionId: string | null;
    isLoading: boolean;
    error: string | null;
    refreshProcesses: () => Promise<void>;
    selectProcess: (process: Process | null) => void;
    setCurrentSessionId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [processes, setProcesses] = useState<Process[]>([]);
    const [currentProcess, setCurrentProcess] = useState<Process | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshProcesses = async () => {
        setIsLoading(true);
        const result = await processesApi.list();
        if (result.data) {
            setProcesses(result.data.processes);
            // Auto-select first process if none selected
            if (!currentProcess && result.data.processes.length > 0) {
                setCurrentProcess(result.data.processes[0]);
            }
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    const selectProcess = (process: Process | null) => {
        setCurrentProcess(process);
        setCurrentSessionId(null); // Reset session when switching processes
    };

    useEffect(() => {
        refreshProcesses();
    }, []);

    return (
        <AppContext.Provider
            value={{
                processes,
                currentProcess,
                currentSessionId,
                isLoading,
                error,
                refreshProcesses,
                selectProcess,
                setCurrentSessionId,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
