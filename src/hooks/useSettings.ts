import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  SettingsAPI,
  SettingsAPIError,
  type SettingsData,
  type UserPreferences,
} from "../api/SettingsAPI";

export function useSettings() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<SettingsAPIError | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      setData(await SettingsAPI.getSettings(signal));
    } catch (unknownError) {
      if (
        unknownError instanceof DOMException &&
        unknownError.name === "AbortError"
      ) return;

      setError(
        unknownError instanceof SettingsAPIError
          ? unknownError
          : new SettingsAPIError({
              code: "SETTINGS_LOAD_FAILED",
              message:
                unknownError instanceof Error
                  ? unknownError.message
                  : "Unable to load settings",
            }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const save = useCallback(async (preferences: UserPreferences) => {
    setSaving(true);
    setError(null);

    try {
      const result = await SettingsAPI.updateSettings(preferences);

      setData((current) =>
        current
          ? {
              ...current,
              preferences: result.preferences,
              account: result.account,
            }
          : null,
      );

      window.dispatchEvent(
        new CustomEvent("quizara:settings-updated", {
          detail: result.preferences,
        }),
      );
    } catch (unknownError) {
      const normalized =
        unknownError instanceof SettingsAPIError
          ? unknownError
          : new SettingsAPIError({
              code: "SETTINGS_SAVE_FAILED",
              message:
                unknownError instanceof Error
                  ? unknownError.message
                  : "Unable to save settings",
            });

      setError(normalized);
      throw normalized;
    } finally {
      setSaving(false);
    }
  }, []);

  const requestDeletion = useCallback(async () => {
    setDeleting(true);
    setError(null);

    try {
      const account = await SettingsAPI.requestAccountDeletion();

      setData((current) =>
        current
          ? { ...current, account }
          : current,
      );

      return account;
    } finally {
      setDeleting(false);
    }
  }, []);

  const cancelDeletion = useCallback(async () => {
    setDeleting(true);
    setError(null);

    try {
      const account = await SettingsAPI.cancelAccountDeletion();

      setData((current) =>
        current
          ? { ...current, account }
          : current,
      );

      return account;
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    data,
    loading,
    saving,
    deleting,
    error,
    refresh,
    save,
    requestDeletion,
    cancelDeletion,
  };
}
