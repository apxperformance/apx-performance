import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Dumbbell, Users, Calendar, Utensils, TrendingUp, LogOut, User as UserIcon, Crown, Zap, BookOpen, BarChart3, Settings, UtensilsCrossed, Pill, MessageCircle, CalendarDays, Sun, Moon } from
"lucide-react";
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
  SidebarTrigger } from
"@/components/ui/sidebar";
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

  const ensureInAvailablePool = useCallback(async (userData) => {
    try {
      // ✅ Extra validation: only proceed if we have a valid user with required fields
      if (!userData || !userData.id || !userData.email || userData.user_type !== 'client' || userData.coach_id) {
        return;
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
        console.log(`User ${userData.email} added to available client pool.`);
      }
    } catch (error) {
      // ✅ Silently handle authentication errors - this is not critical
      if (error?.message?.includes('logged in') || error?.message?.includes('auth')) {
        console.log('Skipping available pool check - authentication in progress');
        return;
      }
      console.error("Error ensuring user is in available pool:", error);
    }
  }, []);

  // Main validation: Runs once on user load
  useEffect(() => {
    const validateUserAccess = async () => {
      if (isLoading || !user || hasValidated) return;

      console.log("=== INITIAL VALIDATION ===");
      console.log("User:", user.email);
      console.log("User Type:", user.user_type);
      console.log("Coach ID:", user.coach_id);
      console.log("Current Page:", currentPageName);
      console.log("========================");

      let shouldRedirect = false;
      let redirectUrl = null;

      if (user.user_type === 'coach') {
        // Coaches should not access client-specific pages
        const clientOnlyPages = ["ClientDashboard", "MyWorkouts", "MyNutrition", "MySupplements", "FreeClientDashboard", "FoodTracker", "CheckInJournal", "MyProgress", "ClientSettings", "ClientCalendar"];
        if (clientOnlyPages.includes(currentPageName)) {
          console.warn("❌ Coach user on a client-only page, redirecting to CoachDashboard...");
          shouldRedirect = true;
          redirectUrl = createPageUrl("CoachDashboard");
        }
      } else if (user.user_type === 'client') {
        // Clients with a coach shouldn't see the FreeClientDashboard
        if (user.coach_id && currentPageName === "FreeClientDashboard") {
          console.log("✅ Assigned client on free page, redirecting to ClientDashboard...");
          shouldRedirect = true;
          redirectUrl = createPageUrl("ClientDashboard");
        }
        
        // Clients without a coach should see FreeClientDashboard as their main dashboard
        if (!user.coach_id && currentPageName === "ClientDashboard") {
          console.log("✅ Unassigned client on assigned dashboard, redirecting to FreeClientDashboard...");
          shouldRedirect = true;
          redirectUrl = createPageUrl("FreeClientDashboard");
        }
        
        // ✅ Only try to add to available pool if not redirecting and after a small delay
        if (!user.coach_id && !shouldRedirect) {
          // Use setTimeout to ensure this runs after authentication is fully settled
          setTimeout(() => {
            ensureInAvailablePool(user);
          }, 1000);
        }
        
        // Coach-only pages should not be accessible by clients
        const coachOnlyPages = ["CoachDashboard", "ClientManagement", "WorkoutBuilder", "NutritionPlanner", "ProgressReviews", "CoachSettings", "SupplementPlanner", "CoachingCalendar"];
        if (coachOnlyPages.includes(currentPageName)) {
          console.warn("❌ Client user on a coach-only page, redirecting...");
          shouldRedirect = true;
          redirectUrl = user.coach_id ? createPageUrl("ClientDashboard") : createPageUrl("FreeClientDashboard");
        }
      } else if (!user.user_type) {
        if (currentPageName !== "Welcome") {
          console.log("❌ User without type trying to access app, redirecting to Welcome...");
          shouldRedirect = true;
          redirectUrl = createPageUrl("Welcome");
        }
      }

      setHasValidated(true);

      if (shouldRedirect && redirectUrl) {
        console.log("🔄 Redirecting to:", redirectUrl);
        navigate(redirectUrl, { replace: true });
      } else {
        console.log("✅ Validation passed - no redirect needed");
      }
    };

    validateUserAccess();
  }, [user, isLoading, hasValidated, currentPageName, ensureInAvailablePool, navigate]);

  // Targeted dashboard validation: Runs on every page navigation
  useEffect(() => {
    // Only validate dashboard pages after initial validation is complete
    if (!hasValidated || isLoading || !user) return;

    // Only check dashboard-specific navigation
    const isDashboardPage = currentPageName === "ClientDashboard" || currentPageName === "FreeClientDashboard";
    if (!isDashboardPage) return;

    console.log("=== DASHBOARD VALIDATION ===");
    console.log("Page:", currentPageName);
    console.log("Has Coach:", user.coach_id ? "Yes" : "No");
    console.log("===========================");

    let shouldRedirect = false;
    let redirectUrl = null;

    if (user.user_type === 'client') {
      // Client WITH coach trying to access FreeClientDashboard
      if (user.coach_id && currentPageName === "FreeClientDashboard") {
        console.log("🔄 Dashboard redirect: Assigned client → ClientDashboard");
        shouldRedirect = true;
        redirectUrl = createPageUrl("ClientDashboard");
      }
      
      // Client WITHOUT coach trying to access ClientDashboard
      if (!user.coach_id && currentPageName === "ClientDashboard") {
        console.log("🔄 Dashboard redirect: Unassigned client → FreeClientDashboard");
        shouldRedirect = true;
        redirectUrl = createPageUrl("FreeClientDashboard");
      }
    }

    if (shouldRedirect && redirectUrl) {
      navigate(redirectUrl, { replace: true });
    }
  }, [currentPageName, user, hasValidated, isLoading, navigate]);

  const handleLogout = () => {
    console.log("🚪 Logging out...");
    setHasValidated(false);
    localStorage.clear();
    sessionStorage.clear();
    
    // Force immediate redirect without waiting for SDK
    window.location.replace(`${window.location.origin}${createPageUrl("Welcome")}?logged_out=true`);
  };

  if (currentPageName === "Welcome" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <style>
          {`
            :root {
              --background: ${isDarkMode ? '0 0% 3.9%' : '0 0% 95%'};
              --foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --card: ${isDarkMode ? '0 0% 3.9%' : '0 0% 100%'};
              --card-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --popover: ${isDarkMode ? '0 0% 3.9%' : '0 0% 100%'};
              --popover-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --primary: 49 39% 56%;
              --primary-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              --secondary: ${isDarkMode ? '0 0% 14.9%' : '0 0% 92%'};
              --secondary-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 9%'};
              --muted: ${isDarkMode ? '0 0% 14.9%' : '0 0% 92%'};
              --muted-foreground: ${isDarkMode ? '0 0% 63.9%' : '0 0% 45.1%'};
              --accent: 49 39% 56%;
              --accent-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              
              --destructive: ${isDarkMode ? '0 62.8% 30.6%' : '0 84.2% 60.2%'};
              --destructive-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              
              --success: ${isDarkMode ? '142 70.6% 21%' : '142.1 76.2% 36.3%'};
              --success-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              
              --warning: ${isDarkMode ? '48 95.8% 29.2%' : '47.9 95.8% 53.1%'};
              --warning-foreground: ${isDarkMode ? '48 95.8% 98%' : '48 95.8% 10%'};

              --border: ${isDarkMode ? '0 0% 25%' : '0 0% 70%'};
              --input: ${isDarkMode ? '0 0% 25%' : '0 0% 70%'};
              --ring: 49 39% 56%;
            }
            
            input, textarea, select {
              color: #000000 !important;
            }
            
            input::placeholder,
            textarea::placeholder {
              color: hsl(var(--muted-foreground));
            }
          `}
        </style>
        {isLoading ?
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#C5B358] border-t-transparent rounded-full animate-spin"></div>
          </div> :
        children}
      </div>);

  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5B358] border-t-transparent rounded-full animate-spin"></div>
      </div>);

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
  { title: "Settings", url: createPageUrl("CoachSettings"), icon: Settings }];


  const clientNavigation = [
    { title: "My Dashboard", url: hasCoach ? createPageUrl("ClientDashboard") : createPageUrl("FreeClientDashboard"), icon: TrendingUp },
    { title: "Coach Chat", url: createPageUrl("ClientChat"), icon: MessageCircle, requiresCoach: true },
    { title: "My Schedule", url: createPageUrl("ClientCalendar"), icon: CalendarDays, requiresCoach: true },
    { title: "My Workouts", url: createPageUrl("MyWorkouts"), icon: Dumbbell },
    { title: "Nutrition Plan", url: createPageUrl("MyNutrition"), icon: Utensils },
    { title: "My Supplements", url: createPageUrl("MySupplements"), icon: Pill },
    { title: "Food Tracker", url: createPageUrl("FoodTracker"), icon: UtensilsCrossed },
    { title: "Check-In Journal", url: createPageUrl("CheckInJournal"), icon: BookOpen },
    { title: "My Progress", url: createPageUrl("MyProgress"), icon: BarChart3 }
  ].filter((item) => {
    // Only filter out items that explicitly require a coach
    if (item.requiresCoach && !hasCoach) {
      return false;
    }
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
              --background: ${isDarkMode ? '0 0% 3.9%' : '0 0% 95%'};
              --foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --card: ${isDarkMode ? '0 0% 3.9%' : '0 0% 100%'};
              --card-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --popover: ${isDarkMode ? '0 0% 3.9%' : '0 0% 100%'};
              --popover-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 3.9%'};
              --primary: 49 39% 56%;
              --primary-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              --secondary: ${isDarkMode ? '0 0% 14.9%' : '0 0% 92%'};
              --secondary-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 9%'};
              --muted: ${isDarkMode ? '0 0% 14.9%' : '0 0% 92%'};
              --muted-foreground: ${isDarkMode ? '0 0% 63.9%' : '0 0% 45.1%'};
              --accent: 49 39% 56%;
              --accent-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              
              --destructive: ${isDarkMode ? '0 62.8% 30.6%' : '0 84.2% 60.2%'};
              --destructive-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              
              --success: ${isDarkMode ? '142 70.6% 21%' : '142.1 76.2% 36.3%'};
              --success-foreground: ${isDarkMode ? '0 0% 98%' : '0 0% 98%'};
              
              --warning: ${isDarkMode ? '48 95.8% 29.2%' : '47.9 95.8% 53.1%'};
              --warning-foreground: ${isDarkMode ? '48 95.8% 98%' : '48 95.8% 10%'};

              --border: ${isDarkMode ? '0 0% 25%' : '0 0% 70%'};
              --input: ${isDarkMode ? '0 0% 25%' : '0 0% 70%'};
              --ring: 49 39% 56%;
            }
            
            input, textarea, select {
              color: #000000 !important;
            }
            
            input::placeholder,
            textarea::placeholder {
              color: hsl(var(--muted-foreground));
            }
          `}
        </style>
        
        <Sidebar className="border-r border-gray-200 bg-gray-100 backdrop-blur-xl">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#C5B358] to-[#A4913C] rounded-xl flex items-center justify-center shadow-lg">
                {user?.user_type === "coach" ? <Crown className="w-6 h-6 text-black" /> : <Zap className="w-6 h-6 text-black" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Level Up</h2>
                <p className="text-xs text-[#C5B358] uppercase tracking-wide">
                  {user?.user_type === "coach" ? "Coach Portal" : "Client Portal"}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider px-2 py-3 text-gray-600">
                {user?.user_type === "coach" ? "Coach Tools" : "My Fitness"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) =>
                  <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                      asChild
                      className={`hover:bg-[#C5B358]/10 hover:text-[#C5B358] transition-all duration-300 rounded-xl mb-2 group ${
                      location.pathname === item.url 
                        ? 'bg-[#C5B358]/20 text-[#C5B358]' 
                        : 'text-gray-700 hover:text-[#C5B358]'
                      }`}>

                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Theme</span>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#C5B358] focus:ring-offset-2 ${
                isDarkMode ? 'bg-gray-700' : 'bg-[#C5B358]'}`
                }>

                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                isDarkMode ? 'translate-x-1' : 'translate-x-6'}`
                } />
                <Sun className={`absolute left-1 top-1 h-4 w-4 transition-opacity duration-300 ${isDarkMode ? 'opacity-0' : 'opacity-100 text-white'}`} />
                <Moon className={`absolute right-1 top-1 h-4 w-4 transition-opacity duration-300 ${isDarkMode ? 'opacity-100 text-gray-400' : 'opacity-0'}`} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                {user?.user_type === "coach" ? <Crown className="w-5 h-5 text-[#C5B358]" /> : <UserIcon className="w-5 h-5 text-gray-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-gray-800">{user?.full_name}</p>
                <p className="text-xs truncate text-gray-600">
                  {user?.user_type === "coach" && coachTierInfo ? coachTierInfo.name : user?.user_type === "client" ? "Elite Member" : "User"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-red-600 hover:bg-red-500/10">

              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className={`${isDarkMode ? 'bg-gray-900/30' : 'bg-white/30'} backdrop-blur-xl border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} px-6 py-4`}>
            <div className="flex items-center gap-4">
              <SidebarTrigger className={`md:hidden ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} p-2 rounded-lg transition-colors duration-200`} />
              <div className="flex items-center gap-2 flex-1">
                <h1 className="text-xl font-bold text-foreground">Level Up</h1>
                <span className="text-xs text-[#C5B358] uppercase tracking-wide">
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
    </SidebarProvider>);

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
    </ErrorBoundary>);

}