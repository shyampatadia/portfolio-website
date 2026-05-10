import { useEffect, useMemo, useState } from "react";
import { CalendarDays, NotebookText } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBlogPosts } from "@/utils/api";
import { cn } from "@/lib/utils";

export function BlogSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const response = await getBlogPosts({
          published_only: true,
          page: 1,
          page_size: 10,
        });

        if (!cancelled) {
          setPosts(response.posts || response);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError);
          setLoading(false);
        }
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const next = new Set();
    posts.forEach((post) => {
      if (post.category) next.add(post.category);
    });
    return ["all", ...next];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === "all") return posts;
    return posts.filter((post) => post.category === activeCategory);
  }, [activeCategory, posts]);

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Writing"
        title="Writing"
        description="Posts and notes on engineering, AI, and the systems around the work."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={cn(
              "pill-nav",
              activeCategory === category
                ? "border-slate-200 bg-white text-slate-950 shadow-[0_10px_24px_rgba(31,45,61,0.06)]"
                : "hover:border-slate-300 hover:bg-white hover:text-slate-950",
            )}
          >
            {category === "all" ? "All posts" : category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="quiet-panel p-6">
          <div className="space-y-3">
            <div className="h-6 w-48 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="quiet-panel p-6">
          <div className="space-y-2">
            <h3 className="type-card-title">Writing is temporarily unavailable</h3>
            <p className="type-body-sm">{error.message}</p>
          </div>
        </div>
      ) : null}

      {!loading && !error && filteredPosts.length === 0 ? (
        <div className="quiet-panel p-6">
          <div className="space-y-2">
            <h3 className="type-card-title">No posts in this category yet</h3>
            <p className="type-body-sm">
              New writing in this category will appear here.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="content-card grid gap-5 p-5 lg:grid-cols-[190px_minmax(0,1fr)_120px] sm:p-6"
          >
            <div className="space-y-2 text-[0.95rem] text-slate-500">
              <span className="flex items-center gap-2">
                <NotebookText className="h-4 w-4 text-blue-700" />
                {post.category || "Writing"}
              </span>
              <time
                className="flex items-center gap-2"
                dateTime={post.created_at}
              >
                <CalendarDays className="h-4 w-4 text-slate-400" />
                {new Date(post.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </div>

            <div className="space-y-3">
              <h3 className="type-card-title max-w-3xl">
                {post.title}
              </h3>
              <p className="reading-measure type-body-sm">
                {post.excerpt || `${post.content.substring(0, 180)}...`}
              </p>

              <div className="flex flex-wrap gap-2">
                {(post.tags || []).slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="subtle">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-start lg:justify-end">
              <Button variant="secondary" size="sm" asChild>
                <a href={`/blog/post.html?slug=${encodeURIComponent(post.slug)}`}>
                  Read post
                </a>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
