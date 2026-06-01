import type { HLWaitUser } from "@prisma/client";

/** API/session shape for public.hlwait_users */
export type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  nationalId: string | null;
  phone: string | null;
  hourlyRate: number;
  language: string;
  mustChangePassword: boolean;
};

export function toApiUser(
  row: Pick<HLWaitUser, "id" | "name" | "email" | "role" | "isActive">,
): ApiUser {
  return {
    id: row.id,
    fullName: row.name,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    nationalId: null,
    phone: null,
    hourlyRate: 0,
    language: "he",
    mustChangePassword: false,
  };
}
