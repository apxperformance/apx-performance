import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pill, ExternalLink, Clock, FileText, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TIMING_OPTIONS = [
  "Morning", "Pre-Workout", "Post-Workout", "With Meals", 
  "Between Meals", "Before Bed", "As Needed"
];

export default function SupplementCard({ supplement, variant = "client", isEditing = false, onUpdate, onRemove }) {
  const [localSupplement, setLocalSupplement] = useState(supplement);
  const [editMode, setEditMode] = useState(isEditing);
  const [showCustomTimingInput, setShowCustomTimingInput] = useState(false);

  const handleFieldChange = (field, value) => {
    const updated = { ...localSupplement, [field]: value };
    setLocalSupplement(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(localSupplement);
    }
    setEditMode(false);
    toast.success("Supplement updated");
  };

  const handleCancel = () => {
    setLocalSupplement(supplement);
    setEditMode(false);
  };

  // ✅ Client view (read-only)
  if (variant === "client" && !editMode) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-[#C5B358]/50 transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-[#C5B358]" />
              <CardTitle className="text-lg text-foreground">{supplement.name}</CardTitle>
            </div>
            {supplement.link && (
              <a href={supplement.link} target="_blank" rel="noopener noreferrer" className="text-[#C5B358] hover:text-[#D8C67B]">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {supplement.dosage && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#C5B358]/30 text-foreground">
                {supplement.dosage}
              </Badge>
            </div>
          )}
          {supplement.timing && (
            <div className="flex items-start gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{supplement.timing}</span>
            </div>
          )}
          {supplement.notes && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">{supplement.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ✅ Coach view (read-only, part of detail view)
  if (variant === "coach" && !editMode) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-[#C5B358]" />
              <CardTitle className="text-lg text-foreground">{supplement.name}</CardTitle>
            </div>
            {supplement.link && (
              <a href={supplement.link} target="_blank" rel="noopener noreferrer" className="text-[#C5B358] hover:text-[#D8C67B]">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {supplement.dosage && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dosage</p>
              <Badge variant="outline" className="border-[#C5B358]/30 text-foreground">
                {supplement.dosage}
              </Badge>
            </div>
          )}
          {supplement.timing && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Timing</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{supplement.timing}</span>
              </div>
            </div>
          )}
          {supplement.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-muted-foreground">{supplement.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ✅ Editable mode (for client self-managed plans and inline editing)
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#C5B358]" />
            <CardTitle className="text-lg text-foreground">Supplement Details</CardTitle>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supplement-name">Supplement Name *</Label>
          <Input
            id="supplement-name"
            value={localSupplement.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="e.g., Creatine Monohydrate"
            className="bg-input border-border text-slate-900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplement-dosage">Dosage</Label>
          <Input
            id="supplement-dosage"
            value={localSupplement.dosage}
            onChange={(e) => handleFieldChange('dosage', e.target.value)}
            placeholder="e.g., 5g, 2 capsules"
            className="bg-input border-border text-slate-900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplement-timing">Timing</Label>
          {showCustomTimingInput ? (
            <div className="space-y-2">
              <Input
                id="supplement-timing"
                value={localSupplement.timing}
                onChange={(e) => handleFieldChange('timing', e.target.value)}
                placeholder="Enter custom timing..."
                className="bg-input border-border text-slate-900"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomTimingInput(false)}
                className="text-xs"
              >
                Use dropdown
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Select
                value={TIMING_OPTIONS.includes(localSupplement.timing) ? localSupplement.timing : ""}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setShowCustomTimingInput(true);
                  } else {
                    handleFieldChange('timing', value);
                  }
                }}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder={localSupplement.timing && !TIMING_OPTIONS.includes(localSupplement.timing) ? localSupplement.timing : "When to take"} />
                </SelectTrigger>
                <SelectContent>
                  {localSupplement.timing && !TIMING_OPTIONS.includes(localSupplement.timing) && (
                    <SelectItem value={localSupplement.timing}>{localSupplement.timing} (Custom)</SelectItem>
                  )}
                  {TIMING_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  <SelectItem value="custom">Other (Custom)...</SelectItem>
                </SelectContent>
              </Select>
              {localSupplement.timing && !TIMING_OPTIONS.includes(localSupplement.timing) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomTimingInput(true)}
                  className="text-xs"
                >
                  Edit custom timing
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplement-link">Product Link (Optional)</Label>
          <Input
            id="supplement-link"
            value={localSupplement.link}
            onChange={(e) => handleFieldChange('link', e.target.value)}
            placeholder="https://..."
            className="bg-input border-border text-slate-900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplement-notes">Notes (Optional)</Label>
          <Textarea
            id="supplement-notes"
            value={localSupplement.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Special instructions, benefits, etc..."
            className="bg-input border-border text-slate-900 h-20 resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}