
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { PenSquare } from "lucide-react";
import { toast } from "sonner";

import ImageUploader from "./ImageUploader";

export default function CheckInForm({ user, onSubmitSuccess, submitMutation }) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, watch } = useForm({
    defaultValues: {
      weight: "",
      sleep_hours: "",
      notes: "",
      energy_level: 5,
      stress_level: 5,
      measurements: { chest: "", waist: "", hips: "", arms: "", thighs: "" },
      progress_photos: []
    }
  });

  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [files, setFiles] = React.useState([]);

  const energyLevel = watch("energy_level");
  const stressLevel = watch("stress_level");

  const onSubmit = async (data) => {
    if (!user) {
      toast.error("User not found. Please refresh.");
      return;
    }
    setUploadProgress(0);

    let uploadedFileUrls = [];

    try {
      // 1. Upload images concurrently with progress tracking
      let progress_photos = [];
      
      if (files.length > 0) {
        const totalFiles = files.length;
        let completedFiles = 0;

        const uploadPromises = files.map(async (file) => {
          try {
            const result = await base44.integrations.Core.UploadFile({ file });
            completedFiles++;
            const currentProgress = Math.round((completedFiles / totalFiles) * 100);
            setUploadProgress(currentProgress);
            return result.file_url;
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            toast.error(`Failed to upload ${file.name}`);
            throw error; // Re-throw to ensure Promise.all catches it and stops submission
          }
        });

        progress_photos = await Promise.all(uploadPromises);
        uploadedFileUrls = [...progress_photos];
      }

      // Determine coach_id: use user's coach or their own ID if self-managed
      const effectiveCoachId = user.coach_id || user.id;

      // 2. Prepare data for CheckIn entity
      const checkInData = {
        client_id: user.id,
        coach_id: effectiveCoachId,
        energy_level: data.energy_level, // Already a number from slider
        stress_level: data.stress_level, // Already a number from slider
        weight: parseFloat(data.weight) || 0,
        sleep_hours: parseFloat(data.sleep_hours) || 0,
        notes: data.notes,
        measurements: Object.entries(data.measurements).reduce((acc, [key, val]) => {
          acc[key] = parseFloat(val) || 0;
          return acc;
        }, {}),
        progress_photos: uploadedFileUrls,
      };

      let newCheckInRecord; // Variable to hold the created check-in record

      // 3. Use the mutation if provided, otherwise create the CheckIn entity directly
      if (submitMutation) {
        newCheckInRecord = await submitMutation.mutateAsync(checkInData);
      } else {
        newCheckInRecord = await base44.entities.CheckIn.create(checkInData);
      }

      // ✅ Update client's last_checkin timestamp
      try {
        // Find the client record for the user, regardless of whether they have a coach
        const clientRecords = await base44.entities.Client.filter({
          user_id: user.id
        });

        if (clientRecords.length > 0) {
          const clientRecord = clientRecords[0];
          await base44.entities.Client.update(clientRecord.id, {
            last_checkin: new Date().toISOString() // Use current time for last check-in
          });
          console.log("Client's last_checkin updated successfully.");
        } else {
          console.log("No client record found for user_id:", user.id, "- skipping last_checkin update.");
        }
      } catch (clientUpdateError) {
        // Don't fail the entire check-in if client update fails
        console.error("Error updating client's last check-in timestamp:", clientUpdateError);
      }

      // ✅ Update user's current_weight in User entity
      if (data.weight) { // Only update if weight was provided
        try {
          await base44.auth.updateMe({
            current_weight: parseFloat(data.weight)
          });
          console.log("User's current_weight updated successfully.");
        } catch (weightUpdateError) {
          console.error("Error updating user's current_weight:", weightUpdateError);
          // Don't fail the entire check-in if user weight update fails
        }
      }

      // 4. Reset form on success
      reset();
      setFiles([]);
      setUploadProgress(0);
      toast.success("Check-in submitted successfully!");
      onSubmitSuccess();

    } catch (err) {
      console.error("Failed to submit check-in:", err);
      
      if (uploadedFileUrls.length > 0) {
        toast.error("Check-in submission failed. Cleaning up uploaded files...");
        
        try {
          // Note: The Core.UploadFile integration uploads to public storage.
          // Public files can't be deleted via API for security reasons.
          // However, we can at least log this for monitoring.
          console.warn("Orphaned files (cannot auto-delete public files):", uploadedFileUrls);
          
          // For future enhancement: If files were uploaded to private storage,
          // we could delete them here using base44.integrations.Core.DeleteFile()
          
          toast.error("Failed to submit check-in. Please try again.", {
            description: err.message || "Your photos were uploaded but the check-in wasn't saved. Please contact support if this persists.",
            duration: 6000
          });
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError);
          toast.error("Failed to submit check-in. Please try again.", {
            description: err.message || "An error occurred during submission, and cleanup failed. Please contact support.",
            duration: 6000
          });
        }
      } else {
        toast.error("Failed to submit check-in. Please try again.", {
          description: err.message || "Unknown error occurred",
          duration: 5000
        });
      }
      setUploadProgress(0); // Ensure progress is reset even if no files were uploaded but an error occurred
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <PenSquare className="w-6 h-6 text-[#C5B358]" />
          New Weekly Check-In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight" className="text-muted-foreground">
                Weight (lbs) <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="weight" 
                type="number" 
                step="0.1"
                {...register("weight", { 
                  required: "Weight is required",
                  min: { value: 50, message: "Weight must be at least 50 lbs" },
                  max: { value: 1000, message: "Weight must be less than 1000 lbs" }
                })}
                disabled={isSubmitting}
                className="bg-input border-border focus:border-[#C5B358]"
              />
              {errors.weight && (
                <p className="text-red-500 text-xs mt-1">{errors.weight.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="sleep_hours" className="text-muted-foreground">Sleep (hours)</Label>
              <Input 
                id="sleep_hours" 
                type="number" 
                step="0.5"
                {...register("sleep_hours", {
                  min: { value: 0, message: "Sleep must be positive" },
                  max: { value: 24, message: "Sleep must be 24 hours or less" }
                })}
                disabled={isSubmitting}
                className="bg-input border-border focus:border-[#C5B358]"
              />
              {errors.sleep_hours && (
                <p className="text-red-500 text-xs mt-1">{errors.sleep_hours.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Energy Level: {energyLevel}</Label>
            <Controller
              name="energy_level"
              control={control}
              render={({ field }) => (
                <Slider 
                  value={[field.value]}
                  onValueChange={(val) => field.onChange(val[0])}
                  min={1} 
                  max={10} 
                  step={1}
                  disabled={isSubmitting}
                  className="mt-2"
                />
              )}
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Stress Level: {stressLevel}</Label>
            <Controller
              name="stress_level"
              control={control}
              render={({ field }) => (
                <Slider 
                  value={[field.value]}
                  onValueChange={(val) => field.onChange(val[0])}
                  min={1} 
                  max={10} 
                  step={1}
                  disabled={isSubmitting}
                  className="mt-2"
                />
              )}
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Measurements (inches)</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Input 
                placeholder="Chest" 
                type="number" 
                step="0.1" 
                {...register("measurements.chest")}
                disabled={isSubmitting}
                className="bg-input border-border focus:border-[#C5B358]"
              />
              <Input 
                placeholder="Waist" 
                type="number" 
                step="0.1" 
                {...register("measurements.waist")}
                disabled={isSubmitting}
                className="bg-input border-border focus:border-[#C5B358]"
              />
              <Input 
                placeholder="Hips" 
                type="number" 
                step="0.1" 
                {...register("measurements.hips")}
                disabled={isSubmitting}
                className="bg-input border-border focus:border-[#C5B358]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input 
                placeholder="Arms" 
                type="number" 
                step="0.1" 
                {...register("measurements.arms")}
                disabled={isSubmitting}
                className="bg-input border-border focus:border-[#C5B358]"
              />
              <Input 
                placeholder="Thighs" 
                type="number" 
                step="0.1" 
                {...register("measurements.thighs")}
                disabled={isSubmitting}
                className="bg-input border-border focus:border-[#C5B358]"
              />
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Progress Photos</Label>
            <ImageUploader 
              files={files} 
              setFiles={setFiles} 
              isUploading={isSubmitting} // isSubmitting also covers the photo upload phase
              uploadProgress={uploadProgress}
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Notes for your coach</Label>
            <Textarea 
              {...register("notes")}
              placeholder="How was your week? Any challenges or wins?"
              disabled={isSubmitting}
              className="bg-input border-border focus:border-[#C5B358] resize-none"
              rows={4}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
          >
            {isSubmitting ? `Submitting... ${uploadProgress > 0 ? `(${uploadProgress}%)` : ''}` : "Submit Check-In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
