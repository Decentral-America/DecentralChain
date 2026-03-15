export function createPageUrl(pageName: string, query = ''): string {
  return `/${pageName.toLowerCase().replace(/ /g, '-')}${query}`;
}
