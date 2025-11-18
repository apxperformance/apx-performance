import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, setHours, setMinutes } from 'date-fns';
import { Calendar, Clock, User } from "lucide-react";

export default function ScheduleCheckInDialog({ isOpen, onClose, clients, onSchedule }) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [scheduleTime, setScheduleTime] = useState(format(setMinutes(setHours(new Date(), 9), 0), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert("Please select a client");
      return;
    }
    onSchedule(selectedClientId, scheduleTime, notes);
  };

  const handleClose = () => {
    setSelectedClientId("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#C5B358]" />
            Schedule Check-In
          </DialogTitle>
          <DialogDescription>
            Schedule a progress check-in session with one of your clients.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="client">Select Client</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Choose a client" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                {clients.filter(c => c.status === 'active').map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {client.full_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduleTime">Date & Time</Label>
            <Input 
              id="scheduleTime"
              type="datetime-local" 
              value={scheduleTime} 
              onChange={(e) => setScheduleTime(e.target.value)} 
              className="bg-gray-800 border-gray-700 focus:border-[#C5B358]" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What specific areas do you want to focus on during this check-in?"
              rows={3}
              className="bg-gray-800 border-gray-700 focus:border-[#C5B358] resize-none"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="border-gray-600 hover:bg-gray-800">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
            >
              <Clock className="w-4 h-4 mr-2" />
              Schedule Check-In
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}