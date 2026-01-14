import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

// 1. GLOBAL STYLES - Configured for "Dark Sidebar" + "Light/Dark Main"
const globalStyles = `
:root {
  /* MAIN CONTENT: Light Mode = White Background */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;

  /* SIDEBAR: Always Dark (Matches your screenshot) */
  --sidebar-background: 240 10% 3.9%;
  --sidebar-foreground: 0 0% 98%;
  --sidebar-primary: 0 0% 98%;
  --sidebar-primary-foreground: 240 5.9% 10%;
  --sidebar-accent: 240 3.7% 15.9%;
  --sidebar-accent-foreground: 0 0% 98%;
  --sidebar-border: 240 3.7% 15.9%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}

.dark {
  /* MAIN CONTENT: Dark Mode = Dark Background */
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;

  /* SIDEBAR: Stays Dark in Dark Mode */
  --sidebar-background: 240 10% 3.9%;
  --sidebar-foreground: 0 0% 98%;
  --sidebar-primary: 0 0% 98%;
  --sidebar-primary-foreground: 240 5.9% 10%;
  --sidebar-accent: 240 3.7% 15.9%;
  --sidebar-accent-foreground: 0 0% 98%;
  --sidebar-border: 240 3.7% 15.9%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}

* { border-color: hsl(var(--border)); }
body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); }
`;

import {
  Dumbbell, Users, Utensils, TrendingUp, LogOut, User as UserIcon, Crown, Zap, BookOpen, BarChart3, Settings, UtensilsCrossed, Pill, MessageCircle, CalendarDays, Sun, Moon 
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
  const [hasValidated, setHasValidated] = useState(false);

  // 2. LOGIC: Auto-Fix User Type & Add to Pool (Unchanged)
  const ensureInAvailablePool = useCallback(async (userData) => {
    try {
      if (!userData || !userData.id || !userData.email) return;
      if (userData.user_type === 'coach' || userData.coach_id) return;

      if (!userData.user_type) {
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
       if (!error?.message?.includes('auth')) console.error("Pool error:", error);
    }
  }, []);

  useEffect(() => {
    const validateUserAccess = async () => {
      if (isLoading || !user || hasValidated) return;

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
        if (!user.coach_id && !shouldRedirect) ensureInAvailablePool(user);

        const coachOnlyPages = ["CoachDashboard", "ClientManagement", "WorkoutBuilder", "NutritionPlanner", "ProgressReviews", "CoachSettings", "SupplementPlanner", "CoachingCalendar"];
        if (coachOnlyPages.includes(currentPageName)) {
          shouldRedirect = true;
          redirectUrl = user.coach_id ? createPageUrl("ClientDashboard") : createPageUrl("FreeClientDashboard");
        }
      }
      setHasValidated(true);
      if (shouldRedirect && redirectUrl) navigate(redirectUrl, { replace: true });
    };
    validateUserAccess();
  }, [user, isLoading, hasValidated, currentPageName, ensureInAvailablePool, navigate]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") window.localStorage.clear();
    setHasValidated(false);
    sessionStorage.clear();
    try { await base44.auth.logout(); } catch (e) { console.error(e); } 
    finally { window.location.href = '/'; }
  };

  if (currentPageName === "Welcome" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <style>{globalStyles}</style>
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : children}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
        <style>{globalStyles}</style>
        
        {/* 3. STANDARD SIDEBAR (Uses Variables defined above for colors) */}
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-6 flex flex-col gap-2 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-md">
                {user?.user_type === "coach" ? <Crown className="w-6 h-6 text-sidebar-primary-foreground" /> : <Zap className="w-6 h-6 text-sidebar-primary-foreground" />}
              </div>
              <div>
                <h2 className="text-sidebar-foreground text-sm font-bold">APX PERFORMANCE</h2>
                <p className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">
                  {user?.user_type === "coach" ? "Coach Portal" : "Client Portal"}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4 flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/70 px-2 py-3 text-xs font-medium uppercase tracking-wider">
                {user?.user_type === "coach" ? "Coach Tools" : "My Fitness"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {/* Standard Button Structure - Guaranteed to work */}
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.pathname === item.url}
                        className="transition-all duration-200"
                      >
                        <Link to={item.url}>
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 flex flex-col gap-2 border-t border-sidebar-border">
             {/* Theme Toggle */}
             <div className="flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
              <span className="text-sidebar-foreground/70 text-xs font-medium">Theme</span>
              <button onClick={toggleTheme} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-sidebar-accent' : 'bg-sidebar-accent'}`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-sidebar-foreground translate-x-1 ${isDarkMode ? 'translate-x-1' : 'translate-x-5'}`} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mt-2">
              <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center border border-sidebar-border">
                {user?.user_type === "coach" ? <Crown className="w-4 h-4 text-sidebar-foreground" /> : <UserIcon className="w-4 h-4 text-sidebar-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sidebar-foreground text-xs font-medium truncate">{user?.full_name}</p>
                <p className="text-[10px] truncate text-sidebar-foreground/70">
                  {user?.user_type === "coach" && coachTierInfo ? coachTierInfo.name : "Member"}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sidebar-foreground/70 hover:text-red-400 hover:bg-red-900/10 text-xs font-medium">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden p-2 rounded-lg" />
              <div className="flex items-center gap-2 flex-1">
                  <h1 className="text-xl font-bold text-foreground">APX PERFORMANCE</h1>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide bg-secondary px-2 py-0.5 rounded border border-border">
                    {user?.user_type === "coach" ? "COACH" : "CLIENT"}
                  </span>
              </div>
              <CommandPaletteTrigger />
            </div>
          </header>
          {/* Main content scrollable area */}
          <div className="flex-1 overflow-y-auto bg-background p-6">
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