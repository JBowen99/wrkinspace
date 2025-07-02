import type { ActionFunctionArgs } from "react-router";
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../database.types';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { spaceId, password } = await request.json();

    if (!spaceId) {
      return Response.json({ success: false, error: "Space ID is required" }, { status: 400 });
    }

    // Create Supabase client for server-side use
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Query space from database server-side
    const { data: space, error } = await supabase
      .from('spaces')
      .select('id, password')
      .eq('id', spaceId)
      .single();

    if (error || !space) {
      return Response.json({ success: false, error: "Space not found" }, { status: 404 });
    }

    // Server-side password comparison
    if (space.password && space.password !== password) {
      return Response.json({ success: false, error: "Invalid password" }, { status: 401 });
    }

    // Update last_accessed timestamp on successful authentication
    const { error: updateError } = await supabase
      .from('spaces')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', spaceId);

    if (updateError) {
      console.error('Failed to update last_accessed:', updateError);
      // Don't fail the request for this non-critical operation
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Space authentication error:', error);
    return Response.json(
      { success: false, error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 