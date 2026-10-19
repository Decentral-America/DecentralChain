/** Per-route document title, so each explorer page is distinguishable (WCAG 2.4.2). */
export function pageMeta(title: string): { title: string }[] {
  return [{ title: `${title} — DecentralScan` }];
}
