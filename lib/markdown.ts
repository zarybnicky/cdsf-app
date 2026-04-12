export function stripMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}
