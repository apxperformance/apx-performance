import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * This function should be called after a user signs up/logs in.
 * It checks if their email matches a pending Client record and links them.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look for Client records with this email that don't have a user_id yet
    const pendingClients = await base44.asServiceRole.entities.Client.filter({
      email: user.email,
      status: "pending_invitation"
    });

    if (pendingClients.length === 0) {
      // No pending client invitation found - this is fine, user might be registering independently
      return Response.json({ 
        success: true, 
        message: 'No pending client invitation found',
        linked: false
      });
    }

    // Link all pending client records with this email (should normally be just one)
    const linkedClients = [];
    for (const client of pendingClients) {
      // Update the client record with user_id and change status to active
      const updatedClient = await base44.asServiceRole.entities.Client.update(client.id, {
        user_id: user.id,
        status: "active",
        join_date: new Date().toISOString()
      });

      linkedClients.push(updatedClient);
      console.log(`Linked User ${user.id} to Client ${client.id}`);

      // Send welcome email to the client
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: "Welcome to APX Performance!",
          body: `
            <h2>Welcome, ${user.full_name}!</h2>
            <p>Your account has been successfully activated and linked to your coach.</p>
            <p>You can now access your personalized fitness dashboard, workouts, nutrition plans, and more.</p>
            <p>Log in to get started on your fitness journey!</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the linking process if email fails
      }
    }

    // Update the User entity to set user_type to 'client' if not already set
    if (!user.user_type) {
      await base44.asServiceRole.entities.User.update(user.id, {
        user_type: 'client'
      });
    }

    return Response.json({ 
      success: true, 
      message: `Successfully linked to ${linkedClients.length} client record(s)`,
      linked: true,
      clients: linkedClients
    });

  } catch (error) {
    console.error('Error linking user to client:', error);
    return Response.json({ 
      error: error.message || 'Failed to link user to client' 
    }, { status: 500 });
  }
});