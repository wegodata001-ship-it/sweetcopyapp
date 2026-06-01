/** hlwait schema has no activity_log — no-op */
export async function logActivity(_userId: string, _action: string): Promise<void> {
  return;
}
