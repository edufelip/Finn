export const isWordTerm = (term: string) => /^\w+$/.test(term);

export const normalizeTerms = (terms?: string[]) =>
  Array.from(
    new Set(
      (terms ?? [])
        .map((term) => term.trim().toLowerCase())
        .filter((term) => term.length > 0)
        .filter(isWordTerm)
    )
  );
