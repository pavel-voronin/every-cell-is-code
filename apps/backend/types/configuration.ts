export type Configuration = {
  name: string;
  description: string;
  publicUrl: string;
  layers: {
    covers: { width: number; height: number };
    offset?: { x: number; y: number };
    presence: 'full' | 'bitmask' | 'bloom';
    subscribe?: 'poll' | 'websocket' | 'sse' | 'none';
  }[];
};
