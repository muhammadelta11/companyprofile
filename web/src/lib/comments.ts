import { cacheLife, cacheTag } from "next/cache";
import { publicClient } from "./supabase/public";
import { supabaseReady } from "./supabase/env";

export type ProductComment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author_name: string;
};

export async function getProductComments(productId: string): Promise<ProductComment[]> {
  "use cache";
  cacheTag(`product-comments-${productId}`);
  cacheLife("minutes");
  if (!supabaseReady) return [];

  const { data, error } = await publicClient()
    .from("product_comments")
    .select("id, body, created_at, user_id, author:profiles!product_comments_user_id_fkey(full_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error || !data) return [];

  return data.map((row) => {
    const author = row.author as { full_name?: string | null } | null;
    return {
      id: String(row.id),
      body: String(row.body ?? ""),
      created_at: String(row.created_at ?? ""),
      user_id: String(row.user_id),
      author_name: author?.full_name?.trim() || "Member",
    };
  });
}
