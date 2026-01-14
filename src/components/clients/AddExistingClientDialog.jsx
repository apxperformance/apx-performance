import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { Users, Search, UserPlus, AlertCircle, DollarSign, CreditCard } from "lucide-react";

export default function AddExistingClientDialog({ isOpen, onClose, onAddClients, coachId }) {
  const [availableClients, setAvailableClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [hasAgreedToPayment, setHasAgreedToPayment] = useState(false);

  useEffect(() => {
    if (isOpen && coachId) {
      loadAvailableClients();
    }
  }, [isOpen, coachId]);

  useEffect(() => {
    const filtered = availableClients.filter(client => 
      client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.fitness_goals?.some(goal => goal.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredClients(filtered);
  }, [searchTerm, availableClients]);

  const loadAvailableClients = async () => {
    setIsLoading(true);
    setError("");
    try {
      const clientsData = await base44.entities.AvailableClient.list("-date_available");
      // Map the data to flatten the structure for easier access
      const mappedClients = clientsData.map(client => ({
        id: client.id,
        ...client.data
      }));
      setAvailableClients(mappedClients);
    } catch (error) {
      console.error("Error loading available clients:", error);
      setError("Unable to load available clients. Please try again.");
    }
    setIsLoading(false);
  };

  const handleClientToggle = (client, isChecked) => {
    if (isChecked) {
      setSelectedClients([...selectedClients, client]);
    } else {
      setSelectedClients(selectedClients.filter(c => c.id !== client.id));
    }
  };

  const handleInitialSubmit = () => {
    if (selectedClients.length > 0) {
      setShowPaymentConfirmation(true);
    }
  };

  const handleFinalSubmit = async () => {
    if (selectedClients.length > 0 && hasAgreedToPayment) {
      await onAddClients(selectedClients);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedClients([]);
    setSearchTerm("");
    setError("");
    setShowPaymentConfirmation(false);
    setHasAgreedToPayment(false);
    onClose();
  };

  const totalMonthlyCost = selectedClients.length * 5;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-2xl">
        {!showPaymentConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl text-foreground">
                <Users className="w-6 h-6 text-[#C5B358]" />
                Add Existing Clients
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                Select clients from the available pool to add to your roster.
              </p>

              <div className="flex items-center gap-2 p-3 bg-[#C5B358]/10 border border-[#C5B358]/20 rounded-lg">
                <DollarSign className="w-4 h-4 text-[#C5B358]" />
                <div className="text-[#C5B358] text-sm">
                  <span className="font-medium">$5/month per client</span> - billed monthly for each active client
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 bg-input border-border"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-[hsl(var(--destructive))]" />
                  <span className="text-[hsl(var(--destructive))] text-sm">{error}</span>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-[#C5B358] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading available clients...</p>
                </div>
              )}

              {!isLoading && !error && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 cursor-pointer"
                        onClick={() => handleClientToggle(client, !selectedClients.some(c => c.id === client.id))}
                      >
                        <Checkbox 
                          checked={selectedClients.some(c => c.id === client.id)}
                          onCheckedChange={(checked) => handleClientToggle(client, checked)} // Use onCheckedChange for Checkbox
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            {client.profile_image ? (
                              <img src={client.profile_image} alt={client.full_name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span className="text-white font-semibold text-sm">
                                {client.full_name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">{client.full_name || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground truncate">{client.email}</div>
                            {client.fitness_goals && client.fitness_goals.length > 0 && (
                              <div className="text-xs text-muted-foreground truncate">
                                Goals: {client.fitness_goals.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end text-sm">
                            <div className="text-[#C5B358] font-medium">$5/mo</div>
                            {client.experience_level && (
                              <div className="text-muted-foreground text-xs capitalize">{client.experience_level}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No available clients found</p>
                      <p className="text-sm">
                        {searchTerm ? 'Try adjusting your search terms' : 'All clients are currently assigned to coaches'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedClients.length > 0 && (
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">
                      {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-[#C5B358] font-bold">
                      ${totalMonthlyCost}/month
                    </span>
                  </div>
                </div>
              )}
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
                onClick={handleInitialSubmit}
                disabled={selectedClients.length === 0}
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Continue to Payment (${totalMonthlyCost}/mo)
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <CreditCard className="w-6 h-6 text-[#C5B358]" />
                Confirm Monthly Payment
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Please confirm your monthly subscription for the selected clients.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Payment Summary</h3>
                {selectedClients.map((client) => (
                  <div key={client.id} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{client.full_name}</span>
                    <span className="text-foreground">$5.00/month</span>
                  </div>
                ))}
                <div className="border-t border-border pt-3 flex justify-between items-center font-semibold">
                  <span className="text-foreground">Total Monthly Cost:</span>
                  <span className="text-[#C5B358] text-lg">${totalMonthlyCost}.00/month</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 rounded-lg">
                  <h4 className="font-medium text-[hsl(var(--success))] mb-2">Payment Terms</h4>
                  <ul className="text-sm text-foreground space-y-1">
                    <li>• You will be charged ${totalMonthlyCost}/month for {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''}</li>
                    <li>• Billing occurs on the same date each month</li>
                    <li>• You can cancel client subscriptions anytime</li>
                    <li>• Refunds are prorated for unused time</li>
                  </ul>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={hasAgreedToPayment}
                    onCheckedChange={setHasAgreedToPayment}
                    className="mt-1"
                  />
                  <label className="text-sm text-foreground cursor-pointer" onClick={() => setHasAgreedToPayment(!hasAgreedToPayment)}>
                    I agree to pay <span className="font-semibold text-[#C5B358]">${totalMonthlyCost}/month</span> for 
                    the selected {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} and understand 
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
                disabled={!hasAgreedToPayment}
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Confirm & Add Clients
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}