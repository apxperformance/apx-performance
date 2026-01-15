import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Users, TrendingUp, Crown, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Welcome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showPortalChoice, setShowPortalChoice] = useState(false);

  const routeUser = useCallback((user) => {
    // If the user object has no user_type, we MUST show the portal choice.
    if (!user?.user_type) {
      setShowPortalChoice(true);
      setIsLoading(false);
      return;
    }

    // Standard routing for users with a defined role.
    if (user.user_type === "coach") {
      navigate(createPageUrl("CoachDashboard"));
    } else if (user.user_type === "client") {
      if (user.coach_id) {
        navigate(createPageUrl("ClientDashboard"));
      } else {
        navigate(createPageUrl("FreeClientDashboard"));
      }
    } else {
      setShowPortalChoice(true);
      setIsLoading(false);
    }
  }, [navigate]);

  // Process invitation token and link client to coach
  const processInvitationToken = useCallback(async (invitationToken, user) => {
    try {
      console.log("Processing invitation token:", invitationToken);
      const clientInvitations = await base44.entities.Client.filter({ invitation_token: invitationToken, status: 'pending_invitation' });
      
      if (clientInvitations.length > 0) {
        const invitation = clientInvitations[0];
        
        // 1. Set user_type to 'client' if not already set
        if (!user.user_type) {
          await base44.auth.updateMe({ user_type: 'client' });
          user = await base44.auth.me();
        }
        
        // 2. Link client to coach
        if (user.user_type === 'client') {
          if (!user.coach_id || user.coach_id !== invitation.coach_id) {
             await base44.auth.updateMe({ coach_id: invitation.coach_id });
             user = await base44.auth.me();
          }
        }

        // 3. Update Client record
        await base44.entities.Client.update(invitation.id, {
          user_id: user.id,
          status: 'active',
          join_date: new Date().toISOString(),
          invitation_token: null
        });

        localStorage.removeItem('intended_user_type');
        localStorage.removeItem('invitation_token');
        
        user = await base44.auth.me();
        toast.success("Welcome! You've been successfully linked to your coach.");
        routeUser(user);
        return true;
      } else {
        console.warn("Invitation token invalid");
        localStorage.removeItem('invitation_token');
        localStorage.removeItem('intended_user_type');
        toast.error("This invitation link is invalid.");
        return false;
      }
    } catch (inviteError) {
      console.error("Error processing invitation:", inviteError);
      return false;
    }
  }, [routeUser]);

  const checkAuthentication = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const justLoggedOut = urlParams.get('logged_out') === 'true' || urlParams.get('show_portal_choice') === 'true';
      const invitationToken = urlParams.get('invitationToken');

      if (justLoggedOut) {
        window.history.replaceState({}, '', createPageUrl("Welcome"));
        setShowPortalChoice(true);
        setIsLoading(false);
        return;
      }

      // Handle invitation token (User might be logged out initially)
      if (invitationToken) {
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (isAuthenticated) {
            let user = await base44.auth.me();
            const processed = await processInvitationToken(invitationToken, user);
            if (processed) {
               setIsLoading(false);
               return;
            }
        } else {
            // Not authenticated, store token for post-login
            localStorage.setItem('invitation_token', invitationToken);
            localStorage.setItem('intended_user_type', 'client');
            setShowPortalChoice(true);
            setIsLoading(false);
            return;
        }
      }

      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) {
        setShowPortalChoice(true);
        setIsLoading(false);
        return;
      }

      let user = await base44.auth.me();
      
      // --- THE FIX: HANDLE THE RACE CONDITION ---
      const intendedUserType = localStorage.getItem('intended_user_type');
      
      // 1. Check for stored invitation
      const storedInvitationToken = localStorage.getItem('invitation_token');
      if (storedInvitationToken) {
        const processed = await processInvitationToken(storedInvitationToken, user);
        if (processed) {
            setIsLoading(false);
            return;
        }
        localStorage.removeItem('invitation_token');
      }

      // 2. FORCE FIX: If I intended to be a coach, but Layout.js marked me as 'client', fix it.
      if (intendedUserType === 'coach' && user.user_type === 'client') {
          console.log("⚠️ Race condition detected: Correcting User Type to COACH");
          try {
            await base44.auth.updateMe({ user_type: 'coach' });
            user = await base44.auth.me(); // Refresh user data
            toast.success("Coach account initialized successfully.");
          } catch (err) {
            console.error("Failed to correct user type", err);
          }
      }

      // 3. Normal Setup (if user_type is still missing)
      if (intendedUserType && !user.user_type) {
        try {
          await base44.auth.updateMe({ user_type: intendedUserType });
          
          // If intended client without invite, handle pending invites
          if (intendedUserType === 'client') {
            const invitations = await base44.entities.Client.filter({ email: user.email, status: 'pending_invitation' });
            if (invitations.length > 0) {
              const invitation = invitations[0];
              await base44.auth.updateMe({ coach_id: invitation.coach_id });
              await base44.entities.Client.update(invitation.id, { 
                status: 'active', 
                user_id: user.id, 
                join_date: new Date().toISOString(),
                invitation_token: null
              });
            }
          }
          user = await base44.auth.me();
        } catch (updateError) {
          console.error("Error setting user type:", updateError);
        }
      }
      
      // Clear the intent now that we've handled it
      if (intendedUserType) localStorage.removeItem('intended_user_type');

      routeUser(user);
    } catch (error) {
      console.log("Error in checkAuthentication:", error);
      setShowPortalChoice(true);
      setIsLoading(false);
    }
  }, [routeUser, processInvitationToken]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const handleSignIn = async (userType) => {
    try {
      const hasInvitationToken = localStorage.getItem('invitation_token');
      // Always store intent so we can recover from the Layout.js race condition
      if (!hasInvitationToken) {
        localStorage.setItem('intended_user_type', userType);
      }
      const callbackUrl = `${window.location.origin}${createPageUrl("Welcome")}`;
      await base44.auth.redirectToLogin(callbackUrl);
    } catch (error) {
      console.error("Error initiating sign-in:", error);
      alert("Error starting sign-in. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5B358] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showPortalChoice) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-700/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-700/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 min-h-screen flex flex-col">
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="p-6 md:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center shadow-2xl">
                <Dumbbell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Level Up</h1>
                <p className="text-sm text-gray-400 uppercase tracking-wide">Coaching Platform</p>
              </div>
            </div>
          </motion.header>

          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <motion.h2 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
                >
                  Transform Your
                  <span className="block bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent">
                    Fitness Journey
                  </span>
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
                >
                  The elite platform connecting world-class coaches with dedicated clients. 
                  Personalized training, nutrition planning, and progress tracking.
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
              >
                <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800 hover:border-gray-600/50 transition-all duration-500 group">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Crown className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Coach Portal</h3>
                      <p className="text-gray-400 mb-8 leading-relaxed">
                        Manage your clients, create custom workouts, design nutrition plans, 
                        and track progress with professional-grade tools.
                      </p>
                      <Button 
                        onClick={() => handleSignIn("coach")}
                        className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white font-semibold py-3 hover:from-gray-600 hover:to-gray-800 transition-all duration-300 transform hover:scale-105"
                      >
                        Coach Sign In
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800 hover:border-gray-600/50 transition-all duration-500 group">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Zap className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Client Portal</h3>
                      <p className="text-gray-400 mb-8 leading-relaxed">
                        Access your personalized workout routines, nutrition plans, 
                        and communicate with your coach through your dedicated portal.
                      </p>
                      <Button 
                        onClick={() => handleSignIn("client")}
                        variant="outline"
                        className="w-full border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500 font-semibold py-3 transition-all duration-300 transform hover:scale-105"
                      >
                        Client Sign In
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}