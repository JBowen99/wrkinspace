import type { ActionFunctionArgs } from "react-router";
import { createClient } from '@supabase/supabase-js';
import type { Database, TablesInsert } from '../../database.types';
import { RATE_LIMIT_CONFIG, formatRateLimitMessage } from '~/lib/rate-limit-config';

// In-memory rate limiting store (for simple implementation)
// In production, you'd want to use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function generateSpaceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateQRCodeData(spaceId: string, password?: string): string {
  const baseUrl = 'https://wrkinspace.com/space/';
  let qrData = `${baseUrl}${spaceId}`;
  if (password) {
    qrData += `?pwd=${encodeURIComponent(password)}`;
  }
  return qrData;
}

function checkRateLimit(clientIP: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const key = `space_creation_${clientIP}`;
  const existing = rateLimitStore.get(key);
  const config = RATE_LIMIT_CONFIG.spaceCreation;

  // Clean up expired entries
  if (existing && now > existing.resetTime) {
    rateLimitStore.delete(key);
  }

  const current = rateLimitStore.get(key);
  
  if (!current) {
    // First request from this IP
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return { allowed: true };
  }

  if (current.count >= config.maxRequests) {
    return { allowed: false, resetTime: current.resetTime };
  }

  // Increment count
  current.count++;
  rateLimitStore.set(key, current);
  
  return { allowed: true };
}

function getClientIP(request: Request): string {
  // Try to get real IP from headers (common proxy headers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIP) return realIP;
  if (clientIP) return clientIP;
  
  // Fallback - this might not be the real IP in production
  return 'unknown';
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitResult.resetTime || Date.now();
      const timeRemaining = resetTime - Date.now();
      const config = RATE_LIMIT_CONFIG.spaceCreation;
      
      return Response.json(
        { 
          success: false, 
          error: formatRateLimitMessage(config, timeRemaining),
          rateLimited: true,
          resetTime: resetTime
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(timeRemaining / 1000).toString()
          }
        }
      );
    }

    const { title, password } = await request.json();

    // Create Supabase client for server-side use
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Generate space data
    const spaceId = generateSpaceId();
    const qrCodeData = generateQRCodeData(spaceId, password);
    
    const spaceData: TablesInsert<'spaces'> = {
      id: spaceId,
      qr_code_data: qrCodeData,
      title: title || null,
      password: password || null,
      created_at: new Date().toISOString(),
      last_accessed: new Date().toISOString()
    };

    // Insert space into database
    const { data, error } = await supabase
      .from('spaces')
      .insert(spaceData)
      .select()
      .single();

    if (error) {
      console.error('Error creating space:', error);
      return Response.json(
        { success: false, error: error.message }, 
        { status: 500 }
      );
    }

    return Response.json({ 
      success: true, 
      spaceId,
      space: data
    });

  } catch (error) {
    console.error('Space creation error:', error);
    return Response.json(
      { success: false, error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 