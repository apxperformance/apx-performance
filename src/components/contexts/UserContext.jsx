import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const UserContext = createContext(null);

// ✅ Coach tier calculation helper
const calculateCoachTier = (activeClientCount) => {
  if (activeClientCount >= 16) return 'elite';
  if (activeClientCount >= 6) return 'pro';
  return 'associate';
};

const getCoachTierInfo = (tier) => {
  const tiers = {
    associate: {
      name: 'Associate Coach',
      icon: '🥉',
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      nextTier: 'Pro Coach',
      nextThreshold: 6
    },
    pro: {
      name: 'Pro Coach',
      icon: '🥈',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      nextTier: 'Elite Coach',
      nextThreshold: 16
    },
    elite: {
      name: 'Elite Coach',
      icon: '🥇',
      color: 'text-[#C5B358]',
      bgColor: 'bg-[#C5B358]/20',
      borderColor: 'border-[#C5B358]/30',
      nextTier: null,
      nextThreshold: null
    }
  };
  return tiers[tier] || tiers.associate;
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coachTier, setCoachTier] = useState(null);
  const [activeClientCount, setActiveClientCount] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // ✅ If user is a coach, calculate their tier
        if (userData?.user_type === 'coach') {
          await loadCoachTier(userData.id);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const loadCoachTier = async (coachId) => {
    try {
      const clients = await base44.entities.Client.filter({ 
        coach_id: coachId,
        status: 'active'
      });
      const count = clients.length;
      const tier = calculateCoachTier(count);
      
      setActiveClientCount(count);
      setCoachTier(tier);
    } catch (error) {
      console.error('Error loading coach tier:', error);
      setCoachTier('associate');
      setActiveClientCount(0);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // ✅ Refresh tier if coach
      if (userData?.user_type === 'coach') {
        await loadCoachTier(userData.id);
      }
      
      return userData;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  };

  const value = {
    user,
    isLoading,
    refreshUser,
    isCoach: user?.user_type === 'coach',
    isClient: user?.user_type === 'client',
    hasCoach: user?.user_type === 'client' && !!user?.coach_id,
    // ✅ Coach tier information
    coachTier,
    coachTierInfo: coachTier ? getCoachTierInfo(coachTier) : null,
    activeClientCount,
    refreshCoachTier: () => user?.user_type === 'coach' && loadCoachTier(user.id)
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// ✅ Export helper functions for use outside context
export { calculateCoachTier, getCoachTierInfo };