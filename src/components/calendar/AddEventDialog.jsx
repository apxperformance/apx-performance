import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { format, addMinutes, addDays, addWeeks, addMonths, isBefore, isAfter } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarPlus, Save, Clock, AlertTriangle, Repeat, Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client'; // Fixed import path

const LinkedCheckInView = ({ checkIn }) => {
    if (!checkIn) return null;
    return (
        <div className="mt-4 p-3 bg-secondary/50 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-[#C5B358]">Linked Check-in Details</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <p><span className="text-muted-foreground">Weight:</span> {checkIn.weight} lbs</p>
                <p><span className="text-muted-foreground">Energy:</span> {checkIn.energy_level}/10</p>
                <p><span className="text-muted-foreground">Sleep:</span> {checkIn.sleep_hours}h</p>
                <p><span className="text-muted-foreground">Stress:</span> {checkIn.stress_level}/10</p>
            </div>
            {checkIn.notes && <p className="text-xs italic text-foreground/80">"{checkIn.notes}"</p>}
        </div>
    );
};

const ConflictWarning = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/30 rounded-lg p-4 space-y-2">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[hsl(var(--warning))] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-[hsl(var(--warning))] text-sm mb-2">
            Scheduling Conflict Detected
          </h4>
          <p className="text-xs text-[hsl(var(--warning))]/80 mb-3">
            This event overlaps with {conflicts.length} existing event{conflicts.length > 1 ? 's' : ''}:
          </p>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="bg-card/50 rounded-md p-2 text-xs">
                <p className="font-medium text-foreground">{conflict.title}</p>
                <p className="text-muted-foreground">
                  {format(new Date(conflict.start_time), 'h:mm a')} - {format(new Date(conflict.end_time), 'h:mm a')}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[hsl(var(--warning))]/70 mt-3 italic">
            You can still create this event, but you may want to adjust the time.
          </p>
        </div>
      </div>
    </div>
  );
};

const TimeValidationError = ({ startTime, endTime }) => {
  if (!startTime || !endTime) return null;

  const start = new Date(startTime);
  const end = new Date(endTime);
  
  let error = null;
  
  if (!isAfter(end, start)) {
    error = {
      type: 'order',
      message: 'End time must be after start time',
      icon: <AlertTriangle className="w-4 h-4" />
    };
  } else {
    const durationMinutes = (end - start) / (1000 * 60);
    
    if (durationMinutes < 15) {
      error = {
        type: 'tooShort',
        message: 'Event must be at least 15 minutes long',
        icon: <Clock className="w-4 h-4" />
      };
    } else if (durationMinutes > 1440) {
      error = {
        type: 'tooLong',
        message: 'Event cannot be longer than 24 hours',
        icon: <Clock className="w-4 h-4" />
      };
    }
  }

  if (!error) return null;

  return (
    <div className="bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30 rounded-lg p-3 flex items-start gap-2">
      <div className="text-[hsl(var(--destructive))] mt-0.5">
        {error.icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[hsl(var(--destructive))]">{error.message}</p>
        {error.type === 'order' && (
          <p className="text-xs text-[hsl(var(--destructive))]/70 mt-1">
            The event cannot end before it starts. Please adjust the times.
          </p>
        )}
        {error.type === 'tooShort' && (
          <p className="text-xs text-[hsl(var(--destructive))]/70 mt-1">
            Current duration: {Math.round((end - start) / (1000 * 60))} minutes. Minimum: 15 minutes.
          </p>
        )}
        {error.type === 'tooLong' && (
          <p className="text-xs text-[hsl(var(--destructive))]/70 mt-1">
            Current duration: {Math.round((end - start) / (1000 * 60 * 60))} hours. Maximum: 24 hours.
          </p>
        )}
      </div>
    </div>
  );
};

export default function AddEventDialog({ 
  isOpen, 
  onClose, 
  selectedDate, 
  user, 
  clients, 
  onEventCreated, 
  editingEvent, 
  existingEvents = [] 
}) {

  // Helper to get initial 9 AM for a given date or today
  const getInitial9AMDate = (dateParam) => {
    const d = dateParam ? new Date(dateParam) : new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  };

  const initialDateForNewEvent = getInitial9AMDate(selectedDate);

  const defaultValuesForForm = {
    title: editingEvent?.title || "",
    description: editingEvent?.description || "",
    start_time: editingEvent?.start_time ? new Date(editingEvent.start_time) : initialDateForNewEvent,
    end_time: editingEvent?.end_time ? new Date(editingEvent.end_time) : addMinutes(editingEvent?.start_time ? new Date(editingEvent.start_time) : initialDateForNewEvent, 60),
    client_id: editingEvent?.client_id || "",
    event_type: editingEvent?.event_type || "session",
    is_recurring: false,
    recurrence_pattern: "weekly",
    recurrence_interval: 1,
    recurrence_count: 4, // New field for recurring events
    check_in_id: editingEvent?.check_in_id || null, // Handle check-in id directly from editingEvent
  };

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm({
    defaultValues: defaultValuesForForm
  });

  const [conflicts, setConflicts] = useState([]);
  const [isRecurring, setIsRecurring] = useState(false);

  const startTime = watch("start_time");
  const endTime = watch("end_time");
  const clientId = watch("client_id");
  const recurrencePattern = watch("recurrence_pattern");
  const recurrenceInterval = watch("recurrence_interval");
  const recurrenceCount = watch("recurrence_count"); // New watch variable

  // Validate time order and duration
  const timeValidation = useMemo(() => {
    if (!startTime || !endTime) {
      return { isValid: false, error: null };
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!isAfter(end, start)) {
      return { 
        isValid: false, 
        error: 'End time must be after start time' 
      };
    }

    const durationMinutes = (end - start) / (1000 * 60);

    if (durationMinutes < 15) {
      return { 
        isValid: false, 
        error: 'Event must be at least 15 minutes long' 
      };
    }

    if (durationMinutes > 1440) {
      return { 
        isValid: false, 
        error: 'Event cannot be longer than 24 hours' 
      };
    }

    return { isValid: true, error: null, durationMinutes };
  }, [startTime, endTime]);

  // Show duration info when valid
  const durationDisplay = useMemo(() => {
    if (!timeValidation.isValid || !timeValidation.durationMinutes) return null;

    const minutes = timeValidation.durationMinutes;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${remainingMinutes}m`;
    }
  }, [timeValidation]);

  // Detect conflicts whenever times or client changes
  useEffect(() => {
    if (!isOpen || !startTime || !endTime || !timeValidation.isValid) {
      setConflicts([]);
      return;
    }

    const detectConflicts = () => {
      const start = new Date(startTime);
      const end = new Date(endTime);

      const conflictingEvents = existingEvents.filter(existing => {
        // Skip the event being edited
        if (editingEvent?.id && existing.id === editingEvent.id) return false;

        // Only check for same client or coach's personal events
        if (clientId && existing.client_id !== clientId) return false;
        if (!clientId && existing.client_id) return false;

        const existingStart = new Date(existing.start_time);
        const existingEnd = new Date(existing.end_time);

        // Check for overlap
        return (
          (start >= existingStart && start < existingEnd) ||
          (end > existingStart && end <= existingEnd) ||
          (start <= existingStart && end >= existingEnd)
        );
      });

      setConflicts(conflictingEvents);
    };

    detectConflicts();
  }, [startTime, endTime, clientId, existingEvents, editingEvent?.id, isOpen, timeValidation.isValid]);

  useEffect(() => {
    const newInitialDateForNewEvent = getInitial9AMDate(selectedDate);
    
    const newDefaultStartTime = editingEvent?.start_time 
      ? new Date(editingEvent.start_time)
      : newInitialDateForNewEvent;

    const newDefaultEndTime = editingEvent?.end_time
      ? new Date(editingEvent.end_time)
      : addMinutes(editingEvent?.start_time ? new Date(editingEvent.start_time) : newInitialDateForNewEvent, 60);

    reset({
      title: editingEvent?.title || "",
      description: editingEvent?.description || "",
      start_time: newDefaultStartTime,
      end_time: newDefaultEndTime,
      client_id: editingEvent?.client_id || "",
      event_type: editingEvent?.event_type || "session",
      is_recurring: false,
      recurrence_pattern: "weekly",
      recurrence_interval: 1,
      recurrence_count: 4, // Reset recurrence count
      check_in_id: editingEvent?.check_in_id || null,
    });
    
    setIsRecurring(false);
    setConflicts([]);
  }, [editingEvent, selectedDate, reset]);

  // Calculate how many events will be created for recurring (for display)
  const recurringEventCountDisplay = useMemo(() => {
    if (!isRecurring) return 0;

    const currentCount = parseInt(recurrenceCount);
    return isNaN(currentCount) || currentCount <= 0 ? 0 : currentCount;
  }, [isRecurring, recurrenceCount]);

  const onSubmit = async (data) => {
    if (!user) {
      toast.error("User not found");
      return;
    }

    // CRITICAL: Comprehensive validation before submission
    if (!timeValidation.isValid) {
      toast.error("Invalid event times", {
        description: timeValidation.error,
        duration: 4000
      });
      return;
    }

    // If recurring, validate recurrence fields
    if (isRecurring && !editingEvent) { // Recurring applies only to new events
        if (!data.recurrence_count || parseInt(data.recurrence_count) <= 0) {
            toast.error("Number of occurrences must be a positive number.");
            return;
        }
        if (recurringEventCountDisplay > 52) { // Using the display value for prompt
            const confirm = window.confirm(
                `This will create ${recurringEventCountDisplay} events. This may take a moment. Continue?`
            );
            if (!confirm) return;
        }
    }

    // Show warning if there are conflicts but allow to continue
    if (conflicts.length > 0 && !editingEvent?.id) {
      const confirmWithConflict = window.confirm(
        `This event conflicts with ${conflicts.length} existing event(s). Do you want to create it anyway?`
      );
      if (!confirmWithConflict) return;
    }

    try {
      const startDateTime = new Date(data.start_time);
      const endDateTime = new Date(data.end_time);

      const baseEventData = {
        title: data.title,
        description: data.description || "",
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        coach_id: user.id,
        client_id: data.client_id && data.client_id !== "" ? data.client_id : null,
        event_type: data.event_type,
        check_in_id: data.check_in_id || null,
      };

      if (editingEvent) {
        // Update existing event
        await base44.entities.CalendarEvent.update(editingEvent.id, baseEventData);
        toast.success("Event updated successfully");
      } else if (data.is_recurring) {
        // Create recurring events with duplicate prevention
        const recurrenceIterations = parseInt(data.recurrence_count) || 4;
        const pattern = data.recurrence_pattern;

        // Fetch existing events to check for duplicates
        // Filter by coach_id for relevance
        const allExistingEvents = await base44.entities.CalendarEvent.filter({
          coach_id: user.id
        });

        const eventsToCreate = [];
        const duplicates = [];
        
        for (let i = 0; i < recurrenceIterations; i++) {
          let occurrenceStart = new Date(startDateTime);
          let occurrenceEnd = new Date(endDateTime);

          // Calculate occurrence date based on pattern
          if (pattern === 'daily') {
            occurrenceStart = addDays(occurrenceStart, i * data.recurrence_interval);
            occurrenceEnd = addDays(occurrenceEnd, i * data.recurrence_interval);
          } else if (pattern === 'weekly') {
            occurrenceStart = addWeeks(occurrenceStart, i * data.recurrence_interval);
            occurrenceEnd = addWeeks(occurrenceEnd, i * data.recurrence_interval);
          } else if (pattern === 'monthly') {
            occurrenceStart = addMonths(occurrenceStart, i * data.recurrence_interval);
            occurrenceEnd = addMonths(occurrenceEnd, i * data.recurrence_interval);
          }

          const eventData = {
            ...baseEventData,
            start_time: occurrenceStart.toISOString(),
            end_time: occurrenceEnd.toISOString(),
            is_recurring: true,
            recurrence_pattern: pattern,
            recurrence_interval: data.recurrence_interval,
          };

          // Check for duplicate events (same title, start time, coach)
          const isDuplicate = allExistingEvents.some(existing => 
            existing.title === eventData.title &&
            existing.coach_id === eventData.coach_id &&
            Math.abs(new Date(existing.start_time).getTime() - new Date(eventData.start_time).getTime()) < 60000 // Within 1 minute
          );

          if (isDuplicate) {
            duplicates.push(format(occurrenceStart, 'MMM d, yyyy h:mm a'));
          } else {
            eventsToCreate.push(eventData);
          }
        }

        // Create only non-duplicate events
        if (eventsToCreate.length > 0) {
          await base44.entities.CalendarEvent.bulkCreate(eventsToCreate);
          
          let message = `${eventsToCreate.length} recurring event${eventsToCreate.length > 1 ? 's' : ''} created successfully`;
          
          if (duplicates.length > 0) {
            message += `. Skipped ${duplicates.length} duplicate${duplicates.length > 1 ? 's' : ''} (${duplicates.slice(0, 2).join(', ')}${duplicates.length > 2 ? '...' : ''})`;
            toast.success(message, { duration: 5000 });
          } else {
            toast.success(message);
          }
        } else {
          toast.warning("All intended recurring events already exist. No new events created.");
          onClose();
          return;
        }
      } else {
        // Create single event with duplicate check
        const allExistingEvents = await base44.entities.CalendarEvent.filter({
          coach_id: user.id
        });

        const isDuplicate = allExistingEvents.some(existing => 
          existing.title === baseEventData.title &&
          existing.coach_id === baseEventData.coach_id &&
          Math.abs(new Date(existing.start_time).getTime() - new Date(baseEventData.start_time).getTime()) < 60000
        );

        if (isDuplicate) {
          toast.error("An identical event already exists at this time.");
          return;
        }

        // Use backend function for proper client lookup and notification
        const createCalendarEvent = (await import('@/functions/createCalendarEvent')).default;
        await createCalendarEvent(baseEventData);
        toast.success("Event created successfully");
      }
      
      onEventCreated(); // Call the new callback for event creation/update
      reset();
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event. Please try again.");
    }
  };

  const handleClose = () => {
    reset();
    setIsRecurring(false);
    setConflicts([]);
    onClose();
  };

  // The handleDelete function and corresponding delete button are removed
  // as the 'onDelete' prop is no longer passed to the component.

  // Automatic end time adjustment when start time changes
  useEffect(() => {
    if (startTime && !editingEvent?.id) {
      // Only auto-adjust for new events
      const newEndTime = addMinutes(new Date(startTime), 60);
      if (!endTime || isBefore(new Date(endTime), new Date(startTime))) {
        setValue('end_time', newEndTime);
      }
    }
  }, [startTime, editingEvent?.id, setValue, endTime]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CalendarPlus className="w-6 h-6 text-[#C5B358]" />
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogDescription>
            {editingEvent ? 'Update the details for your event.' : 'Add a new event to your calendar.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* LinkedCheckInView is removed because the `linkedCheckIn` prop is no longer provided */}

          {/* Time Validation Error Display */}
          <TimeValidationError startTime={startTime} endTime={endTime} />

          {/* Conflict Warning */}
          {conflicts.length > 0 && <ConflictWarning conflicts={conflicts} />}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-muted-foreground">
              Event Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Training Session with John"
              {...register("title", { 
                required: "Event title is required",
                minLength: { value: 3, message: "Title must be at least 3 characters" }
              })}
              disabled={isSubmitting}
              className={`bg-input border-border focus:border-[#C5B358] ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type" className="text-muted-foreground">Event Type</Label>
            <Controller
              name="event_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="session">Training Session</SelectItem>
                    <SelectItem value="check-in">Check-In</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="review">Progress Review</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id" className="text-muted-foreground">Client (Optional)</Label>
            <Controller
              name="client_id"
              control={control}
              render={({ field }) => (
                <Select 
                  value={field.value ? field.value.toString() : "personal"}
                  onValueChange={(val) => field.onChange(val === "personal" ? null : val)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="personal">No client (Personal event)</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="start_time"
                control={control}
                rules={{ required: "Start time is required" }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal bg-input border-border ${errors.start_time || !timeValidation.isValid ? 'border-red-500' : ''}`}
                        disabled={isSubmitting}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPp') : <span>Pick a date & time</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover border-border text-popover-foreground">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            const newDate = new Date(date);
                            newDate.setHours(field.value.getHours(), field.value.getMinutes(), field.value.getSeconds(), field.value.getMilliseconds());
                            field.onChange(newDate);
                          }
                        }}
                      />
                      <div className="p-3 border-t border-border">
                        <Input
                          type="time"
                          value={field.value ? format(field.value, 'HH:mm') : ''}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = new Date(field.value);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            field.onChange(newDate);
                          }}
                          className="bg-input border-border"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.start_time && (
                <p className="text-red-500 text-xs mt-1">{errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="end_time"
                control={control}
                rules={{ required: "End time is required" }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal bg-input border-border ${errors.end_time || !timeValidation.isValid ? 'border-red-500' : ''}`}
                        disabled={isSubmitting}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPp') : <span>Pick a date & time</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover border-border text-popover-foreground">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            const newDate = new Date(date);
                            newDate.setHours(field.value.getHours(), field.value.getMinutes(), field.value.getSeconds(), field.value.getMilliseconds());
                            field.onChange(newDate);
                          }
                        }}
                      />
                      <div className="p-3 border-t border-border">
                        <Input
                          type="time"
                          value={field.value ? format(field.value, 'HH:mm') : ''}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = new Date(field.value);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            field.onChange(newDate);
                          }}
                          className="bg-input border-border"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.end_time && (
                <p className="text-red-500 text-xs mt-1">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {timeValidation.isValid && durationDisplay && (
            <div className="bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
              <p className="text-sm text-[hsl(var(--success))] font-medium">
                Event duration: {durationDisplay}
              </p>
            </div>
          )}

          {/* Recurring Event Section */}
          {!editingEvent?.id && ( // Recurring option only for new events
            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-[#C5B358]" />
                  <Label htmlFor="is_recurring" className="text-foreground font-semibold cursor-pointer">
                    Make this a recurring event
                  </Label>
                </div>
                <Checkbox
                  id="is_recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  disabled={isSubmitting}
                />
              </div>

              {isRecurring && (
                <div 
                  className="space-y-4 pl-6 border-l-2 border-[#C5B358]/30"
                >
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-400">
                        Recurring events will create multiple calendar entries based on your pattern. 
                        Each event can be edited or deleted individually after creation.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Repeat Pattern</Label>
                      <Controller
                        name="recurrence_pattern"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                            <SelectTrigger className="bg-input border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Every</Label>
                      <Controller
                        name="recurrence_interval"
                        control={control}
                        render={({ field }) => (
                          <Select value={String(field.value)} onValueChange={(val) => field.onChange(parseInt(val))} disabled={isSubmitting}>
                            <SelectTrigger className="bg-input border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                              {[1, 2, 3, 4].map(num => (
                                <SelectItem key={num} value={String(num)}>
                                  {num} {recurrencePattern === 'daily' ? 'day' : recurrencePattern === 'weekly' ? 'week' : 'month'}{num > 1 ? 's' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Number of Occurrences</Label> 
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g., 4"
                      {...register("recurrence_count", { 
                        required: "Number of occurrences is required",
                        min: { value: 1, message: "Must be at least 1" },
                        valueAsNumber: true
                      })}
                      disabled={isSubmitting}
                      className={`bg-input border-border focus:border-[#C5B358] ${errors.recurrence_count ? 'border-red-500' : ''}`}
                    />
                    {errors.recurrence_count && (
                      <p className="text-red-500 text-xs mt-1">{errors.recurrence_count.message}</p>
                    )}
                  </div>

                  {recurringEventCountDisplay > 0 && (
                    <div className="bg-[#C5B358]/10 border border-[#C5B358]/30 rounded-lg p-3">
                      <p className="text-sm font-medium text-[#C5B358]">
                        This will create <strong>{recurringEventCountDisplay}</strong> event{recurringEventCountDisplay !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Starting from {format(startTime, 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description" className="text-muted-foreground">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any notes or details about this event..."
              {...register("description")}
              disabled={isSubmitting}
              className="bg-input border-border focus:border-[#C5B358] resize-none"
              rows={3}
            />
          </div>

          {/* LinkedCheckInView component removed as the linkedCheckIn prop is no longer available */}

          <DialogFooter className="flex justify-between border-t border-border pt-4">
            <div>
              {/* Delete button removed as `onDelete` prop is no longer available in the component signature */}
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
                className="border-border hover:bg-secondary"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !timeValidation.isValid}
                className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Saving..." : (editingEvent ? "Update Event" : isRecurring ? `Create ${recurringEventCountDisplay} Events` : "Create Event")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}