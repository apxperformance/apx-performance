
import { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@/entities/User";
import { SupplementPlan } from "@/entities/SupplementPlan";
import { Client } from "@/entities/Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill, Plus, Search, Users, UserCheck, Filter, X, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import SupplementPlanBuilderCard from "../components/supplements/SupplementPlanBuilderCard";
import CreateSupplementPlanDialog from "../components/supplements/CreateSupplementPlanDialog";
import SupplementPlanDetailView from "../components/supplements/SupplementPlanDetailView";
import AssignSupplementPlanDialog from "../components/supplements/AssignSupplementPlanDialog";

export default function SupplementPlanner() {
  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [planToAssign, setPlanToAssign] = useState(null);
  const [filters, setFilters] = useState({
    clientId: 'all',
    planType: 'all'
  });
  const [sortBy, setSortBy] = useState('-created_date'); // newest first by default

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
      const plan = plans.find((p) => p.id === planId); // Using 'plans' state
      if (!plan) {
        toast.error("Plan not found.");
        return;
      }

      // Check which clients already have plans and handle appropriately
      const existingPlansPromises = clientIds.map(clientId =>
        SupplementPlan.filter({ client_id: clientId })
      );
      const existingPlansPerClient = await Promise.all(existingPlansPromises);

      const assignPromises = clientIds.map(async (clientId, index) => {
        const assignedClient = clients.find((c) => c.id === clientId);
        const clientExistingPlans = existingPlansPerClient[index];

        // If client has existing plans, delete them first
        if (clientExistingPlans.length > 0) {
          console.log(`Replacing ${clientExistingPlans.length} existing plan(s) for client ${assignedClient?.full_name || clientId}`);
          await Promise.all(
            clientExistingPlans.map(oldPlan =>
              SupplementPlan.delete(oldPlan.id)
            )
          );
        }

        // Create new plan
        const newPlan = await SupplementPlan.create({
          name: `${plan.name} - ${assignedClient?.full_name || 'Client'}`,
          description: plan.description,
          // Deep clone supplements to avoid reference issues
          supplements: plan.supplements ? JSON.parse(JSON.stringify(plan.supplements)) : [],
          coach_id: plan.coach_id,
          client_id: clientId,
          is_template: false
        });

        // Update Client record with new supplement_plan_id
        const clientRecords = await Client.filter({ id: clientId });
        if (clientRecords.length > 0) {
          // Assuming there's only one client record per ID and we update the first one
          await Client.update(clientRecords[0].id, {
            supplement_plan_id: newPlan.id
          });
        }

        return newPlan;
      });

      await Promise.all(assignPromises);
      await loadData(); // Reload all data after all operations are done
      setIsAssignDialogOpen(false);
      setPlanToAssign(null);
      toast.success(`Supplement plan assigned to ${clientIds.length} client${clientIds.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error("Error assigning plan:", error);
      toast.error("Failed to assign supplement plan. Please try again.");
    }
  }, [plans, clients, loadData]); // Added clients to dependencies as it's used inside

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ clientId: 'all', planType: 'all' });
  };

  const hasActiveFilters = searchTerm !== "" || filters.clientId !== 'all' || filters.planType !== 'all';

  // Memoized filtered and sorted plans
  const filteredAndSortedPlans = useMemo(() => {
    let result = plans.filter((plan) => {
      // Search filter
      const matchesSearch = plan.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      // Client filter
      const matchesClient = filters.clientId === 'all' ||
        (filters.clientId === 'unassigned' && !plan.client_id) ||
        plan.client_id === filters.clientId;

      // Plan type filter
      const matchesPlanType = filters.planType === 'all' ||
        (filters.planType === 'template' && plan.is_template === true) ||
        (filters.planType === 'assigned' && plan.client_id);

      return matchesSearch && matchesClient && matchesPlanType;
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case '-created_date':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'created_date':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'name':
          return a.name.localeCompare(b.name);
        case '-name':
          return b.name.localeCompare(a.name);
        case 'supplements':
          return (a.supplements?.length || 0) - (b.supplements?.length || 0);
        case '-supplements':
          return (b.supplements?.length || 0) - (a.supplements?.length || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [plans, debouncedSearchTerm, filters, sortBy]);

  // Memoized template plans
  const templatePlans = useMemo(() => {
    return filteredAndSortedPlans.filter((p) => p.is_template === true && !p.client_id);
  }, [filteredAndSortedPlans]);

  // Memoized client plans
  const clientPlans = useMemo(() => {
    return filteredAndSortedPlans.filter((p) => p.client_id);
  }, [filteredAndSortedPlans]);

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        <div>
          <div className="flex items-center gap-3 mb-2">
            <Pill className="w-8 h-8 text-[#C5B358]" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Supplement Planner</h1>
          </div>
          <p className="text-muted-foreground">Design and assign supplement protocols for your clients.</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">

          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Button>
      </motion.div>

      {/* Search & Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Input
            placeholder="Search plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input text-slate-900 pr-10 px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-[#C5B358]" />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={`border-border text-foreground hover:bg-secondary ${hasActiveFilters ? "border-[#C5B358] bg-[#C5B358]/10" : ""}`}>
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && <span className="ml-2 bg-[#C5B358] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">•</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-popover border-border backdrop-blur-xl">
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Client</Label>
                <Select value={filters.clientId} onValueChange={(value) => setFilters({ ...filters, clientId: value })}>
                  <SelectTrigger className="bg-input border-border mt-2 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border backdrop-blur-xl">
                    <SelectItem value="all">All Clients</SelectItem>
                    <SelectItem value="unassigned">Unassigned (Templates)</SelectItem>
                    {clients.map((client) =>
                      <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground">Plan Type</Label>
                <Select value={filters.planType} onValueChange={(value) => setFilters({ ...filters, planType: value })}>
                  <SelectTrigger className="bg-input border-border mt-2 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border backdrop-blur-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="template">Templates Only</SelectItem>
                    <SelectItem value="assigned">Assigned Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters &&
                <Button onClick={clearFilters} variant="outline" className="w-full border-border text-foreground hover:bg-secondary">
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              }
            </div>
          </PopoverContent>
        </Popover>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] bg-input border-border text-foreground">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border backdrop-blur-xl">
            <SelectItem value="-created_date">Newest First</SelectItem>
            <SelectItem value="created_date">Oldest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="-name">Name (Z-A)</SelectItem>
            <SelectItem value="-supplements">Most Supplements</SelectItem>
            <SelectItem value="supplements">Least Supplements</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Templates</p>
                <p className="text-3xl font-bold text-foreground">{plans.filter((p) => p.is_template === true && !p.client_id).length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center">
                <Pill className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned Plans</p>
                <p className="text-3xl font-bold text-foreground">{plans.filter((p) => p.client_id).length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Clients</p>
                <p className="text-3xl font-bold text-foreground">{clients.filter((c) => c.status === 'active').length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedPlan ?
        <SupplementPlanDetailView
          plan={selectedPlan}
          clients={clients}
          onBack={() => setSelectedPlan(null)}
          onPlanUpdated={handlePlanUpdated}
          onPlanDeleted={handlePlanDeleted}
          onAssignPlan={() => handleAssignPlan(selectedPlan)}
          onPlanDuplicated={handlePlanDuplicated} /> :


        <div className="space-y-8">
          {/* Template Plans */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Plan Templates
              {templatePlans.length !== plans.filter((p) => p.is_template === true && !p.client_id).length &&
                <span className="text-sm text-muted-foreground ml-2">({templatePlans.length} of {plans.filter((p) => p.is_template === true && !p.client_id).length})</span>
              }
            </h2>
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ?
                  Array(3).fill(0).map((_, i) => <div key={i} className="h-48 bg-secondary rounded-lg animate-pulse"></div>) :
                  templatePlans.length > 0 ?
                    templatePlans.map((plan, index) =>
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        layout>

                        <SupplementPlanBuilderCard
                          plan={plan}
                          onClick={() => setSelectedPlan(plan)}
                          onAssign={() => handleAssignPlan(plan)}
                          isTemplate={true} />

                      </motion.div>
                    ) :

                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <Pill className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <h3 className="text-xl font-semibold text-foreground">
                        {hasActiveFilters ? "No templates match your filters" : "No Templates Yet"}
                      </h3>
                      <p>{hasActiveFilters ? "Try adjusting your search or filters" : "Create your first supplement plan to get started."}</p>
                    </div>
                }
              </div>
            </AnimatePresence>
          </div>

          {/* Assigned Plans */}
          {(clientPlans.length > 0 || hasActiveFilters && !isLoading) &&
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Assigned Plans
                {clientPlans.length !== plans.filter((p) => p.client_id).length &&
                  <span className="text-sm text-muted-foreground ml-2">({clientPlans.length} of {plans.filter((p) => p.client_id).length})</span>
                }
              </h2>
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clientPlans.length > 0 ?
                    clientPlans.map((plan, index) =>
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        layout>

                        <SupplementPlanBuilderCard
                          plan={plan}
                          onClick={() => setSelectedPlan(plan)}
                          client={clients.find((c) => c.id === plan.client_id)}
                          isTemplate={false} />

                      </motion.div>
                    ) :

                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <h3 className="text-xl font-semibold text-foreground">No assigned plans match your filters</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  }
                </div>
              </AnimatePresence>
            </div>
          }
        </div>
      }

      {/* Dialogs */}
      <CreateSupplementPlanDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onPlanCreated={handlePlanCreated} />

      <AssignSupplementPlanDialog
        isOpen={isAssignDialogOpen}
        plan={planToAssign}
        clients={clients}
        onClose={() => {
          setIsAssignDialogOpen(false);
          setPlanToAssign(null);
        }}
        onAssign={handlePlanAssigned} />

    </div>);

}
