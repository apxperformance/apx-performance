
import { useRef } from 'react'; // useRef is still used for the custom scrollbar, but the currentTimeRef is removed.
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Added for new header description
  DialogFooter, // Added for new footer
} from '@/components/ui/dialog';
import { format, isSameDay } from 'date-fns'; // isSameDay added
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays } from 'lucide-react'; // CalendarDays added
import { Badge } from '@/components/ui/badge'; // Badge added
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const eventTypeColors = {
  session: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  'check-in': 'bg-green-500/20 text-green-300 border border-green-500/30',
  review: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  consultation: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  personal: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
};

const eventTypeLabels = {
  session: 'Session',
  'check-in': 'Check-in',
  review: 'Review',
  consultation: 'Consultation',
  personal: 'Personal',
};

export default function DayDetailModal({ isOpen, onClose, selectedDay, events, clients, onTimeSlotClick, onEventClick }) {
  // scrollContainerRef is still useful if the custom-scrollbar is applied to a ref
  // However, the new structure applies it directly, so it's not strictly needed for the scroll effect.
  // Keeping it just in case for future use or if the styling needs dynamic changes based on ref.
  const scrollContainerRef = useRef(null);

  // Auto-scroll to current time if viewing today logic is removed based on the outline.
  // The user's time zone info is also removed from the display as per the outline.

  if (!selectedDay) return null;

  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), selectedDay));
  const sortedEvents = dayEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Helper to get client info
  const getClientInfo = (clientId) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    if (!client) return null;
    
    return {
      name: client.full_name,
      initials: client.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      image: client.profile_image || null
    };
  };

  // Group events by hour for display
  const eventsByHour = sortedEvents.reduce((acc, event) => {
    const hour = new Date(event.start_time).getHours();
    if (!acc[hour]) {
      acc[hour] = [];
    }
    acc[hour].push(event);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#C5B358]" />
            {format(selectedDay, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            {dayEvents.length === 0 ? 'No events scheduled' : `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''} scheduled`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {sortedEvents.length > 0 ? (
            <div ref={scrollContainerRef} className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #4A5568; border-radius: 4px; border: 2px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #718096; }
              `}</style>
              {Object.entries(eventsByHour).map(([hour, hourEvents]) => (
                <div key={hour} className="flex gap-4">
                  <div className="w-16 text-right shrink-0">
                    <p className="font-bold text-sm text-foreground">{format(new Date().setHours(parseInt(hour), 0), 'h a')}</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {hourEvents.map((event) => {
                      const clientInfo = getClientInfo(event.client_id);
                      return (
                        <div
                          key={event.id}
                          onClick={() => {
                            onClose(); // Close the modal before opening event details
                            onEventClick(event);
                          }}
                          className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-all ${eventTypeColors[event.event_type]}`}>

                          {/* Enhanced event display with avatar */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              {clientInfo && (
                                <Avatar className="w-8 h-8 shrink-0 border border-border">
                                  <AvatarImage src={clientInfo.image} alt={clientInfo.name} />
                                  <AvatarFallback className="text-xs bg-[#C5B358]/20 text-[#C5B358]">
                                    {clientInfo.initials}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{event.title}</p>
                                <p className="text-xs opacity-75 mt-1">
                                  {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                                </p>
                                {clientInfo && <p className="text-xs mt-1 font-medium text-[#C5B358]">{clientInfo.name}</p>}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] capitalize">{eventTypeLabels[event.event_type]}</Badge>
                          </div>
                          {event.description && (
                            <p className="text-xs mt-2 opacity-75 line-clamp-2">{event.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No events scheduled</p>
              <p className="text-sm mt-1">Click below to add your first event for this day</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="outline" onClick={onClose} className="border-border hover:bg-accent">
            Close
          </Button>
          <Button
            onClick={() => {
              onClose(); // Close the modal before navigating to add event
              onTimeSlotClick(selectedDay); // Pass the entire day, as specific time slots are not rendered for empty hours anymore.
            }}
            className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Quick Add Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
