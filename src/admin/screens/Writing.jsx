import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { deletePost, getAllBlogAnalytics, getPosts, updatePost } from "@/admin/lib/api";
import { Empty, ErrorNotice, Panel, PanelSkeleton, Segmented } from "@/admin/components/ui";
import { useAsync } from "@/admin/lib/useAdmin";
import { num, shortDate, timeAgo } from "@/admin/lib/format";
import { withBase } from "@/utils/paths";

const UNDO_WINDOW_MS = 6000;

export function Writing({ onEdit, toast }) {
  const [filter, setFilter] = useState("all");
  const [confirming, setConfirming] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(() => new Set());
  const timers = useRef(new Map());

  const load = useCallback(async (signal) => {
    const [list, analytics] = await Promise.all([
      getPosts(signal),
      getAllBlogAnalytics(signal).catch(() => []),
    ]);
    return { posts: list.posts || [], analytics: analytics || [] };
  }, []);

  const { status, data, error, reload, setData } = useAsync(load);

  // A deferred delete must not be silently dropped when the screen unmounts.
  useEffect(() => {
    const scheduled = timers.current;
    return () => {
      for (const [id, timer] of scheduled.entries()) {
        window.clearTimeout(timer.handle);
        deletePost(id).catch(() => {});
      }
      scheduled.clear();
    };
  }, []);

  const statsById = useMemo(() => {
    const map = new Map();
    for (const row of data?.analytics || []) map.set(row.blog_post_id, row);
    return map;
  }, [data]);

  if (status === "loading") {
    return (
      <div className="admin-screen">
        <Panel title="Posts">
          <PanelSkeleton rows={6} />
        </Panel>
      </div>
    );
  }

  if (status === "error" && !data) {
    return (
      <div className="admin-screen">
        <ErrorNotice error={error} onRetry={reload} />
      </div>
    );
  }

  const posts = data.posts
    .filter((post) => !pendingDelete.has(post.id))
    .filter((post) =>
      filter === "all" ? true : filter === "published" ? post.published : !post.published,
    )
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  function scheduleDelete(post) {
    setConfirming(null);
    setPendingDelete((current) => new Set(current).add(post.id));

    const handle = window.setTimeout(async () => {
      timers.current.delete(post.id);
      try {
        await deletePost(post.id);
        setData({
          posts: data.posts.filter((item) => item.id !== post.id),
          analytics: data.analytics,
        });
      } catch (caught) {
        setPendingDelete((current) => {
          const next = new Set(current);
          next.delete(post.id);
          return next;
        });
        toast(caught.message || "Could not delete the post", { tone: "error" });
      }
    }, UNDO_WINDOW_MS);

    timers.current.set(post.id, { handle });

    toast(`Deleted "${post.title}"`, {
      timeout: UNDO_WINDOW_MS - 300,
      action: {
        label: "Undo",
        run: () => {
          const timer = timers.current.get(post.id);
          if (timer) window.clearTimeout(timer.handle);
          timers.current.delete(post.id);
          setPendingDelete((current) => {
            const next = new Set(current);
            next.delete(post.id);
            return next;
          });
        },
      },
    });
  }

  async function togglePublished(post) {
    const next = !post.published;
    // Optimistic: the row flips immediately and rolls back only if the API says no.
    setData({
      posts: data.posts.map((item) => (item.id === post.id ? { ...item, published: next } : item)),
      analytics: data.analytics,
    });

    try {
      await updatePost(post.id, { published: next });
      toast(next ? "Published" : "Moved to drafts");
    } catch (caught) {
      setData({ posts: data.posts, analytics: data.analytics });
      toast(caught.message || "Could not update the post", { tone: "error" });
    }
  }

  const counts = {
    all: data.posts.length,
    published: data.posts.filter((post) => post.published).length,
    drafts: data.posts.filter((post) => !post.published).length,
  };

  return (
    <div className="admin-screen">
      <Panel
        title="Posts"
        note={`${num(counts.published)} published · ${num(counts.drafts)} drafts`}
        aside={
          <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: `All ${counts.all}` },
                { value: "published", label: "Published" },
                { value: "drafts", label: "Drafts" },
              ]}
            />
            <button type="button" className="btn btn-primary" onClick={() => onEdit(null)}>
              <Plus /> New post
            </button>
          </span>
        }
        flush
      >
        {posts.length === 0 ? (
          <Empty
            title={filter === "all" ? "No posts yet" : `No ${filter} posts`}
            hint="A post needs a title, a slug, and a body. It stays a draft until you publish it."
            action={
              <button
                type="button"
                className="btn"
                style={{ marginTop: "0.6rem" }}
                onClick={() => onEdit(null)}
              >
                <Plus /> Write the first one
              </button>
            }
          />
        ) : (
          <div className="row-list">
            {posts.map((post) => {
              const stats = statsById.get(post.id);
              return (
                <article className="row-item" key={post.id}>
                  <div className="row-main">
                    <span className="row-title">{post.title}</span>
                    <span className="row-meta">
                      <span className={post.published ? "chip chip-published" : "chip chip-draft"}>
                        {post.published ? "Published" : "Draft"}
                      </span>
                      {post.category && <span>{post.category}</span>}
                      {post.read_time && <span>{post.read_time}</span>}
                      {stats ? (
                        <span>
                          {num(stats.unique_visitors)} readers
                          {stats.total_reactions ? ` · ${num(stats.total_reactions)} reactions` : ""}
                        </span>
                      ) : null}
                      <span>
                        {post.published_at
                          ? `published ${shortDate(post.published_at)}`
                          : `edited ${timeAgo(post.updated_at)}`}
                      </span>
                    </span>
                  </div>

                  {confirming === post.id ? (
                    <span className="confirm-inline">
                      Delete this post?
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => scheduleDelete(post)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setConfirming(null)}
                      >
                        Keep
                      </button>
                    </span>
                  ) : (
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => togglePublished(post)}
                      >
                        <Eye /> {post.published ? "Unpublish" : "Publish"}
                      </button>
                      {post.published && (
                        <a
                          className="btn btn-ghost btn-icon"
                          href={withBase(`blog/post.html?slug=${encodeURIComponent(post.slug)}`)}
                          target="_blank"
                          rel="noreferrer"
                          title="View live"
                        >
                          <ExternalLink />
                        </a>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => onEdit(post.id)}
                        title="Edit"
                      >
                        <Pencil />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-icon"
                        onClick={() => setConfirming(post.id)}
                        title="Delete"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
