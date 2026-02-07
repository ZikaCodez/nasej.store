import { useEffect, useState } from "react";
import api from "@/lib/api";

export type ColorDoc = { _id: string; hex: string };

export function useColors() {
  const [colorsMap, setColorsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get<{ items: ColorDoc[] }>("/colors", {
          params: { limit: 1000, _ts: Date.now() },
        });
        const map: Record<string, string> = {};
        (res.data.items || []).forEach(({ _id, hex }) => {
          if (_id && hex) map[_id.toLowerCase()] = hex;
        });
        if (mounted) setColorsMap(map);
      } catch {
        // ignore failures; leave map empty
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { colorsMap, loading };
}
