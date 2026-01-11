import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Utensils, Plus, Search, Users, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import NutritionPlanCard from "../components/nutrition/NutritionPlanCard";
import CreateNutritionPlanDialog from "../components/nutrition/CreateNutritionPlanDialog";
import NutritionPlanDetailView from "../components/nutrition/NutritionPlanDetailView";
import AssignNutritionPlanDialog from "../components/nutrition/AssignNutritionPlanDialog";

export default function NutritionPlanner() {
  const [clients, setClients] = useState([]);
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [planToAssign, setPlanToAssign] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [clientData, planData] = await Promise.all([
      base44.entities.Client.filter({ coach_id: user.id }),
      base44.entities.NutritionPlan.filter({ coach_id: user.id }, "-created_date")]
      );

      setClients(clientData);
      setNutritionPlans(planData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load nutrition plans. Please try again.");
    }
    setIsLoading(false);
  };

  const handlePlanCreated = (newPlan) => {
    setNutritionPlans([newPlan, ...nutritionPlans]);
    setIsCreateDialogOpen(false);
  };

  const handlePlanUpdated = (updatedPlan) => {
    setNutritionPlans(nutritionPlans.map((p) => p.id === updatedPlan.id ? updatedPlan : p));
    setSelectedPlan(updatedPlan);
  };

  const handlePlanDeleted = (planId) => {
    setNutritionPlans(nutritionPlans.filter((p) => p.id !== planId));
    setSelectedPlan(null);
  };

  const handleAssignPlan = (plan) => {
    setPlanToAssign(plan);
    setIsAssignDialogOpen(true);
  };

  const handlePlanAssigned = async (planId, clientIds) => {
    if (!clientIds || clientIds.length === 0) {
      toast.error("Please select at least one client.");
      return;
    }

    try {
      const plan = nutritionPlans.find((p) => p.id === planId);
      if (!plan) {
        toast.error("Plan not found.");
        return;
      }

      const assignPromises = clientIds.map((clientId) => {
        const assignedClient = clients.find((c) => c.id === clientId);
        return base44.entities.NutritionPlan.create({
          name: `${plan.name} - ${assignedClient?.full_name || 'Client'}`,
          description: plan.description,
          daily_calories: plan.daily_calories,
          macros: JSON.parse(JSON.stringify(plan.macros || {})),
          meals: JSON.parse(JSON.stringify(plan.meals || [])),
          notes: plan.notes,
          coach_id: plan.coach_id,
          client_id: clientId,
          is_template: false
        });
      });

      await Promise.all(assignPromises);
      await loadData();
      setIsAssignDialogOpen(false);
      setPlanToAssign(null);
      toast.success(`Nutrition plan assigned to ${clientIds.length} client${clientIds.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error("Error assigning plan:", error);
      toast.error("Failed to assign nutrition plan. Please try again.");
    }
  };

  // Memoized filtered plans for better performance
  const filteredPlans = useMemo(() => {
    return nutritionPlans.filter((plan) =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [nutritionPlans, searchTerm]);

  const templatePlans = useMemo(() => {
    return filteredPlans.filter((p) => p.is_template === true && !p.client_id);
  }, [filteredPlans]);

  const clientPlans = useMemo(() => {
    return filteredPlans.filter((p) => p.client_id !== undefined && p.client_id !== null);
  }, [filteredPlans]);

  // Calculate unique clients with plans for more meaningful stat
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
            <Utensils className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Nutrition Planner</h1>
          </div>
          <p className="text-muted-foreground">Create and manage personalized nutrition plans for your clients.</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">

          <Plus className="w-4 h-4 mr-2" />
          Create Nutrition Plan
        </Button>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <Input
          placeholder="Search nutrition plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-input text-slate-900 pr-10 px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-[#C5B358]"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        {searchTerm &&
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">

            <X className="w-4 h-4" />
          </button>
        }
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Plan Templates</p>
                <p className="text-3xl font-bold text-foreground">{templatePlans.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 bg-opacity-20 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-gray-200" />
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
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedPlan ?
      <NutritionPlanDetailView
        plan={selectedPlan}
        clients={clients}
        onBack={() => setSelectedPlan(null)}
        onPlanUpdated={handlePlanUpdated}
        onPlanDeleted={handlePlanDeleted}
        onAssignPlan={() => handleAssignPlan(selectedPlan)} /> :


      <div className="space-y-8">
          {/* Template Plans */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Nutrition Plan Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ?
            Array(6).fill(0).map((_, i) =>
            <div key={i} className="h-48 bg-secondary rounded-lg animate-pulse"></div>
            ) :
            templatePlans.length > 0 ?
            templatePlans.map((plan, index) =>
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}>

                    <NutritionPlanCard
                plan={plan}
                onClick={() => setSelectedPlan(plan)}
                onAssign={() => handleAssignPlan(plan)}
                isTemplate={true} />

                  </motion.div>
            ) :

            <div className="col-span-full text-center py-12">
                  <Utensils className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Templates Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first nutrition plan template to get started.</p>
                  <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">

                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Plan
                  </Button>
                </div>
            }
            </div>
          </div>

          {/* Client Plans */}
          {clientPlans.length > 0 &&
        <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Assigned Nutrition Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientPlans.map((plan, index) =>
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}>

                    <NutritionPlanCard
                plan={plan}
                onClick={() => setSelectedPlan(plan)}
                client={clients.find((c) => c.id === plan.client_id)}
                isTemplate={false} />

                  </motion.div>
            )}
              </div>
            </div>
        }
        </div>
      }

      {/* Dialogs */}
      <CreateNutritionPlanDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onPlanCreated={handlePlanCreated} />


      <AssignNutritionPlanDialog
        isOpen={isAssignDialogOpen}
        plan={planToAssign}
        clients={clients}
        existingClientPlans={clientPlans}
        onClose={() => {
          setIsAssignDialogOpen(false);
          setPlanToAssign(null);
        }}
        onAssign={handlePlanAssigned} />

    </div>);

}