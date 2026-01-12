import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only coaches can create clients
    if (!user || user.user_type !== 'coach') {
      return Response.json({ error: 'Unauthorized: Only coaches can create clients' }, { status: 403 });
    }

    const clientData = await req.json();

    // Validate required fields
    if (!clientData.email || !clientData.full_name) {
      return Response.json({ 
        error: 'Missing required fields: email, full_name' 
      }, { status: 400 });
    }

    // Check if client with this email already exists for this coach
    const existingClients = await base44.asServiceRole.entities.Client.filter({
      email: clientData.email,
      coach_id: user.id
    });

    if (existingClients.length > 0) {
      return Response.json({ 
        error: 'A client with this email already exists in your roster' 
      }, { status: 400 });
    }

    // FORCE coach_id to be the current user - ignore any frontend value
    const secureClientData = {
      full_name: clientData.full_name,
      email: clientData.email,
      coach_id: user.id, // ENFORCED SERVER-SIDE
      status: clientData.status || "pending_invitation",
      profile_image: clientData.profile_image || "",
      invitation_token: clientData.invitation_token || crypto.randomUUID(),
    };

    // Create the client using service role
    const newClient = await base44.asServiceRole.entities.Client.create(secureClientData);

    console.log(`Client ${newClient.email} created by coach ${user.id}`);

    return Response.json({ 
      success: true, 
      client: newClient 
    });

  } catch (error) {
    console.error('Error creating client:', error);
    return Response.json({ 
      error: error.message || 'Failed to create client' 
    }, { status: 500 });
  }
});