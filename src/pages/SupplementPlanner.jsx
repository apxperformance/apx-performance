import { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@/entities/User";
import { SupplementPlan } from "@/entities/SupplementPlan";
import { Client } from "@/entities/Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill, Plus, Search, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Components
import SupplementPlanBuilderCard from "../components/supplements/SupplementPlanBuilderCard";
import CreateSupplementPlanDialog from "../components/supplements/CreateSupplementPlanDialog";
import SupplementPlanDetailView from "../components/supplements/SupplementPlanDetailView";
import AssignSupplementPlanDialog from "../components/supplements/AssignSupplementPlanDialog";

export default function SupplementPlanner() {
  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [planToAssign, setPlanToAssign] = useState(null);

  // Handle direct plan ID from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('planId');
    if (planId && plans.length > 0) {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
      }
    }
  }, [plans]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const [planData, clientData] = await Promise.all([
        SupplementPlan.filter({ coach_id: user.id }, "-created_date"),
        Client.filter({ coach_id: user.id })
      ]);
      setPlans(planData);
      setClients(clientData);
    } catch (error) {
      console.error("Error loading supplement planner data:", error);
      toast.error("Failed to load data. Please refresh the page.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePlanCreated = useCallback((newPlan) => {
    setPlans((prevPlans) => [newPlan, ...prevPlans]);
    setIsCreateDialogOpen(false);
    toast.success("Supplement plan created successfully!");
  }, []);

  const handlePlanUpdated = useCallback((updatedPlan) => {
    setPlans((prevPlans) => prevPlans.map((p) => p.id === updatedPlan.id ? updatedPlan : p));
    setSelectedPlan(updatedPlan);
  }, []);

  const handlePlanDeleted = useCallback((planId) => {
    setPlans((prevPlans) => prevPlans.filter((p) => p.id !== planId));
    setSelectedPlan(null);
  }, []);

  const handlePlanDuplicated = useCallback((duplicatedPlan) => {
    setPlans((prevPlans) => [duplicatedPlan, ...prevPlans]);
    toast.success("Plan duplicated successfully!");
  }, []);

  const handleAssignPlan = useCallback((plan) => {
    setPlanToAssign(plan);
    setIsAssignDialogOpen(true);
  }, []);

  const handlePlanAssigned = useCallback(async (planId, clientIds) => {
    if (!clientIds || clientIds.length === 0) {
      toast.error("Please select at least one client.");
      return;
    }

    try {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) {
        toast.error("Plan not found.");
        return;
      }

      const existingPlansPromises = clientIds.map((clientId) =>
        SupplementPlan.filter({ client_id: clientId })
      );
      const existingPlansPerClient = await Promise.all(existingPlansPromises);

      const assignPromises = clientIds.map(async (clientId, index) => {
        const assignedClient = clients.find((c) => c.id === clientId);
        const clientExistingPlans = existingPlansPerClient[index];

        if (clientExistingPlans.length > 0) {
          await Promise.all(
            clientExistingPlans.map((oldPlan) =>
              SupplementPlan.delete(oldPlan.id)
            )
          );
        }

        const newPlan = await SupplementPlan.create({
          name: `${plan.name} - ${assignedClient?.full_name || 'Client'}`,
          description: plan.description,
          supplements: plan.supplements ? JSON.parse(JSON.stringify(plan.supplements)) : [],
          coach_id: plan.coach_id,
          client_id: clientId,
          is_template: false
        });

        const clientRecords = await Client.filter({ id: clientId });
        if (clientRecords.length > 0) {
          await Client.update(clientRecords[0].id, {
            supplement_plan_id: newPlan.id
          });
        }
        return newPlan;
      });

      await Promise.all(assignPromises);
      await loadData();
      setIsAssignDialogOpen(false);
      setPlanToAssign(null);
      toast.success(`Supplement plan assigned to ${clientIds.length} client${clientIds.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error("Error assigning plan:", error);
      toast.error("Failed to assign supplement plan. Please try again.");
    }
  }, [plans, clients, loadData]);

  // --- Filter Logic ---
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [plans, searchTerm]);

  const templatePlans = useMemo(() => {
    return filteredPlans.filter((p) => p.is_template === true && !p.client_id);
  }, [filteredPlans]);

  const clientPlans = useMemo(() => {
    return filteredPlans.filter((p) => p.client_id !== undefined && p.client_id !== null);
  }, [filteredPlans]);

  const uniqueClientsWithPlans = useMemo(() => {
    return new Set(clientPlans.map((p) => p.client_id)).size;
  }, [clientPlans]);

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Pill className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Supplement Planner</h1>
          </div>
          <p className="text-muted-foreground">Design and assign supplement protocols for your clients.</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gray-800 hover:bg-gray-700 text-white font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Button>
      </motion.div>

      {/* Search Bar - Matches Nutrition Planner */}
      <div className="relative max-w-md">
        <Input
          placeholder="Search supplement plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-input text-slate-900 pr-10 px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-[#C5B358]"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats Cards - Matches Nutrition Planner Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Plan Templates</p>
                <p className="text-3xl font-bold text-foreground">{templatePlans.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20 flex items-center justify-center">
                <Pill className="w-6 h-6 text-gray-200" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Clients</p>
                <p className="text-3xl font-bold text-foreground">{clients.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20 flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-200" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients with Plans</p>
                <p className="text-3xl font-bold text-foreground">{uniqueClientsWithPlans}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-200" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Switch */}
      {selectedPlan ? (
        <SupplementPlanDetailView
          plan={selectedPlan}
          clients={clients}
          onBack={() => setSelectedPlan(null)}
          onPlanUpdated={handlePlanUpdated}
          onPlanDeleted={handlePlanDeleted}
          onPlanDuplicated={handlePlanDuplicated}
          onAssignPlan={() => handleAssignPlan(selectedPlan)} 
        />
      ) : (
        <div className="space-y-8">
          {/* Template Plans */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Supplement Plan Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-48 bg-secondary rounded-lg animate-pulse"></div>
                ))
              ) : templatePlans.length > 0 ? (
                templatePlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}>
                    <SupplementPlanBuilderCard
                      plan={plan}
                      onClick={() => setSelectedPlan(plan)}
                      onAssign={() => handleAssignPlan(plan)}
                      isTemplate={true} 
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Pill className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Templates Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first supplement plan template to get started.</p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-semibold">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Plan
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Client Plans */}
          {clientPlans.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Assigned Supplement Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}>
                    <SupplementPlanBuilderCard
                      plan={plan}
                      onClick={() => setSelectedPlan(plan)}
                      client={clients.find((c) => c.id === plan.client_id)}
                      isTemplate={false} 
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateSupplementPlanDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onPlanCreated={handlePlanCreated} 
      />

      <AssignSupplementPlanDialog
        isOpen={isAssignDialogOpen}
        plan={planToAssign}
        clients={clients}
        existingClientPlans={clientPlans}
        onClose={() => {
          setIsAssignDialogOpen(false);
          setPlanToAssign(null);
        }}
        onAssign={handlePlanAssigned} 
      />
    </div>
  );
}