export async function runtimeEnv(name: string): Promise<string | undefined> {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}
