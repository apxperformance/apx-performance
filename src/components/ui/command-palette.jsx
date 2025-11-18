import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  Search, 
  Users, 
  Dumbbell, 
  Utensils, 
  Pill, 
  Calendar, 
  MessageCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Home,
  Settings,
  BookOpen,
  UtensilsCrossed,
  BarChart3
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../contexts/UserContext";

const CATEGORY_ICONS = {
  navigation: Home,
  clients: Users,
  workouts: Dumbbell,
  nutrition: Utensils,
  supplements: Pill,
  calendar: Calendar,
  chat: MessageCircle,
  progress: TrendingUp,
  actions: Plus
};

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const { user, isCoach, isClient } = useUser();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("commandPalette_recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading recent searches:", e);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((item) => {
    const newRecent = [
      item,
      ...recentSearches.filter(r => r.id !== item.id)
    ].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("commandPalette_recentSearches", JSON.stringify(newRecent));
  }, [recentSearches]);

  // Quick navigation items
  const navigationItems = useMemo(() => {
    if (!user) return [];
    
    const baseItems = [
      {
        id: "nav-home",
        title: isCoach ? "Coach Dashboard" : "My Dashboard",
        category: "navigation",
        icon: Home,
        action: () => navigate(createPageUrl(isCoach ? "CoachDashboard" : (user.coach_id ? "ClientDashboard" : "FreeClientDashboard")))
      }
    ];

    if (isCoach) {
      return [
        ...baseItems,
        {
          id: "nav-clients",
          title: "Client Management",
          category: "navigation",
          icon: Users,
          action: () => navigate(createPageUrl("ClientManagement"))
        },
        {
          id: "nav-workouts",
          title: "Workout Builder",
          category: "navigation",
          icon: Dumbbell,
          action: () => navigate(createPageUrl("WorkoutBuilder"))
        },
        {
          id: "nav-nutrition",
          title: "Nutrition Planner",
          category: "navigation",
          icon: Utensils,
          action: () => navigate(createPageUrl("NutritionPlanner"))
        },
        {
          id: "nav-supplements",
          title: "Supplement Planner",
          category: "navigation",
          icon: Pill,
          action: () => navigate(createPageUrl("SupplementPlanner"))
        },
        {
          id: "nav-progress",
          title: "Progress Reviews",
          category: "navigation",
          icon: TrendingUp,
          action: () => navigate(createPageUrl("ProgressReviews"))
        },
        {
          id: "nav-calendar",
          title: "Coaching Calendar",
          category: "navigation",
          icon: Calendar,
          action: () => navigate(createPageUrl("CoachingCalendar"))
        },
        {
          id: "nav-chat",
          title: "Client Chat",
          category: "navigation",
          icon: MessageCircle,
          action: () => navigate(createPageUrl("ClientChat"))
        },
        {
          id: "nav-settings",
          title: "Settings",
          category: "navigation",
          icon: Settings,
          action: () => navigate(createPageUrl("CoachSettings"))
        }
      ];
    } else {
      return [
        ...baseItems,
        {
          id: "nav-workouts",
          title: "My Workouts",
          category: "navigation",
          icon: Dumbbell,
          action: () => navigate(createPageUrl("MyWorkouts"))
        },
        {
          id: "nav-nutrition",
          title: "Nutrition Plan",
          category: "navigation",
          icon: Utensils,
          action: () => navigate(createPageUrl("MyNutrition"))
        },
        {
          id: "nav-supplements",
          title: "My Supplements",
          category: "navigation",
          icon: Pill,
          action: () => navigate(createPageUrl("MySupplements"))
        },
        {
          id: "nav-food-tracker",
          title: "Food Tracker",
          category: "navigation",
          icon: UtensilsCrossed,
          action: () => navigate(createPageUrl("FoodTracker"))
        },
        {
          id: "nav-checkin",
          title: "Check-In Journal",
          category: "navigation",
          icon: BookOpen,
          action: () => navigate(createPageUrl("CheckInJournal"))
        },
        {
          id: "nav-progress",
          title: "My Progress",
          category: "navigation",
          icon: BarChart3,
          action: () => navigate(createPageUrl("MyProgress"))
        },
        ...(user.coach_id ? [{
          id: "nav-chat",
          title: "Coach Chat",
          category: "navigation",
          icon: MessageCircle,
          action: () => navigate(createPageUrl("ClientChat"))
        }] : [])
      ];
    }
  }, [user, isCoach, navigate]);

  // Quick action items
  const quickActions = useMemo(() => {
    if (!isCoach) return [];
    
    return [
      {
        id: "action-new-client",
        title: "Add New Client",
        category: "actions",
        icon: Plus,
        subtitle: "Invite a new client to your roster",
        action: () => {
          navigate(createPageUrl("ClientManagement"));
          setTimeout(() => {
            // This would trigger the add client dialog
            // You'd need to expose this via a global state or event
          }, 100);
        }
      },
      {
        id: "action-new-workout",
        title: "Create Workout",
        category: "actions",
        icon: Plus,
        subtitle: "Design a new workout template",
        action: () => navigate(createPageUrl("WorkoutBuilder"))
      },
      {
        id: "action-new-nutrition",
        title: "Create Nutrition Plan",
        category: "actions",
        icon: Plus,
        subtitle: "Build a custom meal plan",
        action: () => navigate(createPageUrl("NutritionPlanner"))
      },
      {
        id: "action-new-supplement",
        title: "Create Supplement Plan",
        category: "actions",
        icon: Plus,
        subtitle: "Design a supplement protocol",
        action: () => navigate(createPageUrl("SupplementPlanner"))
      }
    ];
  }, [isCoach, navigate]);

  // Search function
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || !user) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const lowerQuery = searchQuery.toLowerCase();
    const searchResults = [];

    try {
      // Search navigation items
      const navMatches = navigationItems.filter(item =>
        item.title.toLowerCase().includes(lowerQuery)
      );
      searchResults.push(...navMatches);

      // Search quick actions
      const actionMatches = quickActions.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.subtitle?.toLowerCase().includes(lowerQuery)
      );
      searchResults.push(...actionMatches);

      if (isCoach) {
        // Search clients
        const clients = await base44.entities.Client.filter({ coach_id: user.id });
        const clientMatches = clients
          .filter(client => 
            client.full_name?.toLowerCase().includes(lowerQuery) ||
            client.email?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 5)
          .map(client => ({
            id: `client-${client.id}`,
            title: client.full_name,
            subtitle: client.email,
            category: "clients",
            icon: Users,
            action: () => navigate(`${createPageUrl("ClientProfile")}?clientId=${client.id}`)
          }));
        searchResults.push(...clientMatches);

        // Search workouts
        const workouts = await base44.entities.Workout.filter({ coach_id: user.id });
        const workoutMatches = workouts
          .filter(workout => 
            workout.name?.toLowerCase().includes(lowerQuery) ||
            workout.description?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 5)
          .map(workout => ({
            id: `workout-${workout.id}`,
            title: workout.name,
            subtitle: workout.description?.substring(0, 60) || `${workout.difficulty_level} • ${workout.estimated_duration}min`,
            category: "workouts",
            icon: Dumbbell,
            action: () => navigate(createPageUrl("WorkoutBuilder"))
          }));
        searchResults.push(...workoutMatches);

        // Search nutrition plans
        const nutritionPlans = await base44.entities.NutritionPlan.filter({ coach_id: user.id });
        const nutritionMatches = nutritionPlans
          .filter(plan => 
            plan.name?.toLowerCase().includes(lowerQuery) ||
            plan.description?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 5)
          .map(plan => ({
            id: `nutrition-${plan.id}`,
            title: plan.name,
            subtitle: `${plan.daily_calories} cal/day`,
            category: "nutrition",
            icon: Utensils,
            action: () => navigate(createPageUrl("NutritionPlanner"))
          }));
        searchResults.push(...nutritionMatches);

        // Search supplement plans
        const supplementPlans = await base44.entities.SupplementPlan.filter({ coach_id: user.id });
        const supplementMatches = supplementPlans
          .filter(plan => 
            plan.name?.toLowerCase().includes(lowerQuery) ||
            plan.description?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 5)
          .map(plan => ({
            id: `supplement-${plan.id}`,
            title: plan.name,
            subtitle: `${plan.supplements?.length || 0} supplements`,
            category: "supplements",
            icon: Pill,
            action: () => navigate(`${createPageUrl("SupplementPlanner")}?planId=${plan.id}`)
          }));
        searchResults.push(...supplementMatches);
      }

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsSearching(false);
    }
  }, [user, isCoach, navigationItems, quickActions, navigate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const displayedItems = query ? results : [...recentSearches, ...navigationItems.slice(0, 5)];
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < displayedItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : displayedItems.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = displayedItems[selectedIndex];
        if (item) {
          handleSelectItem(item);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, query, results, recentSearches, navigationItems, selectedIndex]);

  const handleSelectItem = (item) => {
    saveRecentSearch(item);
    item.action();
    handleClose();
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
    onClose();
  };

  const displayedItems = query 
    ? results 
    : [...recentSearches, ...navigationItems.slice(0, 5)];

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    displayedItems.forEach(item => {
      const category = item.category || "other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, [displayedItems]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-2xl bg-card/95 backdrop-blur-xl border-border overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything... (clients, workouts, nutrition, pages)"
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
          {isSearching && (
            <div className="w-4 h-4 border-2 border-[#C5B358] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && recentSearches.length > 0 && (
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                <Clock className="w-3 h-3" />
                Recent Searches
              </div>
            </div>
          )}

          {displayedItems.length === 0 && query && !isSearching && (
            <div className="px-4 py-12 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try searching for clients, workouts, or pages</p>
            </div>
          )}

          {displayedItems.length === 0 && !query && (
            <div className="px-4 py-8">
              <p className="text-sm text-muted-foreground mb-4">Quick Navigation:</p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-2">
                {query && (
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                )}
                {items.map((item, index) => {
                  const globalIndex = displayedItems.indexOf(item);
                  const isSelected = globalIndex === selectedIndex;
                  const Icon = item.icon || CATEGORY_ICONS[item.category] || ArrowRight;
                  
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected 
                          ? 'bg-[#C5B358]/10 border-l-2 border-[#C5B358]' 
                          : 'hover:bg-secondary/50 border-l-2 border-transparent'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#C5B358]/20' : 'bg-secondary'}`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[#C5B358]' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-sm text-muted-foreground truncate">{item.subtitle}</div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border">Enter</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-card border border-border">Esc</kbd>
              Close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-card border border-border">⌘K</kbd>
            <span>to open</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}