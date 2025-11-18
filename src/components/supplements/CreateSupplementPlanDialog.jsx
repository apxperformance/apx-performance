import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pill } from "lucide-react";
import { toast } from "sonner";

export default function CreateSupplementPlanDialog({ isOpen, onClose, onPlanCreated, isClientSelfManaged = false }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please enter a plan name");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const user = await base44.auth.me();
      const planData = {
        ...formData,
        supplements: []
      };

      if (isClientSelfManaged) {
        // Client creating their own plan
        planData.client_id = user.id;
        planData.coach_id = user.id; // Self-managed
        planData.is_template = false;
      } else {
        // Coach creating a template
        planData.coach_id = user.id;
        planData.is_template = true;
      }

      const newPlan = await base44.entities.SupplementPlan.create(planData);
      
      onPlanCreated(newPlan);
      setFormData({ name: "", description: "" });
      toast.success("Supplement plan created successfully!");
    } catch (error) {
      console.error("Error creating supplement plan:", error);
      toast.error("Failed to create supplement plan. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border text-card-foreground backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-foreground">
            <Pill className="w-6 h-6 text-[#C5B358]" />
            Create New Supplement Plan
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Plan Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Performance Stack"
              required
              className="bg-input border-border focus:border-[#C5B358] text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the plan's purpose..."
              rows={3}
              className="bg-input border-border focus:border-[#C5B358] resize-none text-slate-900"
            />
          </div>

          <DialogFooter className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-border hover:bg-secondary">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim()}
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
            >
              {isSubmitting ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}