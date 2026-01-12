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
      
      // Get all clients for this coach
      const clientRecords = await base44.entities.Client.filter({ coach_id: user.id });
      
      // Filter out clients whose linked user no longer exists
      const validClients = [];
      for (const client of clientRecords) {
        if (client.user_id) {
          try {
            // Check if the linked user still exists
            const linkedUser = await base44.entities.User.filter({ id: client.user_id });
            if (linkedUser && linkedUser.length > 0) {
              validClients.push(client);
            } else {
              // User doesn't exist anymore, delete the client record
              await base44.entities.Client.delete(client.id);
            }
          } catch (error) {
            // If error fetching user, delete the client record
            await base44.entities.Client.delete(client.id);
          }
        } else {
          // No user_id yet (pending invitation), keep it
          validClients.push(client);
        }
      }
      
      return validClients;
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