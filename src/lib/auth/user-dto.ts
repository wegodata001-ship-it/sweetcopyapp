import type { User } from "@prisma/client";

/** API/session shape for ERP User */
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
  row: Pick<
    User,
    | "id"
    | "fullName"
    | "email"
    | "role"
    | "isActive"
    | "nationalId"
    | "phone"
    | "hourlyRate"
    | "language"
    | "mustChangePassword"
  >,
): ApiUser {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    nationalId: row.nationalId,
    phone: row.phone,
    hourlyRate: row.hourlyRate ?? 0,
    language: row.language ?? "he",
    mustChangePassword: row.mustChangePassword ?? false,
  };
}
