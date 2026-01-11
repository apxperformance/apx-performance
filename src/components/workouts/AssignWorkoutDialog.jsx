import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, UserCheck } from "lucide-react";

export default function AssignWorkoutDialog({ isOpen, workout, clients, onClose, onAssign }) {
  const [selectedClients, setSelectedClients] = useState([]);

  const handleClientToggle = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleAssign = () => {
    if (selectedClients.length > 0 && workout) {
      onAssign(workout.id, selectedClients);
      setSelectedClients([]);
    }
  };

  if (!workout) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-md backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
            <Users className="w-6 h-6 text-gray-600" />
            Assign "{workout.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">Select which clients to assign this workout to:</p>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => handleClientToggle(client.id)}
              >
                <Checkbox 
                  checked={selectedClients.includes(client.id)}
                  onChange={() => handleClientToggle(client.id)}
                />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {client.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{client.full_name}</div>
                    <div className="text-sm text-muted-foreground">{client.email}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {clients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No clients available</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="border-border hover:bg-secondary text-foreground">
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