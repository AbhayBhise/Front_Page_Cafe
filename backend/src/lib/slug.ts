import crypto from 'crypto';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'cafe';
  let candidate = root;
  let i = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await exists(candidate)) {
    i += 1;
    candidate = `${root}-${i}`;
    if (i > 50) {
      candidate = `${root}-${crypto.randomBytes(3).toString('hex')}`;
      break;
    }
  }
  return candidate;
}
