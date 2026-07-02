import { useEffect, useState } from "react";
import { getSettings } from "../services/SettingsService";

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const data = await getSettings();
      setSettings(data);
      setLoading(false);
    }

    loadSettings();
  }, []);

  return {
    settings,
    loading,
  };
}