
import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast or similar is used for toast messages

import { useUser } from "../components/contexts/UserContext";
import CalendarView from "../components/calendar/CalendarView";

export default function ClientCalendar() {
  const { user } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  // State for events, check-ins, and loading status, replacing useQuery for events
  const [events, setEvents] = useState([]);
  const [checkIns, setCheckIns] = useState([]); // Assuming check-ins are also part of the calendar data
  const [isLoading, setIsLoading] = useState(true);

  // Calculate date range for fetching events
  const dateRange = useMemo(() => {
    const bufferMonths = 1;
    const rangeStart = startOfWeek(startOfMonth(subMonths(currentMonth, bufferMonths)));
    const rangeEnd = endOfWeek(endOfMonth(addMonths(currentMonth, bufferMonths)));

    return {
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString()
    };
  }, [currentMonth]);

  // Function to load calendar data (events and check-ins)
  const loadData = useCallback(async () => {
    if (!user || !user.coach_id) {
      setEvents([]);
      setCheckIns([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Fetch all events and check-ins for the client/coach, then filter and deduplicate client-side
      const [eventsDataRaw, checkInsData] = await Promise.all([
        base44.entities.CalendarEvent.filter({ coach_id: user.coach_id, client_id: user.id }, "start_time"),
        base44.entities.CheckIn.filter({ client_id: user.id }, "-created_date", 10)
      ]);

      // Filter events to only those within our current date range (mimicking original useQuery behavior)
      const rangeStart = new Date(dateRange.start);
      const rangeEnd = new Date(dateRange.end);

      const eventsWithinRange = eventsDataRaw.filter((event) => {
        const eventStart = new Date(event.start_time);
        return eventStart >= rangeStart && eventStart <= rangeEnd;
      });

      // Deduplicate events client-side
      const uniqueEvents = [];
      const seen = new Set();
      
      for (const event of eventsWithinRange) {
        // Create a unique key based on title, coach_id, and start_time (timestamp)
        // This helps identify recurring events that might be duplicated in the raw data
        const key = `${event.title}-${event.coach_id}-${new Date(event.start_time).getTime()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEvents.push(event);
        }
      }
      
      setEvents(uniqueEvents);
      setCheckIns(checkInsData); // Set check-ins state as well
      
      if (uniqueEvents.length !== eventsWithinRange.length) {
        console.warn(`Removed ${eventsWithinRange.length - uniqueEvents.length} duplicate events from calendar view`);
      }
    } catch (error) {
      console.error("Error loading calendar data:", error);
      toast.error("Failed to load calendar data");
      setEvents([]); // Clear events on error
      setCheckIns([]);
    }
    setIsLoading(false);
  }, [user, dateRange]); // Re-run when user or dateRange changes

  // Effect to load data on component mount and when dependencies change
  useEffect(() => {
    loadData();
    // Set up refetch interval, similar to useQuery's refetchInterval
    const interval = setInterval(loadData, 60000); // Refetch every minute for fresh data
    return () => clearInterval(interval); // Clean up interval on unmount
  }, [loadData]); // Only re-run when loadData function itself changes

  // Fetch coach info for display
  const { data: coach } = useQuery({
    queryKey: ['coach', user?.coach_id],
    queryFn: async () => {
      if (!user || !user.coach_id) return null;
      const users = await base44.entities.User.filter({ id: user.coach_id });
      return users.length > 0 ? users[0] : null;
    },
    enabled: !!user && !!user.coach_id,
    staleTime: 10 * 60 * 1000,
  });

  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
  };

  const handleViewChange = (newView) => {
    setCurrentView(newView);
  };

  const handleDayClick = () => {
    // Clients can't create events, so this is a no-op
    // Could show a message like "Contact your coach to schedule a session"
  };

  const handleEventClick = () => {
    // Could open a dialog to show event details
    // For now, just a no-op as clients can't edit events
  };

  return (
    <div className="p-6 md:p-8 space-y-8 h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="w-8 h-8 text-[#C5B358]" />
            <h1 className="text-foreground text-3xl font-bold md:text-4xl">My Schedule</h1>
          </div>
          <p className="text-muted-foreground">
            {coach 
              ? `Your upcoming sessions and events with ${coach.full_name}`
              : "Your upcoming sessions and events"
            }
          </p>
        </div>
      </motion.div>

      {/* Calendar View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-h-0"
      >
        <CalendarView
          events={events} // Use the new state variable for events
          clients={[]} // Clients don't need to see client names
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
          isLoading={isLoading} // Use the new state variable for isLoading
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
          currentView={currentView}
          onViewChange={handleViewChange}
        />
      </motion.div>

      {events.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-8"
        >
          <CalendarDays className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground text-lg">No upcoming events scheduled</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your coach will schedule sessions and check-ins with you
          </p>
        </motion.div>
      )}
    </div>
  );
}
