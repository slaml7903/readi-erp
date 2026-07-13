import "server-only";

import { revalidateTag } from "next/cache";

function normalizeCacheTags(tags?: string[]) {
  if (!tags?.length) return [];

  return [
    ...new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    ),
  ];
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown cache revalidation error";
}

export async function revalidateCacheTags(tags?: string[]) {
  const normalizedTags = normalizeCacheTags(tags);

  if (normalizedTags.length === 0) return;

  for (const tag of normalizedTags) {
    try {
      revalidateTag(tag, "max");
    } catch (error) {
      console.error({
        scope: "cache-revalidation",
        tags: [tag],
        message: getErrorMessage(error),
      });
    }
  }
}
