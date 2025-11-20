import { supabase } from '@/integrations/supabase/client';

interface TelemetryEvent {
  event_name: string;
  user_id: string;
  business_id: string;
  shortcut_type: string;
  metadata?: Record<string, any>;
}

export async function logWorkflowShortcut(event: TelemetryEvent) {
  try {
    // Log to console for now - can be extended to store in a telemetry table
    console.log('[Telemetry]', {
      ...event,
      timestamp: new Date().toISOString(),
    });

    // Optional: Store in a dedicated telemetry table if needed
    // await supabase.from('telemetry_events').insert({
    //   ...event,
    //   timestamp: new Date().toISOString(),
    // });
  } catch (error) {
    console.error('Failed to log telemetry:', error);
  }
}
