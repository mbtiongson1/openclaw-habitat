import { useEffect, useState } from 'react';
import { type GlobalCommandDescriptor } from '@habitat/shared';

export function useGlobalCommands() {
  const [commands, setCommands] = useState<GlobalCommandDescriptor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/commands')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load OpenClaw commands');
        return response.json() as Promise<{ commands: GlobalCommandDescriptor[] }>;
      })
      .then(payload => {
        if (!cancelled) setCommands(payload.commands ?? []);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { commands, loading };
}
