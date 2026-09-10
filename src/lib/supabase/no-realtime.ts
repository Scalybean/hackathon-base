/**
 * A WebSocket stand-in for the Supabase clients that never use realtime.
 *
 * supabase-js builds a RealtimeClient inside createClient(), which needs a
 * global WebSocket. Node 20 has none, so createClient() throws before a single
 * query runs. Passing this as `realtime.transport` skips that lookup entirely.
 * Nothing in this template subscribes to realtime; if you add it, use a real
 * WebSocket and Node 22+.
 */
export class UnusedWebSocket {
  constructor() {
    throw new Error(
      'Realtime is not enabled in this template. Remove the no-realtime transport and run Node 22+ to use it.',
    );
  }
}

/** Spread into createClient options: `...noRealtime`. */
export const noRealtime = {
  realtime: { transport: UnusedWebSocket as unknown as never },
} as const;
