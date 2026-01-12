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
import { base44 } from '@/api/base44Client';

const TimeValidationError = ({ startTime, endTime }) => {
  if (!startTime || !endTime) return null;
  const start = new Date(startTime);
  const end = new Date(endTime);
  let error = null;
  if (!isAfter(end, start)) {
    error = { type: 'order', message: 'End time must be after start time', icon: <AlertTriangle className="w-4 h-4" /> };
  } else {
    const durationMinutes = (end - start) / (1000 * 60);
    if (durationMinutes < 15) {
      error = { type: 'tooShort', message: 'Event must be at least 15 minutes long', icon: <Clock className="w-4 h-4" /> };
    } else if (durationMinutes > 1440) {
      error = { type: 'tooLong', message: 'Event cannot be longer than 24 hours', icon: <Clock className="w-4 h-4" /> };
    }
  }
  if (!error) return null;
  return (
    <div className="bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30 rounded-lg p-3 flex items-start gap-2">
      <div className="text-[hsl(var(--destructive))] mt-0.5">{error.icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[hsl(var(--destructive))]">{error.message}</p>
      </div>
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
          <h4 className="font-semibold text-[hsl(var(--warning))] text-sm mb-2">Scheduling Conflict Detected</h4>
          <p className="text-xs text-[hsl(var(--warning))]/80 mb-3">This event overlaps with {conflicts.length} existing event{conflicts.length > 1 ? 's' : ''}.</p>
        </div>
      </div>
    </div>
  );
};

export default function AddEventDialog({ isOpen, onClose, selectedDate, user, clients, onEventCreated, editingEvent, existingEvents = [] }) {
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
    recurrence_count: 4,
    check_in_id: editingEvent?.check_in_id || null,
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
  const recurrenceCount = watch("recurrence_count");

  const timeValidation = useMemo(() => {
    if (!startTime || !endTime) return { isValid: false, error: null };
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!isAfter(end, start)) return { isValid: false, error: 'End time must be after start time' };
    const durationMinutes = (end - start) / (1000 * 60);
    if (durationMinutes < 15) return { isValid: false, error: 'Event must be at least 15 minutes long' };
    if (durationMinutes > 1440) return { isValid: false, error: 'Event cannot be longer than 24 hours' };
    return { isValid: true, error: null, durationMinutes };
  }, [startTime, endTime]);

  const durationDisplay = useMemo(() => {
    if (!timeValidation.isValid || !timeValidation.durationMinutes) return null;
    const minutes = timeValidation.durationMinutes;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 && remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : hours > 0 ? `${hours}h` : `${remainingMinutes}m`;
  }, [timeValidation]);

  useEffect(() => {
    if (!isOpen || !startTime || !endTime || !timeValidation.isValid) {
      setConflicts([]);
      return;
    }
    const detectConflicts = () => {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const conflictingEvents = existingEvents.filter(existing => {
        if (editingEvent?.id && existing.id === editingEvent.id) return false;
        if (clientId && existing.client_id !== clientId) return false;
        if (!clientId && existing.client_id) return false;
        const existingStart = new Date(existing.start_time);
        const existingEnd = new Date(existing.end_time);
        return (start >= existingStart && start < existingEnd) || (end > existingStart && end <= existingEnd) || (start <= existingStart && end >= existingEnd);
      });
      setConflicts(conflictingEvents);
    };
    detectConflicts();
  }, [startTime, endTime, clientId, existingEvents, editingEvent?.id, isOpen, timeValidation.isValid]);

  useEffect(() => {
    const newInitialDateForNewEvent = getInitial9AMDate(selectedDate);
    reset({
      title: editingEvent?.title || "",
      description: editingEvent?.description || "",
      start_time: editingEvent?.start_time ? new Date(editingEvent.start_time) : newInitialDateForNewEvent,
      end_time: editingEvent?.end_time ? new Date(editingEvent.end_time) : addMinutes(editingEvent?.start_time ? new Date(editingEvent.start_time) : newInitialDateForNewEvent, 60),
      client_id: editingEvent?.client_id || "",
      event_type: editingEvent?.event_type || "session",
      is_recurring: false,
      recurrence_pattern: "weekly",
      recurrence_interval: 1,
      recurrence_count: 4,
      check_in_id: editingEvent?.check_in_id || null,
    });
    setIsRecurring(false);
    setConflicts([]);
  }, [editingEvent, selectedDate, reset]);

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
    if (!timeValidation.isValid) {
      toast.error("Invalid event times", { description: timeValidation.error, duration: 4000 });
      return;
    }
    if (isRecurring && !editingEvent) {
        if (!data.recurrence_count || parseInt(data.recurrence_count) <= 0) {
            toast.error("Number of occurrences must be a positive number.");
            return;
        }
        if (recurringEventCountDisplay > 52) {
            const confirm = window.confirm(`This will create ${recurringEventCountDisplay} events. Continue?`);
            if (!confirm) return;
        }
    }
    if (conflicts.length > 0 && !editingEvent?.id) {
      const confirmWithConflict = window.confirm(`This event conflicts with ${conflicts.length} existing event(s). Create anyway?`);
      if (!confirmWithConflict) return;
    }

    try {
      const startDateTime = new Date(data.start_time);
      const endDateTime = new Date(data.end_time);
      const sanitizedClientId = (data.client_id && data.client_id !== "" && data.client_id !== "personal") ? data.client_id : null;

      const baseEventData = {
        title: data.title,
        description: data.description || "",
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        coach_id: user.id,
        client_id: sanitizedClientId,
        event_type: data.event_type,
        check_in_id: data.check_in_id ? data.check_in_id : null,
      };

      if (editingEvent) {
        await base44.entities.CalendarEvent.update(editingEvent.id, baseEventData);
        toast.success("Event updated successfully");
      } else if (data.is_recurring) {
        // [Existing Recurring Logic - Kept as is]
        const recurrenceIterations = parseInt(data.recurrence_count) || 4;
        const pattern = data.recurrence_pattern;
        const allExistingEvents = await base44.entities.CalendarEvent.filter({ coach_id: user.id });
        const eventsToCreate = [];
        
        for (let i = 0; i < recurrenceIterations; i++) {
          let occurrenceStart = new Date(startDateTime);
          let occurrenceEnd = new Date(endDateTime);
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
          eventsToCreate.push({
            ...baseEventData,
            start_time: occurrenceStart.toISOString(),
            end_time: occurrenceEnd.toISOString(),
            is_recurring: true,
            recurrence_pattern: pattern,
            recurrence_interval: data.recurrence_interval,
          });
        }
        if (eventsToCreate.length > 0) {
          await base44.entities.CalendarEvent.bulkCreate(eventsToCreate);
          toast.success(`${eventsToCreate.length} recurring events created`);
        }
      } else {
        // --- CRITICAL FIX: BYPASS CLOUD FUNCTION FOR OFFLINE/PERSONAL CLIENTS ---
        
        // 1. Check if the selected client is "Offline" (has no user_id)
        const selectedClientObj = clients.find(c => c.id === sanitizedClientId);
        const isOfflineClient = selectedClientObj && !selectedClientObj.user_id;
        const isPersonalEvent = !sanitizedClientId;

        if (isOfflineClient || isPersonalEvent) {
          // BYPASS: Use direct DB write for Offline/Personal to avoid Cloud Function crashes
          console.log("Offline/Personal Event Detected: Bypassing Cloud Function...");
          await base44.entities.CalendarEvent.create(baseEventData);
        } else {
          // NORMAL: Use Cloud Function for real clients (sends notifications)
          const createCalendarEvent = (await import('@/api/functions')).default;
          await createCalendarEvent(baseEventData);
        }
        
        toast.success("Event created successfully");
      }
      
      onEventCreated();
      reset();
      onClose();
    } catch (error) {
      console.error("FULL ERROR:", error);
      window.alert(`Save Failed: ${error?.message || JSON.stringify(error)}`);
      toast.error(`Failed to save event: ${error?.message || "Unknown error"}`);
    }
  };

  const handleClose = () => {
    reset();
    setIsRecurring(false);
    setConflicts([]);
    onClose();
  };

  useEffect(() => {
    if (startTime && !editingEvent?.id) {
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
          <TimeValidationError startTime={startTime} endTime={endTime} />
          {conflicts.length > 0 && <ConflictWarning conflicts={conflicts} />}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-muted-foreground">Event Title <span className="text-red-500">*</span></Label>
            <Input id="title" placeholder="e.g., Training Session" {...register("title", { required: "Event title is required", minLength: { value: 3, message: "Title must be at least 3 characters" } })} disabled={isSubmitting} className={`bg-input border-border focus:border-[#C5B358] ${errors.title ? 'border-red-500' : ''}`} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type" className="text-muted-foreground">Event Type</Label>
            <Controller name="event_type" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="session">Training Session</SelectItem>
                  <SelectItem value="check-in">Check-In</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="review">Progress Review</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id" className="text-muted-foreground">Client (Optional)</Label>
            <Controller name="client_id" control={control} render={({ field }) => (
              <Select value={field.value ? field.value.toString() : "personal"} onValueChange={(val) => field.onChange(val === "personal" ? null : val)} disabled={isSubmitting}>
                <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="personal">No client (Personal event)</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.full_name} {client.status === 'pending_invitation' ? '(Pending)' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Start Time <span className="text-red-500">*</span></Label>
              <Controller name="start_time" control={control} rules={{ required: "Start time is required" }} render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={`w-full justify-start text-left font-normal bg-input border-border ${errors.start_time || !timeValidation.isValid ? 'border-red-500' : ''}`} disabled={isSubmitting}>
                      <Clock className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPp') : <span>Pick a date & time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border text-popover-foreground">
                    <Calendar mode="single" selected={field.value} onSelect={(date) => { if (date) { const newDate = new Date(date); newDate.setHours(field.value.getHours(), field.value.getMinutes()); field.onChange(newDate); } }} />
                    <div className="p-3 border-t border-border">
                      <Input type="time" value={field.value ? format(field.value, 'HH:mm') : ''} onChange={(e) => { const [h, m] = e.target.value.split(':'); const d = new Date(field.value); d.setHours(parseInt(h), parseInt(m)); field.onChange(d); }} className="bg-input border-border" />
                    </div>
                  </PopoverContent>
                </Popover>
              )} />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">End Time <span className="text-red-500">*</span></Label>
              <Controller name="end_time" control={control} rules={{ required: "End time is required" }} render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={`w-full justify-start text-left font-normal bg-input border-border ${errors.end_time || !timeValidation.isValid ? 'border-red-500' : ''}`} disabled={isSubmitting}>
                      <Clock className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPp') : <span>Pick a date & time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border text-popover-foreground">
                    <Calendar mode="single" selected={field.value} onSelect={(date) => { if (date) { const newDate = new Date(date); newDate.setHours(field.value.getHours(), field.value.getMinutes()); field.onChange(newDate); } }} />
                    <div className="p-3 border-t border-border">
                      <Input type="time" value={field.value ? format(field.value, 'HH:mm') : ''} onChange={(e) => { const [h, m] = e.target.value.split(':'); const d = new Date(field.value); d.setHours(parseInt(h), parseInt(m)); field.onChange(d); }} className="bg-input border-border" />
                    </div>
                  </PopoverContent>
                </Popover>
              )} />
            </div>
          </div>

          {timeValidation.isValid && durationDisplay && (
            <div className="bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" /><p className="text-sm text-[hsl(var(--success))] font-medium">Event duration: {durationDisplay}</p>
            </div>
          )}

          {!editingEvent?.id && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Repeat className="w-4 h-4 text-[#C5B358]" /><Label htmlFor="is_recurring" className="text-foreground font-semibold cursor-pointer">Make this a recurring event</Label></div>
                <Checkbox id="is_recurring" checked={isRecurring} onCheckedChange={setIsRecurring} disabled={isSubmitting} />
              </div>
              {isRecurring && (
                <div className="space-y-4 pl-6 border-l-2 border-[#C5B358]/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Repeat Pattern</Label>
                      <Controller name="recurrence_pattern" control={control} render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                          <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground"><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
                        </Select>
                      )} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Every</Label>
                      <Controller name="recurrence_interval" control={control} render={({ field }) => (
                        <Select value={String(field.value)} onValueChange={(val) => field.onChange(parseInt(val))} disabled={isSubmitting}>
                          <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">{[1, 2, 3, 4].map(num => (<SelectItem key={num} value={String(num)}>{num} {recurrencePattern === 'daily' ? 'day' : recurrencePattern === 'weekly' ? 'week' : 'month'}{num > 1 ? 's' : ''}</SelectItem>))}</SelectContent>
                        </Select>
                      )} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Number of Occurrences</Label>
                    <Input type="number" min="1" {...register("recurrence_count", { required: true, min: 1, valueAsNumber: true })} disabled={isSubmitting} className="bg-input border-border focus:border-[#C5B358]" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description" className="text-muted-foreground">Description (Optional)</Label>
            <Textarea id="description" {...register("description")} disabled={isSubmitting} className="bg-input border-border focus:border-[#C5B358] resize-none" rows={3} />
          </div>

          <DialogFooter className="flex justify-between border-t border-border pt-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="border-border hover:bg-secondary">Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !timeValidation.isValid} className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">
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