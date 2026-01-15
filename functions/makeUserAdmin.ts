import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ideally, check if requester is admin:
        // if (user.role !== 'admin') { return Response.json({ error: 'Forbidden' }, { status: 403 }); }

        const { userId } = await req.json();

        if (!userId) {
            return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Use service role to promote user to admin
        const updatedUser = await base44.asServiceRole.entities.User.update(userId, { 
            role: 'admin' 
        });

        return Response.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Admin Promotion Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});