
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import SupplementCard from "./SupplementCard";
import ConfirmDialog from "../ui/ConfirmDialog";

export default function ClientSupplementPlanDetailView({ plan, onBack, onPlanUpdated, onPlanDeleted }) {
  const [localPlan, setLocalPlan] = useState({ ...plan });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updatePlan = (field, value) => {
    setLocalPlan(prev => ({ ...prev, [field]: value }));
  };

  const addSupplement = () => {
    const newSupplement = {
      name: "New Supplement",
      dosage: "1 serving",
      timing: "Morning",
      notes: "",
      link: ""
    };
    setLocalPlan(prev => ({
      ...prev,
      supplements: [...(prev.supplements || []), newSupplement]
    }));
  };

  const updateSupplement = (index, updatedSupplement) => {
    const newSupplements = [...localPlan.supplements];
    newSupplements[index] = updatedSupplement;
    setLocalPlan(prev => ({ ...prev, supplements: newSupplements }));
  };

  const removeSupplement = (index) => {
    setLocalPlan(prev => ({
      ...prev,
      supplements: prev.supplements.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!localPlan.name.trim()) {
      toast.error("Plan name is required.");
      return;
    }

    if (!localPlan.supplements || localPlan.supplements.length === 0) {
      toast.error("Please add at least one supplement.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedPlan = await base44.entities.SupplementPlan.update(plan.id, {
        name: localPlan.name,
        description: localPlan.description,
        supplements: localPlan.supplements
      });
      onPlanUpdated(updatedPlan);
      toast.success("Supplement plan updated successfully!");
    } catch (error) {
      console.error("Error updating supplement plan:", error);
      toast.error("Failed to update supplement plan.");
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Step 1: Get current user (assumed to be the client for this view)
      const user = await base44.auth.me();
      const clientId = user.id; // Assuming user.id is the client's ID

      // Step 2: Clear the supplement_plan_id from Client entity if it references this plan
      if (user.coach_id) { // This block executes if the logged-in user (client) has a coach
        try {
          const clientRecords = await base44.entities.Client.filter({ 
            user_id: clientId, // The logged-in user's ID is the client ID
            coach_id: user.coach_id // Filter for the specific client-coach relationship
          });
          
          if (clientRecords.length > 0) {
            // Find the specific client record that references this plan ID
            const relevantClientRecord = clientRecords.find(
              record => record.supplement_plan_id === plan.id
            );

            if (relevantClientRecord) {
              await base44.entities.Client.update(relevantClientRecord.id, {
                supplement_plan_id: null
              });
              console.log("Cleared supplement_plan_id from client record:", relevantClientRecord.id);
            }
          }
        } catch (error) {
          console.warn("Could not update client record (non-critical):", error);
          // Continue with deletion even if this fails
        }
      }
      
      // Step 3: Delete all related compliance records for this client and plan
      try {
        const complianceRecords = await base44.entities.SupplementCompliance.filter({
          client_id: clientId, // Compliance records are tied to the client
          supplement_plan_id: plan.id
        });
        
        if (complianceRecords.length > 0) {
          await Promise.all(
            complianceRecords.map(record => 
              base44.entities.SupplementCompliance.delete(record.id)
            )
          );
          console.log(`Deleted ${complianceRecords.length} compliance records for client ${clientId} and plan ${plan.id}`);
        }
      } catch (error) {
        console.warn("Could not delete compliance records (non-critical):", error);
        // Continue with deletion even if this fails
      }
      
      // Step 4: Delete the supplement plan itself
      await base44.entities.SupplementPlan.delete(plan.id);
      
      // Step 5: Notify parent to update UI
      onPlanDeleted();
      setShowDeleteConfirm(false);
      toast.success("Supplement plan and related data deleted successfully.");
    } catch (error) {
      console.error("Error deleting supplement plan:", error);
      toast.error("Failed to delete supplement plan. Please try again.");
      setShowDeleteConfirm(false); // Ensure dialog closes even on error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="border-border text-foreground hover:bg-secondary">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Edit Supplement Plan</h1>
            <p className="text-muted-foreground">Customize your supplement stack</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !localPlan.supplements || localPlan.supplements.length === 0}
            className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              value={localPlan.name}
              onChange={(e) => updatePlan('name', e.target.value)}
              className="bg-input border-border text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={localPlan.description || ""}
              onChange={(e) => updatePlan('description', e.target.value)}
              rows={3}
              className="bg-input border-border resize-none text-slate-900"
            />
          </div>
        </CardContent>
      </Card>

      {/* Supplements */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Supplements ({localPlan.supplements?.length || 0})</h2>
          <Button
            onClick={addSupplement}
            className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supplement
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {localPlan.supplements?.map((supplement, index) => (
            <SupplementCard
              key={index}
              supplement={supplement}
              variant="editable"
              onUpdate={(updated) => updateSupplement(index, updated)}
              onRemove={() => removeSupplement(index)}
            />
          ))}
        </div>

        {(!localPlan.supplements || localPlan.supplements.length === 0) && (
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-12 text-center">
              <Plus className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Supplements Added</h3>
              <p className="text-muted-foreground mb-4">Start building your supplement stack</p>
              <Button
                onClick={addSupplement}
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Supplement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Supplement Plan?"
        description="This supplement plan will be permanently deleted. This action cannot be undone. Are you sure you want to continue?"
        confirmText="Delete Plan"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
