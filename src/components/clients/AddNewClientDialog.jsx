import React from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, User, Mail, Phone, DollarSign, CreditCard, Send } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function AddNewClientDialog({ isOpen, onClose, onAddClient }) {
  const [showPaymentConfirmation, setShowPaymentConfirmation] = React.useState(false);
  const [hasAgreedToPayment, setHasAgreedToPayment] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, formState: { errors, isValid }, reset, getValues } = useForm({
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: ""
    }
  });

  const handleInitialSubmit = () => {
    if (isValid) {
      setShowPaymentConfirmation(true);
    }
  };

  const handleFinalSubmit = async () => {
    if (hasAgreedToPayment) {
      setIsSubmitting(true);
      try {
        const formData = getValues();
        // Delegate all backend logic (client creation + email) to parent handler
        await onAddClient(formData);
        handleClose();
      } catch (error) {
        console.error("Error adding client:", error);
        toast.error("Failed to add client. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setShowPaymentConfirmation(false);
    setHasAgreedToPayment(false);
    onClose();
  };

  const formData = getValues();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-card-foreground">
        {!showPaymentConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <UserPlus className="w-6 h-6 text-[#C5B358]" />
                Add New Client
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new client to your roster. An invitation email will be sent for them to create their account.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleInitialSubmit)}>
              <div className="space-y-6 py-6">
                <div className="flex items-center gap-2 p-3 bg-[#C5B358]/10 border border-[#C5B358]/20 rounded-lg">
                  <DollarSign className="w-4 h-4 text-[#C5B358]" />
                  <div className="text-[#C5B358] text-sm">
                    <span className="font-medium">$5/month per client</span> - billed monthly for each active client
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-muted-foreground">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="first_name"
                        placeholder="e.g., John"
                        {...register("first_name", { 
                          required: "First name is required",
                          minLength: { value: 2, message: "First name must be at least 2 characters" }
                        })}
                        className="pl-10 bg-input border-border focus:border-[#C5B358]"
                      />
                    </div>
                    {errors.first_name && (
                      <p className="text-red-500 text-xs">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-muted-foreground">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="last_name"
                        placeholder="e.g., Doe"
                        {...register("last_name", { 
                          required: "Last name is required",
                          minLength: { value: 2, message: "Last name must be at least 2 characters" }
                        })}
                        className="pl-10 bg-input border-border focus:border-[#C5B358]"
                      />
                    </div>
                    {errors.last_name && (
                      <p className="text-red-500 text-xs">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g., john.doe@example.com"
                      {...register("email", { 
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      className="pl-10 bg-input border-border focus:border-[#C5B358]"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs">{errors.email.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    An invitation email will be sent to this address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-muted-foreground">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g., (555) 123-4567"
                      {...register("phone", {
                        pattern: {
                          value: /^[\d\s\-\(\)\+]+$/,
                          message: "Invalid phone number format"
                        }
                      })}
                      className="pl-10 bg-input border-border focus:border-[#C5B358]"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-border pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose} 
                  className="border-border hover:bg-secondary"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!isValid}
                  className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Continue to Payment ($5/mo)
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <CreditCard className="w-6 h-6 text-[#C5B358]" />
                Confirm Monthly Payment
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Please confirm your monthly subscription for this new client.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground">New Client</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#C5B358] to-[#A4913C] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {formData.first_name} {formData.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">{formData.email}</div>
                    {formData.phone && (
                      <div className="text-sm text-muted-foreground">{formData.phone}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Payment Summary</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{formData.first_name} {formData.last_name}</span>
                  <span className="text-foreground">$5.00/month</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-center font-semibold">
                  <span className="text-foreground">Total Monthly Cost:</span>
                  <span className="text-[#C5B358] text-lg">$5.00/month</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 rounded-lg">
                  <h4 className="font-medium text-[hsl(var(--success))] mb-2">What Happens Next</h4>
                  <ul className="text-sm text-foreground space-y-1">
                    <li>• An invitation email will be sent to {formData.email}</li>
                    <li>• Client will create their account using the invitation link</li>
                    <li>• Once they sign up, they'll be automatically linked to you</li>
                    <li>• Billing starts when the client account becomes active</li>
                    <li>• You can cancel subscriptions anytime</li>
                  </ul>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={hasAgreedToPayment}
                    onCheckedChange={setHasAgreedToPayment}
                    className="mt-1"
                  />
                  <label className="text-sm text-foreground cursor-pointer" onClick={() => setHasAgreedToPayment(!hasAgreedToPayment)}>
                    I agree to pay <span className="font-semibold text-[#C5B358]">$5/month</span> for 
                    {formData.first_name} {formData.last_name} once they complete registration, and I understand 
                    that this is a recurring monthly subscription.
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPaymentConfirmation(false)} 
                className="border-border hover:bg-secondary"
              >
                Back
              </Button>
              <Button 
                onClick={handleFinalSubmit}
                disabled={!hasAgreedToPayment || isSubmitting}
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Sending..." : "Send Invitation & Confirm"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}