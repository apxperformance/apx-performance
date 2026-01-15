import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Dumbbell, Users, Calendar, Utensils, TrendingUp, LogOut, User as UserIcon, Crown, Zap, BookOpen, BarChart3, Settings, UtensilsCrossed, Pill, MessageCircle, CalendarDays, Sun, Moon 
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/Toaster";
import { UserProvider, useUser } from "@/components/contexts/UserContext";
import { ClientsProvider } from "@/components/contexts/ClientsContext";
import { ThemeProvider, useTheme } from "@/components/contexts/ThemeContext";
import { ReactQueryProvider } from "@/components/contexts/ReactQueryProvider";
import ErrorBoundary from "@/components/errors/ErrorBoundary";
import CommandPaletteTrigger from "@/components/ui/command-palette-trigger";

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, hasCoach, coachTierInfo } = useUser();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);

  // --- POOL LOGIC ---
  const ensureInAvailablePool = useCallback(async (userData) => {
    try {
      if (!userData || !userData.id || !userData.email) return;
      if (userData.user_type === 'coach' || userData.coach_id) return;

      if (!userData.user_type) {
        console.log("Fixing missing user_type...");
        await base44.entities.User.update(userData.id, { user_type: 'client' });
      }

      const existing = await base44.entities.AvailableClient.filter({ user_id: userData.id });
      if (existing.length === 0) {
        await base44.entities.AvailableClient.create({
          user_id: userData.id,
          full_name: userData.full_name || "Unknown User",
          email: userData.email,
          profile_image: userData.profile_image || "",
          fitness_goals: userData.fitness_goals || [],
          date_available: new Date().toISOString()
        });
      }
    } catch (error) {
      if (!error?.message?.includes('auth')) {
        console.error("Error ensuring user is in available pool:", error);
      }
    }
  }, []);

  // --- VALIDATION LOGIC ---
  useEffect(() => {
    const validateUserAccess = async () => {
      if (isLoading || !user || hasValidated || isLoggingOut) return;

      if (!user.email) {
        setHasValidated(true);
        navigate(createPageUrl("Welcome"), { replace: true });
        return;
      }

      let shouldRedirect = false;
      let redirectUrl = null;

      if (user.user_type === 'coach') {
        const clientOnlyPages = ["ClientDashboard", "MyWorkouts", "MyNutrition", "MySupplements", "FreeClientDashboard", "FoodTracker", "CheckInJournal", "MyProgress", "ClientSettings", "ClientCalendar"];
        if (clientOnlyPages.includes(currentPageName)) {
          shouldRedirect = true;
          redirectUrl = createPageUrl("CoachDashboard");
        }
      } else {
        if (user.coach_id && (currentPageName === "FreeClientDashboard" || currentPageName === "BrowseCoaches")) {
          shouldRedirect = true;
          redirectUrl = createPageUrl("ClientDashboard");
        }
        if (!user.coach_id && currentPageName === "ClientDashboard") {
          shouldRedirect = true;
          redirectUrl = createPageUrl("FreeClientDashboard");
        }
        if (!user.coach_id && !shouldRedirect) {
          ensureInAvailablePool(user);
        }
        const coachOnlyPages = ["CoachDashboard", "ClientManagement", "WorkoutBuilder", "NutritionPlanner", "ProgressReviews", "CoachSettings", "SupplementPlanner", "CoachingCalendar"];
        if (coachOnlyPages.includes(currentPageName)) {
          shouldRedirect = true;
          redirectUrl = user.coach_id ? createPageUrl("ClientDashboard") : createPageUrl("FreeClientDashboard");
        }
      }

      setHasValidated(true);
      if (shouldRedirect && redirectUrl) {
        navigate(redirectUrl, { replace: true });
      }
    };
    validateUserAccess();
  }, [user, isLoading, hasValidated, currentPageName, ensureInAvailablePool, navigate, isLoggingOut]);

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    setIsLoggingOut(true);
    if (typeof window !== "undefined") window.localStorage.clear();
    setHasValidated(false);
    sessionStorage.clear();
    try { 
      await base44.auth.logout(); 
    } catch (e) { 
      console.error("Logout error (ignoring):", e); 
    } finally { 
      window.location.href = '/';
    }
  };

  // --- SAFETY CHECK ---
  // If we are loading, logging out, OR if we have no user (and we aren't on the public Welcome page),
  // we MUST show the spinner. We cannot render 'children' (Dashboard) without a user, or it crashes.
  const showSpinner = isLoading || isLoggingOut || (!user && currentPageName !== "Welcome");

  // --- PUBLIC LAYOUT ---
  if (currentPageName === "Welcome" || showSpinner) {
    return (
      <div className="min-h-screen bg-background">
        <style>
          {`
            :root {
              --background: ${isDarkMode ? '0 0% 3.9%' : '0 0% 98%'};
              --foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --card: ${isDarkMode ? '0 0% 3.9%' : '0 0% 100%'};
              --card-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --popover: ${isDarkMode ? '0 0% 3.9%' : '0 0% 100%'};
              --popover-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --primary: 49 39% 56%;
              --primary-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              --secondary: ${isDarkMode ? '0 0% 14.9%' : '0 0% 96%'};
              --secondary-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 9%'};
              --muted: ${isDarkMode ? '0 0% 14.9%' : '0 0% 96%'};
              --muted-foreground: ${isDarkMode ? '0 0% 63.9%' : '0 0% 45.1%'};
              --accent: 49 39% 56%;
              --accent-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              --destructive: ${isDarkMode ? '0 62.8% 30.6%' : '0 84.2% 60.2%'};
              --destructive-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              --border: ${isDarkMode ? '0 0% 25%' : '0 0% 89.8%'};
              --input: ${isDarkMode ? '0 0% 25%' : '0 0% 89.8%'};
              --ring: 49 39% 56%;
            }
            
            input::placeholder,
            textarea::placeholder {
              color: hsl(var(--muted-foreground));
            }
          `}
        </style>
        
        {/* CRITICAL FIX: If we are in the 'showSpinner' state, we force the spinner. 
            We only render 'children' if it's safe (i.e. we are on the Welcome page). */}
        {showSpinner ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#C5B358] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          children
        )}
      </div>
    );
  }

  // --- MAIN APP LAYOUT (Sidebar) ---
  
  const coachNavigation = [
    { title: "Dashboard", url: createPageUrl("CoachDashboard"), icon: TrendingUp },
    { title: "Client Management", url: createPageUrl("ClientManagement"), icon: Users },
    { title: "Client Chat", url: createPageUrl("ClientChat"), icon: MessageCircle },
    { title: "Coaching Calendar", url: createPageUrl("CoachingCalendar"), icon: CalendarDays },
    { title: "Workout Builder", url: createPageUrl("WorkoutBuilder"), icon: Dumbbell },
    { title: "Nutrition Planner", url: createPageUrl("NutritionPlanner"), icon: Utensils },
    { title: "Supplement Planner", url: createPageUrl("SupplementPlanner"), icon: Pill },
    { title: "Progress Reviews", url: createPageUrl("ProgressReviews"), icon: BarChart3 },
    { title: "Settings", url: createPageUrl("CoachSettings"), icon: Settings }
  ];

  const clientNavigation = [
    { title: "My Dashboard", url: hasCoach ? createPageUrl("ClientDashboard") : createPageUrl("FreeClientDashboard"), icon: TrendingUp },
    { title: "My Schedule", url: createPageUrl("ClientCalendar"), icon: CalendarDays, requiresCoach: true },
    { title: "My Workouts", url: createPageUrl("MyWorkouts"), icon: Dumbbell },
    { title: "Nutrition Plan", url: createPageUrl("MyNutrition"), icon: Utensils },
    { title: "My Supplements", url: createPageUrl("MySupplements"), icon: Pill },
    { title: "Food Tracker", url: createPageUrl("FoodTracker"), icon: UtensilsCrossed },
    { title: "Check-In Journal", url: createPageUrl("CheckInJournal"), icon: BookOpen },
    { title: "My Progress", url: createPageUrl("MyProgress"), icon: BarChart3 },
    { title: "Coach Chat", url: createPageUrl("ClientChat"), icon: MessageCircle, requiresCoach: true }
  ].filter((item) => {
    if (item.requiresCoach && !hasCoach) return false;
    return true;
  });

  const navigationItems = user?.user_type === "coach" ? coachNavigation : clientNavigation;

  return (
    <SidebarProvider>
      <Toaster />
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <style>
          {`
            :root {
              --background: ${isDarkMode ? '0 0% 3.9%' : '0 0% 98%'};
              --foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --card: ${isDarkMode ? '0 0% 3.9%' : '0 0% 100%'};
              --card-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --popover: ${isDarkMode ? '0 0% 3.9%' : '0 0% 100%'};
              --popover-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --primary: 49 39% 56%;
              --primary-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              --secondary: ${isDarkMode ? '0 0% 14.9%' : '0 0% 96%'};
              --secondary-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 9%'};
              --muted: ${isDarkMode ? '0 0% 14.9%' : '0 0% 96%'};
              --muted-foreground: ${isDarkMode ? '0 0% 63.9%' : '0 0% 45.1%'};
              --accent: 49 39% 56%;
              --accent-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              --destructive: ${isDarkMode ? '0 62.8% 30.6%' : '0 84.2% 60.2%'};
              --destructive-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              --border: ${isDarkMode ? '0 0% 25%' : '0 0% 89.8%'};
              --input: ${isDarkMode ? '0 0% 25%' : '0 0% 89.8%'};
              --ring: 49 39% 56%;
            }
            
            input::placeholder,
            textarea::placeholder {
              color: hsl(var(--muted-foreground));
            }
          `}
        </style>
        
        <Sidebar className="border-r border-gray-200 bg-gray-100 backdrop-blur-xl">
          <SidebarHeader className="bg-neutral-900 p-6 flex flex-col gap-2 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                {user?.user_type === "coach" ? <Crown className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-gray-50 text-sm font-bold">APX PERFORMANCE</h2>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  {user?.user_type === "coach" ? "Coach Portal" : "Client Portal"}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="bg-neutral-900 p-4 flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-50 px-2 py-3 text-xs font-medium uppercase tracking-wider">
                {user?.user_type === "coach" ? "Coach Tools" : "My Fitness"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) =>
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`mb-2 group transition-all duration-300 rounded-xl ${
                          location.pathname === item.url 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                        }`}
                      >
                        <Link to={item.url} className="px-4 py-3 flex w-full items-center gap-3">
                          <item.icon className={`w-5 h-5 transition-transform duration-300 ${location.pathname === item.url ? 'text-gray-900' : 'text-gray-400 group-hover:text-white group-hover:scale-110'}`} />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="bg-neutral-900 p-4 flex flex-col gap-2 border-t border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-50 text-sm font-medium">Theme</span>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-400'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  isDarkMode ? 'translate-x-1' : 'translate-x-6'
                }`} />
                <Sun className={`absolute left-1 top-1 h-4 w-4 transition-opacity duration-300 ${isDarkMode ? 'opacity-0' : 'opacity-100 text-white'}`} />
                <Moon className={`absolute right-1 top-1 h-4 w-4 transition-opacity duration-300 ${isDarkMode ? 'opacity-100 text-gray-400' : 'opacity-0'}`} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-full flex items-center justify-center">
                {user?.user_type === "coach" ? <Crown className="w-5 h-5 text-gray-300" /> : <UserIcon className="w-5 h-5 text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-50 text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-xs truncate text-gray-500">
                  {user?.user_type === "coach" && coachTierInfo ? coachTierInfo.name : user?.user_type === "client" ? "Elite Member" : "User"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className={`${isDarkMode ? 'bg-black/40' : 'bg-white/80'} backdrop-blur-md border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} px-6 py-4`}>
            <div className="flex items-center gap-4">
              <SidebarTrigger className={`md:hidden ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} p-2 rounded-lg transition-colors duration-200`} />
              <div className="flex items-center gap-2 flex-1">
                  <h1 className="text-xl font-bold text-foreground">APX PERFORMANCE</h1>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {user?.user_type === "coach" ? "Coach" : "Client"}
                  </span>
                </div>
              <CommandPaletteTrigger />
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-background">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ErrorBoundary>
      <ReactQueryProvider>
        <ThemeProvider>
          <UserProvider>
            <ClientsProvider>
              <LayoutContent children={children} currentPageName={currentPageName} />
            </ClientsProvider>
          </UserProvider>
        </ThemeProvider>
      </ReactQueryProvider>
    </ErrorBoundary>
  );
}
