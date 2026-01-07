import { NativeModules, Platform } from "react-native";

const MOD = NativeModules.AppGroupStore;

export function setSharedString(key: string, value: string) {
  if (Platform.OS !== "ios") return;
  MOD?.setString?.(key, value);
}

export async function getSharedString(key: string): Promise<string | null> {
  if (Platform.OS !== "ios") return null;
  if (!MOD?.getString) return null;
  return (await MOD.getString(key)) ?? null;
}
