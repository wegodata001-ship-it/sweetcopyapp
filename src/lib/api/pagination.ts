export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 500;

export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function parsePagination(
  searchParams: URLSearchParams,
  options?: { defaultPageSize?: number; maxPageSize?: number },
): PaginationParams {
  const defaultPageSize = options?.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const maxPageSize = options?.maxPageSize ?? MAX_PAGE_SIZE;
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const pageSizeRaw = Number(
    searchParams.get("pageSize") ?? searchParams.get("limit") ?? String(defaultPageSize),
  );
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  let pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw >= 1 ? Math.floor(pageSizeRaw) : defaultPageSize;
  pageSize = Math.min(pageSize, maxPageSize);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function buildPaginationMeta(
  total: number,
  { page, pageSize }: Pick<PaginationParams, "page" | "pageSize">,
): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return { page, pageSize, total, totalPages };
}
