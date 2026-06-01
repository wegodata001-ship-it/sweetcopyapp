import { hlwaitApiDisabled } from "@/lib/api/hlwait-not-implemented";
export const dynamic = "force-dynamic";
const disabled = () => hlwaitApiDisabled();
export const GET = disabled;
export const POST = disabled;
export const PATCH = disabled;
export const PUT = disabled;
export const DELETE = disabled;