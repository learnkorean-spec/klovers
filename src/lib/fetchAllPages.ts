/**
 * Read every row of a query, not just the first page.
 *
 * PostgREST caps a response at its `max-rows` setting (1000 by default) no
 * matter what `.limit()` asks for, and it does so silently: a table of 1,400
 * rows comes back as 1,000 and every total built from it is quietly short.
 * Admin counts must not be built that way.
 *
 * `build` must return the query for one page and must include a stable,
 * unique ordering (for example `.order("id")`), otherwise rows can repeat or
 * be skipped between pages. The result has the same `{ data, error }` shape
 * as a single query so existing code keeps working.
 */
export async function fetchAllPages<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  for (let page = 0; ; page++) {
    const from = page * pageSize;
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return { data: rows, error: null };
}
