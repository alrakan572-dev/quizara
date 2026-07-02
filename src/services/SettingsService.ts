import { SettingsRepository } from "../repositories/SettingsRepository";

export async function getSettings() {
  const { data, error } = await SettingsRepository.getAll();

  if (error) {
    console.error("Settings Error:", error);
    return {};
  }

  const settings: Record<string, string> = {};

  data?.forEach((item) => {
    settings[item.key] = item.value;
  });

  return settings;
}

export async function getSetting(key: string) {
  const { data, error } = await SettingsRepository.getByKey(key);

  if (error) {
    console.error("Setting Error:", error);
    return null;
  }

  return data?.value ?? null;
}