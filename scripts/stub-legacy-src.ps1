$stub = @'
import { hlwaitApiDisabled } from "@/lib/api/hlwait-not-implemented";
export const dynamic = "force-dynamic";
const disabled = () => hlwaitApiDisabled();
export const GET = disabled;
export const POST = disabled;
export const PATCH = disabled;
export const PUT = disabled;
export const DELETE = disabled;
'@

$routes = @(
  "src/app/api/admin/employee-work/tasks/[id]/route.ts",
  "src/app/api/admin/work-assign/route.ts",
  "src/app/api/admin/work-library/[id]/route.ts",
  "src/app/api/admin/work-library/route.ts",
  "src/app/api/admin/work-tasks/live/route.ts",
  "src/app/api/admin/work-templates/[id]/route.ts",
  "src/app/api/admin/work-templates/route.ts",
  "src/app/api/cashflow/[id]/route.ts",
  "src/app/api/cashflow/opening/route.ts",
  "src/app/api/cashflow/route.ts",
  "src/app/api/cashflow/z-report/[documentId]/route.ts",
  "src/app/api/checks/[id]/deposit/route.ts",
  "src/app/api/checks/backfill/route.ts",
  "src/app/api/documents/[id]/deposit/route.ts",
  "src/app/api/documents/[id]/pdf/route.ts",
  "src/app/api/documents/[id]/route.ts",
  "src/app/api/documents/route.ts",
  "src/app/api/form-fields/[id]/route.ts",
  "src/app/api/form-fields/route.ts",
  "src/app/api/inventory/categories/route.ts",
  "src/app/api/inventory/count-history/route.ts",
  "src/app/api/inventory/meta/route.ts",
  "src/app/api/inventory/movements/route.ts",
  "src/app/api/me/attendance/clock-in/route.ts",
  "src/app/api/me/attendance/clock-out/route.ts",
  "src/app/api/me/attendance/route.ts",
  "src/app/api/me/employee-work/route.ts",
  "src/app/api/me/work-session/clock-in/route.ts",
  "src/app/api/me/work-session/clock-out/route.ts",
  "src/app/api/payments/[id]/pdf/route.ts",
  "src/app/api/pdfs/route.ts",
  "src/app/api/procurement/suppliers/[id]/products/[productId]/history/route.ts",
  "src/app/api/procurement/suppliers/[id]/products/[productId]/route.ts",
  "src/app/api/procurement/suppliers/[id]/products/route.ts",
  "src/app/api/recipes/[id]/route.ts",
  "src/app/api/recipes/[id]/run/route.ts",
  "src/app/api/recipes/route.ts",
  "src/app/api/reports/generate/route.ts",
  "src/app/api/reports/latest/route.ts",
  "src/app/api/reports/route.ts",
  "src/app/api/staff/attendance/[id]/route.ts",
  "src/app/api/staff/attendance/route.ts",
  "src/app/api/staff/dashboard/route.ts",
  "src/app/api/staff/shifts/[id]/route.ts",
  "src/app/api/staff/shifts/route.ts",
  "src/app/api/workflows/runs/route.ts",
  "src/app/api/workflows/templates/route.ts"
)

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (Test-Path "prisma/schema.prisma") { $root = Split-Path $PSScriptRoot -Parent }
Set-Location $root

foreach ($r in $routes) {
  $full = Join-Path $root $r
  if (Test-Path $full) {
    Set-Content -Path $full -Value $stub -Encoding utf8
    Write-Host "stubbed $r"
  }
}
