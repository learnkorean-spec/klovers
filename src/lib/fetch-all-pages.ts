/**
 * Fetch every row of a query, a page at a time.
 *
 * WHY
 * PostgREST caps a response at its configured maximum, and several admin hooks
 * additionally asked for `.limit(500)` with no paging. Neither cap announces
 * itself: the request succeeds, the array comes back short, and a count built
 * from `array.length` silently freezes at a number that still looks plausible.
 * A dashboard that reports 500 leads forever is worse than one that errors.
 *
 * WHY OFFSET AND NOT A KEYSET CURSOR
 * The hook this replaces paged with `.lt("joined_at", cursor)`. Keyset paging
 * on a non-unique column drops every row that shares the cursor value with the
 * last row of the previous page — and bulk imports produce identical
 * timestamps by the dozen. Offset paging has no cursor column to collide on.
 *
 * WHAT THE CALLER MUST GUARANTEE
 * A TOTAL ordering. Offset paging assumes the server returns rows in a stable
 * sequence across requests; if the sort key has ties, Postgres may order tied
 * rows differently per query and pages will skip and repeat. Always end the
 * ordering with a unique column — `.order("created_at", …).order("id", …)`.
 */

export interface PageResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

/** Default page size. Comfortably under PostgREST's usual 1,000-row ceiling. */
export const DEFAULT_PAGE_SIZE = 1000;

/**
 * @param fetchPage inclusive [from, to] row range — the shape `.range()` takes
 * @param pageSize  rows per request; must match the range width fetchPage uses
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const all: T[] = [];

  for (let page = 0; ; page++) {
    const from = page * pageSize;
    const { data, error } = await fetchPage(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    all.push(...data);

    // A short page is the last page. Equal-length pages keep going, so a table
    // that is an exact multiple of pageSize costs one extra empty request
    // rather than silently stopping one page early.
    if (data.length < pageSize) break;
  }

  return all;
}
