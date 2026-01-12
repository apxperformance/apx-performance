import { createContext, useContext } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useUser } from './UserContext';

const ClientsContext = createContext(null);

export function ClientsProvider({ children }) {
  const { user, isCoach } = useUser();

  // Fetch clients only for coaches
  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user || !isCoach) return [];
      return base44.entities.Client.filter({ coach_id: user.id });
    },
    enabled: !!user && isCoach,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const value = {
    clients,
    isLoading,
    refreshClients: refetch,
    activeClients: clients.filter(c => c.status === 'active'),
    pendingClients: clients.filter(c => c.status === 'pending_invitation'),
    getClientById: (id) => clients.find(c => c.id === id),
    getClientByUserId: (userId) => clients.find(c => c.user_id === userId),
  };

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClients() {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
}