import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, coachId } = await req.json();

        if (!userId || !coachId) {
            return Response.json({ error: 'Missing userId or coachId' }, { status: 400 });
        }

        // Use service role to update the user entity (bypass security restrictions)
        const updatedUser = await base44.asServiceRole.entities.User.update(userId, { 
            coach_id: coachId,
            user_type: 'client' // Ensure they are marked as a client
        });

        return Response.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Assign Coach Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});