import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarDays, Plus, Info } from "lucide-react";
import { motion } from "framer-motion";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { toast } from "sonner";

import CalendarView from "../components/calendar/CalendarView";
import AddEventDialog from "../components/calendar/AddEventDialog";

export default function CoachingCalendar() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [checkIns, setCheckIns] = useState([]); // Pre-loaded CheckIns
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [linkedCheckIn, setLinkedCheckIn] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  // Calculate date range for fetching events (current view + 1 month buffer on each side)
  const dateRange = useMemo(() => {
    const bufferMonths = 1;
    const rangeStart = startOfWeek(startOfMonth(subMonths(currentMonth, bufferMonths)));
    const rangeEnd = endOfWeek(endOfMonth(addMonths(currentMonth, bufferMonths)));

    return {
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString()
    };
  }, [currentMonth]);

  // Load initial data (user and clients - these don't change often)
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load events and check-ins when date range changes
  useEffect(() => {
    if (user) {
      loadEventsAndCheckInsForRange(dateRange.start, dateRange.end);
    }
  }, [dateRange, user]);

  const loadInitialData = async () => {
   setIsLoading(true);
   try {
     const coach = await base44.auth.me();
     setUser(coach);

     const clientData = await base44.entities.Client.filter({ coach_id: coach.id });
     setClients(clientData);
   } catch (error) {
     console.error("Error loading initial data:", error);
   }
   setIsLoading(false);
  };

  const loadEventsAndCheckInsForRange = async (startDate, endDate) => {
    if (!user) return;

    try {
      // Fetch events and check-ins in parallel for efficiency
      const [allEvents, allCheckIns] = await Promise.all([
      base44.entities.CalendarEvent.filter({ coach_id: user.id }),
      base44.entities.CheckIn.filter({ coach_id: user.id }, "-created_date")]
      );

      // Filter events to only those within our date range
      const filteredEvents = allEvents.filter((event) => {
        const eventStart = new Date(event.start_time);
        return eventStart >= new Date(startDate) && eventStart <= new Date(endDate);
      });

      // Filter check-ins to only those within our date range (by created_date)
      const filteredCheckIns = allCheckIns.filter((checkIn) => {
        const checkInDate = new Date(checkIn.created_date);
        return checkInDate >= new Date(startDate) && checkInDate <= new Date(endDate);
      });

      setEvents(filteredEvents);
      setCheckIns(filteredCheckIns);
    } catch (error) {
      console.error("Error loading events and check-ins:", error);
    }
  };

  const handleEventCreated = async () => {
    setIsAddEventOpen(false);
    setSelectedEvent(null); // Changed from setEditingEvent to setSelectedEvent
    setSelectedDate(null);
    setLinkedCheckIn(null); // Ensure linked check-in is also reset

    // ✅ Refresh events with a slight delay to ensure database consistency
    setTimeout(async () => {
      try {
        const freshEvents = await base44.entities.CalendarEvent.filter({ coach_id: user.id }, "start_time");
        
        // ✅ Deduplicate events client-side as a safety measure
        const uniqueEvents = [];
        const seen = new Set();
        
        for (const event of freshEvents) {
          // Use a key that's unique enough for recurring events that might have same start time but distinct IDs
          // For recurring events, if the backend generates multiple instances with same title/coach/start,
          // this helps deduplicate them if they are truly identical based on these fields.
          const key = `${event.title}-${event.coach_id}-${new Date(event.start_time).getTime()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueEvents.push(event);
          }
        }
        
        // Filter unique events by the current dateRange
        const filteredUniqueEvents = uniqueEvents.filter((event) => {
          const eventStart = new Date(event.start_time);
          const rangeStart = new Date(dateRange.start);
          const rangeEnd = new Date(dateRange.end);
          return eventStart >= rangeStart && eventStart <= rangeEnd;
        });

        setEvents(filteredUniqueEvents);
        

      } catch (error) {
        console.error("Error refreshing events:", error);
        // Fallback to regular load if refresh fails
        loadEventsAndCheckInsForRange(dateRange.start, dateRange.end); // Use existing loader
      }
    }, 500);
  };

  const handleEventSave = async (eventData) => {
    try {
      if (eventData.id) {
        // Update existing event
        await base44.entities.CalendarEvent.update(eventData.id, eventData);
      } else {
        // Create new event
        await base44.entities.CalendarEvent.create({ ...eventData, coach_id: user.id });
      }
      // After save, trigger the refresh and deduplication
      await handleEventCreated();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event. Please try again.");
    }
  };

  const handleEventDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await base44.entities.CalendarEvent.delete(eventId);
        toast.success("Event deleted successfully");
        // After delete, trigger the refresh and deduplication
        await handleEventCreated();
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event. Please try again.");
      }
    }
  };

  const openAddEventDialog = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setLinkedCheckIn(null);
    setIsAddEventOpen(true);
  };

  const openEditEventDialog = (event) => {
    setSelectedEvent(event);
    setSelectedDate(null);

    // If the event is a review, look up the associated check-in from local state
    if (event.check_in_id) {
      const checkIn = checkIns.find((ci) => ci.id === event.check_in_id);
      setLinkedCheckIn(checkIn || null);

      // If not found locally (edge case), fall back to fetching
      if (!checkIn) {
        console.warn("CheckIn not found in local state, fetching from API...");
        base44.entities.CheckIn.filter({ id: event.check_in_id }).
        then((checkInData) => {
          if (checkInData.length > 0) {
            setLinkedCheckIn(checkInData[0]);
            // Optionally add to local state
            setCheckIns((prev) => [...prev, checkInData[0]]);
          }
        }).
        catch((error) => {
          console.error("Error fetching linked check-in:", error);
        });
      }
    } else {
      setLinkedCheckIn(null);
    }

    setIsAddEventOpen(true);
  };

  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
  };

  const handleViewChange = (newView) => {
    setCurrentView(newView);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        <div>
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="w-8 h-8 text-gray-600" />
            <h1 className="text-foreground text-3xl font-bold md:text-4xl">Coaching Calendar</h1>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Manage your sessions, check-ins, and personal events.</p>
            <div className="group relative">
              <Info className="w-4 h-4 text-muted-foreground hover:text-gray-600 cursor-help transition-colors" />
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-72 p-3 bg-popover border border-border rounded-lg shadow-xl z-50">
                <p className="text-xs font-semibold text-gray-600 mb-2">Time Zone Info</p>
                <p className="text-xs text-popover-foreground leading-relaxed mb-2">
                  Your calendar automatically adjusts to your local time zone. When you create an event, 
                  it's stored in UTC and displayed in your current time zone.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold">For clients in different time zones:</span> They will see 
                  all event times converted to their local time zone automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="border-border text-foreground hover:bg-accent cursor-not-allowed opacity-50">
                  <Info className="w-4 h-4 mr-2" />
                  Sync with Google Calendar
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-popover text-popover-foreground border-border">
                <p>Direct Google Calendar sync is not yet available.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={() => openAddEventDialog(new Date())}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold">

            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>
      </motion.div>

      {/* Calendar View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-h-0">

        <CalendarView
          events={events}
          clients={clients}
          onDayClick={openAddEventDialog}
          onEventClick={openEditEventDialog}
          isLoading={isLoading}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
          currentView={currentView}
          onViewChange={handleViewChange} />

      </motion.div>

      <AddEventDialog
        isOpen={isAddEventOpen}
        onClose={() => {
          setIsAddEventOpen(false);
          setSelectedEvent(null);
          setSelectedDate(null);
          setLinkedCheckIn(null);
        }}
        onEventCreated={handleEventCreated}
        selectedDate={selectedDate}
        user={user}
        clients={clients}
        editingEvent={selectedEvent}
        existingEvents={events} />

    </div>
  );
}