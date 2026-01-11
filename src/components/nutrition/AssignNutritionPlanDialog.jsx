import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Utensils, Search, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AssignNutritionPlanDialog({ isOpen, plan, clients, existingClientPlans, onClose, onAssign }) {
  const [selectedClients, setSelectedClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleClientToggle = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    setSelectedClients(filteredClients.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedClients([]);
  };

  const handleAssign = () => {
    if (selectedClients.length > 0 && plan) {
      onAssign(plan.id, selectedClients);
      setSelectedClients([]);
      setSearchTerm("");
    }
  };

  // Filter clients by search term
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.full_name.toLowerCase().includes(lowerCaseSearch) ||
      client.email.toLowerCase().includes(lowerCaseSearch)
    );
  }, [clients, searchTerm]);

  // Check if client already has a nutrition plan
  const clientHasPlan = (clientId) => {
    return existingClientPlans?.some(p => p.client_id === clientId);
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
            <Utensils className="w-6 h-6 text-[#C5B358]" />
            Assign "{plan.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">Select which clients to assign this nutrition plan to:</p>
          
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-input border-border"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Select/Deselect All */}
          {filteredClients.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex-1 border-border hover:bg-accent"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                className="flex-1 border-border hover:bg-accent"
              >
                Deselect All
              </Button>
            </div>
          )}
          
          {/* Client List */}
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {filteredClients.map((client) => {
                const hasExistingPlan = clientHasPlan(client.id);
                return (
                  <div
                    key={client.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleClientToggle(client.id)}
                  >
                    <Checkbox 
                      checked={selectedClients.includes(client.id)}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {client.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{client.full_name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                      </div>
                      {hasExistingPlan && (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Has plan
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No clients found</p>
            </div>
          )}

          {/* Warning for clients with existing plans */}
          {selectedClients.some(id => clientHasPlan(id)) && (
            <div className="p-3 bg-warning/20 border border-warning/30 rounded-lg">
              <p className="text-warning text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Some selected clients already have nutrition plans. Assigning will replace their current plans.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="border-border hover:bg-accent">
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={selectedClients.length === 0}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Assign to {selectedClients.length} Client{selectedClients.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}