
import { useState, useEffect } from "react";
import { SupplementPlan } from "@/entities/SupplementPlan";
import { Client } from "@/entities/Client";
import { User } from "@/entities/User"; // Added User import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pill, Users, Edit, Plus, Trash2, Save, X, Copy, UserX } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import SupplementCard from "./SupplementCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "../ui/ConfirmDialog";

// Constants for common supplements, dosages, and validation
const COMMON_SUPPLEMENTS = [
  "Creatine", "Whey Protein", "Casein Protein", "BCAAs", "EAAs",
  "Fish Oil", "Vitamin D3", "Magnesium", "Zinc", "Multivitamin",
  "Pre-Workout", "Caffeine", "Ashwagandha", "Rhodiola Rosea", "Ginseng",
  "Curcumin", "Probiotics", "Fiber", "Glutamine", "Beta-Alanine",
  "L-Carnitine", "CoQ10", "Alpha-GPC", "Citicoline", "Choline", "Electrolytes",
  "Collagen", "Vitamin C", "Vitamin B Complex", "Iron", "Calcium"
];

const DOSAGE_EXAMPLES = {
  "Creatine": "5g",
  "Whey Protein": "25g-30g",
  "Fish Oil": "2g-4g",
  "Vitamin D3": "2000-5000 IU",
  "Magnesium": "200-400mg",
  "Zinc": "15-30mg",
  "Caffeine": "100-200mg",
  "Ashwagandha": "300-600mg",
  "Probiotics": "10-50 Billion CFUs",
  "Beta-Alanine": "3.2g-6.4g",
  "L-Carnitine": "1-3g",
  "Glutamine": "5-10g",
  "Collagen": "10-20g",
};

// Regex to validate dosage format (e.g., 5g, 10mg, 2 capsules, 1 scoop, 500IU)
// Allows numbers, optional decimal, units (g, mg, mcg, IU, drops, ml, scoop, capsule, tablet, mL, unit, spray, chewable, softgel), and ranges (e.g., 5-10g)
const DOSAGE_PATTERN = /^\s*(\d+(\.\d+)?(-(\d+(\.\d+)?))?\s*(g|mg|mcg|IU|drops?|ml|scoops?|capsules?|tablets?|mL|units?|sprays?|chewables?|softgels?)?)?\s*$/i;

const TIMING_OPTIONS = [
  "Morning", "Pre-Workout", "Post-Workout", "With Meals", 
  "Between Meals", "Before Bed", "As Needed"
];

export default function SupplementPlanDetailView({ plan, clients, onBack, onPlanUpdated, onAssignPlan, onPlanDeleted, onPlanDuplicated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(() => JSON.parse(JSON.stringify(plan)));
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showCustomTimingInput, setShowCustomTimingInput] = useState({});

  useEffect(() => {
    setEditedPlan(JSON.parse(JSON.stringify(plan)));
    setIsEditing(false);
    setValidationErrors([]);
    setShowCustomTimingInput({});
  }, [plan]);

  const handlePlanChange = (field, value) => {
    setEditedPlan({ ...editedPlan, [field]: value });
    setValidationErrors([]);
  };

  const validatePlan = (planData) => {
    const errors = [];

    if (!planData.name || !planData.name.trim()) {
      errors.push("Plan name is required.");
    }

    if (planData.supplements && planData.supplements.length > 0) {
      planData.supplements.forEach((supplement, index) => {
        if (!supplement.name || !supplement.name.trim()) {
          errors.push(`Supplement #${index + 1} needs a name.`);
        }
        if (supplement.link && supplement.link.trim() && !supplement.link.match(/^https?:\/\/.+/)) {
          errors.push(`Supplement #${index + 1} has an invalid link (must start with http:// or https://).`);
        }
        if (supplement.dosage && supplement.dosage.trim() && !DOSAGE_PATTERN.test(supplement.dosage)) {
          errors.push(`Supplement #${index + 1} has an invalid dosage format. E.g., "5g", "2 capsules".`);
        }
      });
    }

    return errors;
  };

  const handleSaveChanges = async () => {
    const errors = validatePlan(editedPlan);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsSaving(true);
    try {
      const planToSave = {
        ...editedPlan,
        supplements: editedPlan.supplements.filter(s => s && s.name && s.name.trim() !== '')
      };
      
      const updatedPlan = await SupplementPlan.update(plan.id, planToSave);
      onPlanUpdated(updatedPlan);
      setIsEditing(false);
      setValidationErrors([]);
      setShowCustomTimingInput({});
      toast.success("Supplement plan saved successfully!");
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPlan(JSON.parse(JSON.stringify(plan)));
    setValidationErrors([]);
    setShowCustomTimingInput({});
  };

  const handleDeletePlan = async () => {
    setIsDeleting(true);
    try {
      await SupplementPlan.delete(plan.id);
      
      // Update client record to remove supplement_plan_id if this was assigned
      if (plan.client_id) {
        try {
          const clientRecords = await Client.filter({ id: plan.client_id });
          if (clientRecords.length > 0) {
            await Client.update(plan.client_id, { supplement_plan_id: null });
          }
        } catch (error) {
          console.error("Error updating client record:", error);
        }
      }
      
      onPlanDeleted(plan.id);
      setShowDeleteConfirm(false);
      toast.success("Supplement plan deleted successfully.");
    } catch (error) {
      console.error("Error deleting supplement plan:", error);
      toast.error("Failed to delete supplement plan. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnassignPlan = async () => {
    setIsUnassigning(true);
    try {
      // Update client record to remove supplement_plan_id
      if (plan.client_id) {
        const clientRecords = await Client.filter({ id: plan.client_id });
        if (clientRecords.length > 0) {
          await Client.update(plan.client_id, { supplement_plan_id: null });
        }
      }
      
      // Delete the assigned plan
      await SupplementPlan.delete(plan.id);
      onPlanDeleted(plan.id);
      setShowUnassignConfirm(false);
      toast.success("Supplement plan unassigned successfully.");
    } catch (error) {
      console.error("Error unassigning supplement plan:", error);
      toast.error("Failed to unassign supplement plan. Please try again.");
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleDuplicatePlan = async () => {
    try {
      const user = await User.me();
      const duplicatedPlan = await SupplementPlan.create({
        ...plan,
        id: undefined, // Will be generated by the database
        name: `${plan.name} (Copy)`,
        coach_id: user.id, // Assign to current coach
        client_id: undefined, // Unassign from any client
        is_template: true, // Make it a template
        created_date: undefined, // Will be generated by the database
        updated_date: undefined // Will be generated by the database
      });
      
      onPlanDuplicated(duplicatedPlan);
      toast.success("Plan duplicated successfully!");
    } catch (error) {
      console.error("Error duplicating plan:", error);
      toast.error("Failed to duplicate plan. Please try again.");
    }
  };

  const handleSupplementChange = (index, field, value) => {
    const newSupplements = [...editedPlan.supplements];
    
    // If changing the name field and autocomplete is being used
    if (field === 'name' && DOSAGE_EXAMPLES[value] && !newSupplements[index].dosage) {
      // Suggest dosage if available and current dosage is empty
      newSupplements[index].dosage = DOSAGE_EXAMPLES[value];
    }
    
    newSupplements[index][field] = value;
    setEditedPlan({ ...editedPlan, supplements: newSupplements });
    setValidationErrors([]);
  };

  const handleAddSupplement = () => {
    setEditedPlan({
      ...editedPlan,
      supplements: [
        ...(editedPlan.supplements || []),
        { name: "", dosage: "", timing: "", notes: "", link: "" }
      ]
    });
  };

  const handleDuplicateSupplement = (index) => {
    const supplementToDuplicate = { ...editedPlan.supplements[index] };
    const newSupplements = [...editedPlan.supplements];
    newSupplements.splice(index + 1, 0, supplementToDuplicate);
    setEditedPlan({ ...editedPlan, supplements: newSupplements });
    toast.success("Supplement duplicated");
  };

  const handleRemoveSupplement = (index) => {
    const newSupplements = editedPlan.supplements.filter((_, i) => i !== index);
    setEditedPlan({ ...editedPlan, supplements: newSupplements });
    toast.success("Supplement removed");
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(editedPlan.supplements);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setEditedPlan({ ...editedPlan, supplements: items });
  };

  const assignedClient = clients.find(c => c.id === plan.client_id);

  const getSupplementErrors = (index) => {
    return validationErrors.filter(error => error.includes(`#${index + 1}`));
  };

  const hasUnsavedChanges = JSON.stringify(editedPlan) !== JSON.stringify(plan);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Assigned Client Banner */}
      {assignedClient && (
        <Card className="bg-gradient-to-r from-[#C5B358]/10 to-[#A4913C]/10 border-[#C5B358]/30 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#C5B358] to-[#A4913C] rounded-full flex items-center justify-center">
                  <span className="text-black font-semibold text-sm">
                    {assignedClient.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned to</p>
                  <p className="font-semibold text-foreground">{assignedClient.full_name}</p>
                </div>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnassignConfirm(true)}
                  className="border-[hsl(var(--destructive))]/50 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Unassign
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div>
            {isEditing ? (
              <Input
                value={editedPlan.name}
                onChange={(e) => handlePlanChange("name", e.target.value)}
                className="text-2xl font-bold bg-input border-border mb-2 focus:border-[#C5B358]"
                placeholder="Plan name..."
              />
            ) : (
              <h1 className="text-3xl font-bold text-foreground">{plan.name}</h1>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleCancelEdit} variant="outline" className="border-border text-foreground hover:bg-secondary">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSaveChanges} 
                disabled={isSaving || validationErrors.length > 0} 
                className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-[hsl(var(--success-foreground))] font-semibold"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleDuplicatePlan}
                variant="outline"
                className="border-border text-foreground hover:bg-secondary hover:border-[#C5B358]"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-border text-foreground hover:bg-secondary hover:border-[#C5B358]"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Plan
              </Button>
              {plan.is_template === true && (
                <Button
                  onClick={() => onAssignPlan(plan)}
                  className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Assign to Client
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="bg-[hsl(var(--destructive))]/10 border-[hsl(var(--destructive))] backdrop-blur-xl">
          <CardContent className="p-4">
            <h4 className="font-semibold text-[hsl(var(--destructive))] mb-2">Please fix the following errors:</h4>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx} className="text-sm text-[hsl(var(--destructive))]">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Plan Info Badges */}
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#C5B358]" />
            Plan Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Badge variant={plan.is_template === true ? "secondary" : "outline"} className={plan.is_template === true ? "bg-secondary/50 text-foreground border-border" : "border-border text-foreground"}>
              {plan.is_template === true ? "Template" : "Assigned"}
            </Badge>
            {assignedClient && (
              <Badge variant="outline" className="flex items-center gap-1 border-border text-foreground">
                <Users className="w-3 h-3" />
                {assignedClient.full_name}
              </Badge>
            )}
            <Badge variant="outline" className="border-border text-foreground">
              {plan.supplements?.length || 0} supplements
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Description & Delete button */}
      <div className="flex gap-4 items-start">
        <Card className="flex-1 bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-4">
            {isEditing ? (
              <Textarea
                value={editedPlan.description}
                onChange={(e) => handlePlanChange('description', e.target.value)}
                placeholder="Add a description for this supplement plan..."
                className="bg-input border-border focus:border-primary resize-none"
              />
            ) : (
              <p className="text-muted-foreground">{editedPlan.description || "No description provided."}</p>
            )}
          </CardContent>
        </Card>
        {isEditing && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Supplements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Supplements</h2>
            {isEditing && (
                 <Button
                    onClick={handleAddSupplement}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Supplement
                </Button>
            )}
        </div>
        {isEditing ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="supplements">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {(editedPlan.supplements || []).map((supplement, index) => {
                    const supplementErrors = getSupplementErrors(index);
                    const hasError = supplementErrors.length > 0;
                    const dosageIsValid = !supplement.dosage || DOSAGE_PATTERN.test(supplement.dosage);
                    
                    return (
                      <Draggable key={`supplement-${index}`} draggableId={`supplement-${index}`} index={index}>
                        {(provided, snapshot) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 bg-secondary/50 rounded-lg space-y-3 ${hasError ? 'border-2 border-destructive' : 'border-border'} ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                                  </svg>
                                </div>
                                <h4 className="text-sm font-medium text-foreground">Supplement #{index + 1}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicateSupplement(index)}
                                  className="text-muted-foreground hover:text-foreground"
                                  title="Duplicate supplement"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveSupplement(index)}
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {hasError && (
                              <div className="text-xs text-destructive">
                                {supplementErrors.map((err, i) => <div key={i}>{err}</div>)}
                              </div>
                            )}
                            <div className="grid md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`supplement-name-${index}`}>Supplement Name *</Label>
                                <Input 
                                  id={`supplement-name-${index}`}
                                  list={`supplements-datalist-${index}`}
                                  placeholder="Start typing..." 
                                  value={supplement.name} 
                                  onChange={(e) => handleSupplementChange(index, "name", e.target.value)} 
                                  className={`bg-input border-input focus:border-primary ${!supplement.name.trim() && validationErrors.length > 0 ? 'border-destructive' : ''}`}
                                />
                                <datalist id={`supplements-datalist-${index}`}>
                                  {COMMON_SUPPLEMENTS.map(supp => (
                                    <option key={supp} value={supp} />
                                  ))}
                                </datalist>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`supplement-dosage-${index}`} className="flex items-center justify-between">
                                  <span>Dosage</span>
                                  {!dosageIsValid && supplement.dosage && (
                                    <span className="text-xs text-[hsl(var(--warning))]">Invalid format</span>
                                  )}
                                </Label>
                                <Input 
                                  id={`supplement-dosage-${index}`}
                                  placeholder="e.g., 5g, 10mg, 2 capsules" 
                                  value={supplement.dosage} 
                                  onChange={(e) => handleSupplementChange(index, "dosage", e.target.value)} 
                                  className={`bg-input border-input focus:border-primary ${!dosageIsValid && supplement.dosage ? 'border-[hsl(var(--warning))]' : ''}`}
                                />
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`supplement-timing-${index}`}>Timing</Label>
                                {showCustomTimingInput[index] ? (
                                  <div className="space-y-2">
                                    <Input
                                      id={`supplement-timing-${index}`}
                                      placeholder="Enter custom timing..."
                                      value={supplement.timing}
                                      onChange={(e) => handleSupplementChange(index, "timing", e.target.value)}
                                      className="bg-input border-input focus:border-primary"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowCustomTimingInput({ ...showCustomTimingInput, [index]: false })}
                                      className="text-xs"
                                    >
                                      Use dropdown
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Select 
                                      value={TIMING_OPTIONS.includes(supplement.timing) ? supplement.timing : ""}
                                      onValueChange={(value) => {
                                        if (value === "custom") {
                                          setShowCustomTimingInput({ ...showCustomTimingInput, [index]: true });
                                        } else {
                                          handleSupplementChange(index, "timing", value);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="bg-input border-input focus:border-primary">
                                        <SelectValue placeholder={supplement.timing && !TIMING_OPTIONS.includes(supplement.timing) ? supplement.timing : "When to take"} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {supplement.timing && !TIMING_OPTIONS.includes(supplement.timing) && (
                                          <SelectItem value={supplement.timing}>{supplement.timing} (Custom)</SelectItem>
                                        )}
                                        {TIMING_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        <SelectItem value="custom">Other (Custom)...</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {supplement.timing && !TIMING_OPTIONS.includes(supplement.timing) && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowCustomTimingInput({ ...showCustomTimingInput, [index]: true })}
                                        className="text-xs"
                                      >
                                        Edit custom timing
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`supplement-link-${index}`}>Product Link</Label>
                                <Input 
                                  id={`supplement-link-${index}`}
                                  placeholder="https://..." 
                                  value={supplement.link} 
                                  onChange={(e) => handleSupplementChange(index, "link", e.target.value)} 
                                  className="bg-input border-input focus:border-primary" 
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`supplement-notes-${index}`}>Notes</Label>
                              <Textarea 
                                id={`supplement-notes-${index}`}
                                placeholder="Special instructions, benefits, etc..." 
                                value={supplement.notes} 
                                onChange={(e) => handleSupplementChange(index, "notes", e.target.value)} 
                                className="bg-input border-input focus:border-primary h-20" 
                              />
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  {(editedPlan.supplements?.length || 0) > 0 && (
                      <Button
                          onClick={handleAddSupplement}
                          variant="outline"
                          className="w-full border-dashed border-muted text-muted-foreground hover:border-primary"
                      >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another Supplement
                      </Button>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : plan.supplements && plan.supplements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.supplements.map((supplement, index) => (
              <SupplementCard key={index} supplement={supplement} variant="coach" />
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 backdrop-blur-xl border-border">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Pill className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Supplements</h3>
              <p>This plan doesn't have any supplements yet. Click 'Edit' to add one.</p>
            </CardContent>
          </Card>
        )}
        
        {(editedPlan.supplements?.length || 0) === 0 && isEditing && (
            <Card className="border-2 border-dashed border-border">
              <CardContent className="text-center py-12">
                <Pill className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No supplements in this plan yet</h3>
                <p className="text-muted-foreground mb-4">Start building your supplement protocol</p>
                <Button onClick={handleAddSupplement} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Supplement
                </Button>
              </CardContent>
            </Card>
        )}
      </div>

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePlan}
        title="Delete Supplement Plan?"
        description="This supplement plan will be permanently deleted. This action cannot be undone. Are you sure you want to continue?"
        confirmText="Delete Plan"
        variant="destructive"
        isLoading={isDeleting}
      />

      {/* Confirmation Dialog for Unassignment */}
      <ConfirmDialog
        isOpen={showUnassignConfirm}
        onClose={() => setShowUnassignConfirm(false)}
        onConfirm={handleUnassignPlan}
        title="Unassign Supplement Plan?"
        description={`This will remove the supplement plan from ${assignedClient?.full_name}. This action cannot be undone.`}
        confirmText="Unassign"
        variant="destructive"
        isLoading={isUnassigning}
      />
    </motion.div>
  );
}
