
import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, addDays, startOfDay, addHours, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Grid3X3, List, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import DayDetailModal from './DayDetailModal';

const eventTypeColors = {
  session: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'check-in': 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
  review: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
  consultation: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
  personal: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30'
};

const eventTypeLabels = {
  session: 'Session',
  'check-in': 'Check-in',
  review: 'Review',
  consultation: 'Consultation',
  personal: 'Personal'
};

export default function CalendarView({
  events,
  clients,
  onDayClick,
  onEventClick,
  isLoading,
  currentMonth,
  onMonthChange,
  currentView,
  onViewChange
}) {
  const [view, setView] = useState(currentView || 'month');
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  // Get user's time zone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneAbbr = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2];

  useEffect(() => {
    if (currentView && view !== currentView) {
      setView(currentView);
    }
  }, [currentView, view]);

  // Helper to get client info including avatar
  const getClientInfo = (clientId) => {
    if (!clientId) return null;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return null;

    return {
      name: client.full_name,
      initials: client.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      image: client.profile_image || null
    };
  };

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleMonthChange(
            view === 'day' ? addDays(currentMonth, -1) :
            view === 'week' ? addDays(currentMonth, -7) :
            subMonths(currentMonth, 1)
          );
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleMonthChange(
            view === 'day' ? addDays(currentMonth, 1) :
            view === 'week' ? addDays(currentMonth, 7) :
            addMonths(currentMonth, 1)
          );
          break;
        case 't':
        case 'T':
          e.preventDefault();
          handleMonthChange(new Date());
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          handleViewChange('month');
          break;
        case 'w':
        case 'W':
          e.preventDefault();
          handleViewChange('week');
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          handleViewChange('day');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, currentMonth]);

  const handleViewChange = (newView) => {
    setView(newView);
    if (onViewChange) {
      onViewChange(newView);
    }
  };

  const handleMonthChange = (newMonth) => {
    if (onMonthChange) {
      onMonthChange(newMonth);
    }
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setIsDayModalOpen(true);
  };

  const handleTimeSlotClick = (dateTime) => {
    setIsDayModalOpen(false);
    onDayClick(dateTime);
  };

  // Filter and validate events
  const validatedEvents = useMemo(() => {
    const viewStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const viewEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

    return events.filter((event) => {
      const eventStartTime = new Date(event.start_time);
      const eventEndTime = new Date(event.end_time);

      if (isNaN(eventStartTime.getTime()) || isNaN(eventEndTime.getTime())) {
        console.warn('Skipping event due to invalid start_time or end_time:', event);
        return false;
      }

      const eventIsVisible = eventStartTime < viewEnd && eventEndTime > viewStart;
      return eventIsVisible;
    });
  }, [events, currentMonth]);

  // Detect conflicts
  const eventsWithConflicts = useMemo(() => {
    const eventsToCheck = [...validatedEvents];

    eventsToCheck.forEach((eventA) => {
      eventA.hasConflict = false;
    });

    const eventsByDay = new Map();
    eventsToCheck.forEach((event) => {
      const dayKey = format(new Date(event.start_time), 'yyyy-MM-dd');
      if (!eventsByDay.has(dayKey)) {
        eventsByDay.set(dayKey, []);
      }
      eventsByDay.get(dayKey).push(event);
    });

    eventsByDay.forEach((dayEvents) => {
      dayEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      for (let i = 0; i < dayEvents.length; i++) {
        for (let j = i + 1; j < dayEvents.length; j++) {
          const eventA = dayEvents[i];
          const eventB = dayEvents[j];

          const startA = new Date(eventA.start_time);
          const endA = new Date(eventA.end_time);
          const startB = new Date(eventB.start_time);
          const endB = new Date(eventB.end_time);

          if (startA < endB && endA > startB) {
            eventA.hasConflict = true;
            eventB.hasConflict = true;
          }
        }
      }
    });

    return eventsToCheck;
  }, [validatedEvents]);

  // Calculate event positions for overlapping events
  const calculateEventPositions = (dayEvents) => {
    if (dayEvents.length === 0) return [];

    const sortedEvents = [...dayEvents].sort((a, b) => {
      const startDiff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      if (startDiff !== 0) return startDiff;

      const durationA = new Date(a.end_time).getTime() - new Date(a.start_time).getTime();
      const durationB = new Date(b.end_time).getTime() - new Date(b.start_time).getTime();
      return durationB - durationA;
    });

    const columns = [];
    const eventPositions = new Map();

    sortedEvents.forEach((event) => {
      const eventStart = new Date(event.start_time).getTime();
      const eventEnd = new Date(event.end_time).getTime();

      let columnIndex = 0;
      let placed = false;

      while (!placed) {
        if (!columns[columnIndex]) {
          columns[columnIndex] = [];
        }

        const overlaps = columns[columnIndex].some((colEvent) => {
          const colStart = new Date(colEvent.start_time).getTime();
          const colEnd = new Date(colEvent.end_time).getTime();
          return eventStart < colEnd && eventEnd > colStart;
        });

        if (!overlaps) {
          columns[columnIndex].push(event);
          placed = true;
        } else {
          columnIndex++;
        }
      }

      let maxColumns = columnIndex + 1;
      for (let i = 0; i < columns.length; i++) {
        const hasOverlap = columns[i].some((colEvent) => {
          const colStart = new Date(colEvent.start_time).getTime();
          const colEnd = new Date(colEvent.end_time).getTime();
          return eventStart < colEnd && eventEnd > colStart;
        });
        if (hasOverlap) {
          maxColumns = Math.max(maxColumns, i + 1);
        }
      }

      eventPositions.set(event.id, {
        column: columnIndex,
        totalColumns: maxColumns
      });
    });

    sortedEvents.forEach((event) => {
      const pos = eventPositions.get(event.id);
      const eventStart = new Date(event.start_time).getTime();
      const eventEnd = new Date(event.end_time).getTime();

      let maxColsInGroup = pos.totalColumns;

      sortedEvents.forEach((otherEvent) => {
        if (event.id === otherEvent.id) return;

        const otherStart = new Date(otherEvent.start_time).getTime();
        const otherEnd = new Date(otherEvent.end_time).getTime();

        if (eventStart < otherEnd && eventEnd > otherStart) {
          const otherPos = eventPositions.get(otherEvent.id);
          maxColsInGroup = Math.max(maxColsInGroup, otherPos.totalColumns);
        }
      });

      eventPositions.set(event.id, {
        ...pos,
        totalColumns: maxColsInGroup
      });
    });

    return sortedEvents.map((event) => ({
      ...event,
      position: eventPositions.get(event.id)
    }));
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {view === 'month' && format(currentMonth, 'MMMM yyyy')}
              {view === 'week' && `Week of ${format(startOfWeek(currentMonth, { weekStartsOn: 0 }), 'MMM d, yyyy')}`}
              {view === 'day' && format(currentMonth, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {userTimeZone} ({timeZoneAbbr})
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('month')} className="bg-gray-600 text-gray-50 px-3 text-sm font-medium rounded-md inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 hover:bg-[#A4913C]"

              title="Month view (M)">
              <Calendar className="w-4 h-4 mr-1" />
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('week')}
              className={view === 'week' ? 'bg-[#C5B358] text-black hover:bg-[#A4913C]' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
              title="Week view (W)">
              <Grid3X3 className="w-4 h-4 mr-1" />
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('day')}
              className={view === 'day' ? 'bg-[#C5B358] text-black hover:bg-[#A4913C]' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
              title="Day view (D)">
              <List className="w-4 h-4 mr-1" />
              Day
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMonthChange(
              view === 'day' ? addDays(currentMonth, -1) :
              view === 'week' ? addDays(currentMonth, -7) :
              subMonths(currentMonth, 1)
            )}
            title="Previous (←)"
            className="hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMonthChange(new Date())}
            className="border-border text-foreground hover:bg-accent hover:border-[#C5B358] transition-all"
            title="Go to today (T)">
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMonthChange(
              view === 'day' ? addDays(currentMonth, 1) :
              view === 'week' ? addDays(currentMonth, 7) :
              addMonths(currentMonth, 1)
            )}
            title="Next (→)"
            className="hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>);

  };

  // Memoized Month View - only recalculates when dependencies change
  const monthViewContent = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    let days = eachDayOfInterval({ start: startDate, end: endOfWeek(monthEnd, { weekStartsOn: 0 }) });

    // Ensure we always have 6 weeks for a consistent grid layout
    if (days.length < 42) {
      const lastDay = days[days.length - 1];
      days = [...days, ...Array.from({ length: 42 - days.length }, (_, i) => addDays(lastDay, i + 1))];
    }

    const daysHeader =
    <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground border-b border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) =>
      <div key={day} className="py-2 border-r border-border last:border-r-0">{day}</div>
      )}
      </div>;



    return (
      <div className="flex-1 flex flex-col">
        {daysHeader}
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {days.map((day) => {
            const dayEvents = eventsWithConflicts.filter((e) => isSameDay(new Date(e.start_time), day));
            const visibleEvents = dayEvents.slice(0, 2);
            const remainingCount = dayEvents.length - 2;

            return (
              <div
                key={day.toString()}
                className={`relative flex flex-col p-2 border-b border-r border-border group transition-colors duration-200 cursor-pointer hover:bg-accent/30 ${
                !isSameMonth(day, monthStart) ? 'bg-muted/40 text-muted-foreground' : 'bg-card text-foreground'} ${
                isToday(day) ? 'bg-[#C5B358]/10' : ''}`}
                onClick={() => handleDayClick(day)}>

                <span className={`mb-1 text-sm font-medium ${isToday(day) ? 'text-[#C5B358]' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </span>
                <div className="flex-1 space-y-1 overflow-hidden">
                  {visibleEvents.map((event) => {
                    const clientInfo = getClientInfo(event.client_id);
                    const eventTime = format(new Date(event.start_time), 'h:mm a');

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {e.stopPropagation();onEventClick(event);}}
                        onMouseEnter={() => setHoveredEvent(event.id)}
                        onMouseLeave={() => setHoveredEvent(null)}
                        className={`relative p-1.5 rounded-md text-xs cursor-pointer hover:opacity-90 transition-all border ${eventTypeColors[event.event_type]} hover:scale-[1.02] ${event.hasConflict ? 'border-red-500 ring-1 ring-red-500' : ''}`}>

                        {/* Enhanced event display with avatar */}
                        <div className="flex items-start gap-1.5">
                          {clientInfo &&
                          <Avatar className="w-5 h-5 shrink-0 border border-border/50">
                              <AvatarImage src={clientInfo.image} alt={clientInfo.name} />
                              <AvatarFallback className="text-[8px] bg-[#C5B358]/20 text-[#C5B358]">
                                {clientInfo.initials}
                              </AvatarFallback>
                            </Avatar>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-xs leading-tight">{event.title}</p>
                            <p className="text-[10px] opacity-75 truncate leading-tight">
                              {eventTime}
                              {clientInfo && ` • ${clientInfo.name}`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Enhanced hover tooltip with avatar */}
                        {hoveredEvent === event.id &&
                        <div className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg p-3 shadow-xl min-w-[200px] max-w-[280px]">
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                {clientInfo &&
                              <Avatar className="w-8 h-8 shrink-0 border border-border">
                                    <AvatarImage src={clientInfo.image} alt={clientInfo.name} />
                                    <AvatarFallback className="text-xs bg-[#C5B358]/20 text-[#C5B358]">
                                      {clientInfo.initials}
                                    </AvatarFallback>
                                  </Avatar>
                              }
                                <div className="flex-1">
                                  <p className="font-semibold text-popover-foreground text-sm">{event.title}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{eventTypeLabels[event.event_type]}</p>
                                  {event.hasConflict && <p className="text-xs text-red-500 font-medium mt-0.5">Time Conflict Detected</p>}
                                </div>
                              </div>
                              <div className="text-xs text-popover-foreground">
                                <p>{format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}</p>
                                {clientInfo && <p className="text-[#C5B358] font-medium">{clientInfo.name}</p>}
                              </div>
                              {event.description &&
                            <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                            }
                              <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-border">
                                Click to view details
                              </p>
                            </div>
                          </div>
                        }
                      </div>);

                  })}
                  
                  {remainingCount > 0 &&
                  <button
                    onClick={(e) => {e.stopPropagation();handleDayClick(day);}}
                    className="w-full text-left px-1.5 py-1 rounded-md text-xs text-muted-foreground hover:text-[#C5B358] hover:bg-accent/50 transition-colors font-medium">

                      + {remainingCount} more event{remainingCount !== 1 ? 's' : ''}
                    </button>
                  }
                  
                  {/* Empty day hint */}
                  {dayEvents.length === 0 &&
                  <div
                    onClick={(e) => {e.stopPropagation();handleDayClick(day);}} // Explicitly allow click for empty day to open modal
                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] text-muted-foreground italic py-2 text-center">

                      Click to add event
                    </div>
                  }
                </div>
              </div>);

          })}
        </div>
      </div>);

  }, [currentMonth, eventsWithConflicts, clients, onEventClick, hoveredEvent, getClientInfo]);

  // Memoized Time Grid - shared by Week and Day views
  const renderTimeGrid = useMemo(() => {
    return (daysInView) => {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const now = new Date();

      return (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr] md:grid-cols-[4rem_1fr]">
            <div className="p-2 text-center text-xs font-medium text-muted-foreground"></div>
            <div className={`grid grid-cols-${daysInView.length}`}>
              {daysInView.map((day) =>
              <div key={day.toString()} className={`p-2 text-center border-l border-border ${isToday(day) ? 'bg-[#C5B358]/10' : ''}`}>
                  <div className="text-xs font-medium text-muted-foreground">{format(day, 'EEE')}</div>
                  <div className={`text-lg font-bold ${isToday(day) ? 'text-[#C5B358]' : 'text-foreground'}`}>{format(day, 'd')}`</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Time slots */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="grid grid-cols-[auto_1fr] md:grid-cols-[4rem_1fr]">
              {/* Time labels */}
              <div className="flex flex-col">
                {hours.map((hour) =>
                <div key={hour} className="h-[60px] p-2 text-xs text-muted-foreground border-r border-border text-center relative -top-3">
                    {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                  </div>
                )}
              </div>
              
              {/* Grid background */}
              <div className={`grid grid-cols-${daysInView.length} flex-1`}>
                {daysInView.map((day) =>
                <div key={day.toString()} className="border-l border-border">
                    {hours.map((hour) =>
                  <div
                    key={hour}
                    className="h-[60px] border-t border-border/50 hover:bg-accent/30 cursor-pointer transition-colors"
                    onClick={() => handleTimeSlotClick(addHours(startOfDay(day), hour))} />

                  )}
                  </div>
                )}
              </div>

              {/* Events Overlay */}
              <div className={`absolute top-0 left-0 right-0 bottom-0 grid grid-cols-[auto_1fr] md:grid-cols-[4rem_1fr] pointer-events-none`}>
                <div></div>
                <div className={`grid grid-cols-${daysInView.length} flex-1`}>
                  {daysInView.map((day, dayIndex) => {
                    const dayEvents = eventsWithConflicts.filter((e) => isSameDay(new Date(e.start_time), day));
                    const positionedEvents = calculateEventPositions(dayEvents);

                    return (
                      <div key={day.toString()} className="relative border-l border-border">
                        {positionedEvents.map((event) => {
                          const start = new Date(event.start_time);
                          const end = new Date(event.end_time);
                          const startMinutesOfDay = start.getHours() * 60 + start.getMinutes();
                          const eventDurationMinutes = (end.getTime() - start.getTime()) / 60000;

                          const topPosition = startMinutesOfDay;
                          const eventHeight = Math.max(30, eventDurationMinutes);

                          const clientInfo = getClientInfo(event.client_id);

                          // Calculate width and left position based on overlaps
                          const position = event.position || { column: 0, totalColumns: 1 };
                          const widthPercent = 100 / position.totalColumns;
                          const leftPercent = position.column * widthPercent;

                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {e.stopPropagation();onEventClick(event);}}
                              className={`absolute p-2 rounded-lg cursor-pointer hover:opacity-80 hover:z-20 transition-all text-xs pointer-events-auto ${eventTypeColors[event.event_type]} ${event.hasConflict ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                              style={{
                                top: `${topPosition}px`,
                                height: `${eventHeight}px`,
                                left: `${leftPercent}%`,
                                width: `calc(${widthPercent}% - 0.25rem)`,
                                minWidth: '60px'
                              }}>

                              {/* Enhanced event display with avatar for time grid */}
                              <div className="flex items-start gap-1.5">
                                {clientInfo && eventHeight > 35 &&
                                <Avatar className="w-5 h-5 shrink-0 border border-border/50">
                                    <AvatarImage src={clientInfo.image} alt={clientInfo.name} />
                                    <AvatarFallback className="text-[8px] bg-[#C5B358]/20 text-[#C5B358]">
                                      {clientInfo.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                }
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate text-xs leading-tight">{event.title}</p>
                                  {clientInfo && <p className="truncate opacity-75 text-[10px] leading-tight">{clientInfo.name}</p>}
                                  {eventHeight > 45 &&
                                  <p className="text-[10px] opacity-60 mt-1">
                                      {format(start, 'h:mm a')}
                                    </p>
                                  }
                                </div>
                              </div>
                            </div>);

                        })}
                      </div>);

                  })}
                </div>
              </div>
              
              {/* Current Time Indicator */}
              {daysInView.some((day) => isToday(day)) &&
              <div
                className="absolute h-0.5 bg-red-500 z-10 grid grid-cols-[auto_1fr] md:grid-cols-[4rem_1fr] w-full pointer-events-none"
                style={{ top: `${now.getHours() * 60 + now.getMinutes()}px` }}>

                  <div></div>
                  <div className="relative">
                    <div className="absolute -left-1.5 -top-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>);

    };
  }, [eventsWithConflicts, clients, onEventClick, handleTimeSlotClick, getClientInfo]);

  // Memoized Week View
  const weekViewContent = useMemo(() => {
    const weekStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return renderTimeGrid(weekDays);
  }, [currentMonth, renderTimeGrid]);

  // Memoized Day View
  const dayViewContent = useMemo(() => {
    return renderTimeGrid([currentMonth]);
  }, [currentMonth, renderTimeGrid]);

  if (isLoading) {
    return (
      <div className="h-full bg-card/50 border border-border rounded-lg flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#C5B358] border-t-transparent rounded-full animate-spin"></div>
          </div>);

  }

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border rounded-lg h-full flex flex-col">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: hsl(var(--muted-foreground) / 0.3); border-radius: 4px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: hsl(var(--muted-foreground) / 0.5); }
      `}</style>
      {renderHeader()}
      {view === 'month' && monthViewContent}
      {view === 'week' && weekViewContent}
      {view === 'day' && dayViewContent}
      
      <DayDetailModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        selectedDay={selectedDay}
        events={eventsWithConflicts} // Pass expanded and validated events here
        clients={clients}
        onTimeSlotClick={handleTimeSlotClick}
        onEventClick={onEventClick} />

      
      {/* Keyboard shortcuts hint */}
      <div className="px-4 py-2 border-t border-border bg-card/30 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Shortcuts:</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">→</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">T</kbd>
            Today
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">M</kbd>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">W</kbd>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">D</kbd>
            Views
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground group relative cursor-help">
          <Globe className="w-3 h-3" />
          <span className="text-[10px]">Times in {timeZoneAbbr}</span>
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-56 p-2.5 bg-popover border border-border rounded-lg shadow-xl z-50">
            <p className="text-xs text-popover-foreground">
              All times are displayed in your local time zone: <span className="font-semibold text-[#C5B358]">{userTimeZone}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              Events are stored in UTC and automatically converted for display.
            </p>
          </div>
        </div>
      </div>
    </div>);

}