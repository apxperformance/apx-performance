import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the event data from request
    const eventData = await req.json();

    // Validate required fields
    if (!eventData.title || !eventData.start_time || !eventData.end_time) {
      return Response.json({ 
        error: 'Missing required fields: title, start_time, end_time' 
      }, { status: 400 });
    }

    // Prepare calendar event data
    const calendarEventData = {
      title: eventData.title,
      description: eventData.description || "",
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      coach_id: eventData.coach_id || user.id,
      client_id: eventData.client_id || null,
      event_type: eventData.event_type || "session",
      check_in_id: eventData.check_in_id || null,
      is_recurring: eventData.is_recurring || false,
      recurrence_pattern: eventData.recurrence_pattern || null,
      recurrence_interval: eventData.recurrence_interval || null,
    };

    // Create the calendar event using service role (bypasses user permissions)
    const createdEvent = await base44.asServiceRole.entities.CalendarEvent.create(calendarEventData);

    // Smart notification logic - only if client_id is present
    if (eventData.client_id) {
      try {
        // Lookup the Client entity to get the user_id
        const clientRecords = await base44.asServiceRole.entities.Client.filter({
          id: eventData.client_id
        });

        if (clientRecords.length > 0) {
          const client = clientRecords[0];
          
          // Only send notification if client has a linked user_id (is Active)
          if (client.user_id) {
            // Get the user's email from the User entity
            const userRecords = await base44.asServiceRole.entities.User.filter({
              id: client.user_id
            });

            if (userRecords.length > 0) {
              const clientUser = userRecords[0];
              
              // Send email notification using Core integration
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: clientUser.email,
                subject: `New Event: ${eventData.title}`,
                body: `
                  <h2>Calendar Event Scheduled</h2>
                  <p><strong>Event:</strong> ${eventData.title}</p>
                  <p><strong>Type:</strong> ${eventData.event_type}</p>
                  <p><strong>Start:</strong> ${new Date(eventData.start_time).toLocaleString()}</p>
                  <p><strong>End:</strong> ${new Date(eventData.end_time).toLocaleString()}</p>
                  ${eventData.description ? `<p><strong>Details:</strong> ${eventData.description}</p>` : ''}
                  <p>Check your calendar for more details.</p>
                `
              });

              console.log(`Notification sent to ${clientUser.email}`);
            }
          } else {
            console.log(`Client ${eventData.client_id} has no user_id (Pending Invite) - skipping notification`);
          }
        }
      } catch (notificationError) {
        // Log but don't fail the event creation if notification fails
        console.error('Notification error (non-fatal):', notificationError);
      }
    }

    return Response.json({ 
      success: true, 
      event: createdEvent 
    });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    return Response.json({ 
      error: error.message || 'Failed to create calendar event' 
    }, { status: 500 });
  }
});