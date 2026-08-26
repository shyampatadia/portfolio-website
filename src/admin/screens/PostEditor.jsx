import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  Code,
  Copy,
  ExternalLink,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  Loader2,
  Quote,
  Trash2,
} from "lucide-react";

import { createPost, getPosts, updatePost, uploadImage, uploadImages } from "@/admin/lib/api";
import { ErrorNotice, Field, Notice, Panel, Segmented, Skeleton, Switch } from "@/admin/components/ui";
import { useAsync } from "@/admin/lib/useAdmin";
import { parseTags, readingTime, slugify, timeAgo } from "@/admin/lib/format";
import { inlinePattern, parseCodeInfo, parseMarkdown } from "@/lib/markdown";
import { withBase } from "@/utils/paths";

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  category: "",
  tags: "",
  content: "",
  image_url: "",
  published: false,
};

const draftKey = (postId) => (postId ? `blog_draft:${postId}` : "blog_draft");

function readDraft(postId) {
  try {
    const raw = window.localStorage.getItem(draftKey(postId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function toForm(post) {
  if (!post) return { ...EMPTY };
  return {
    title: post.title || "",
    slug: post.slug || "",
    excerpt: post.excerpt || "",
    category: post.category || "",
    tags: (post.tags || []).join(", "),
    content: post.content || "",
    image_url: post.image_url || "",
    published: Boolean(post.published),
  };
}

/* ---------- preview ---------- */

function renderInline(text, keyPrefix) {
  const parts = [];
  const pattern = inlinePattern();
  let cursor = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;

    if (token.startsWith("`")) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("![")) {
      const image = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (image) parts.push(<img key={key} src={image[2]} alt={image[1]} loading="lazy" />);
    } else if (token.startsWith("[")) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        parts.push(
          <a key={key} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>,
        );
      }
    } else if (token.startsWith("*")) {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

// Same blocks the live post page renders, wearing admin styling.
function Preview({ content }) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  if (!blocks.length) {
    return <p className="panel-note">Nothing to preview yet.</p>;
  }

  return (
    <div className="md-preview">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "heading") {
          const Tag = `h${Math.min(3, Math.max(1, block.level))}`;
          return <Tag key={key}>{renderInline(block.text, key)}</Tag>;
        }
        if (block.type === "paragraph") {
          return <p key={key}>{renderInline(block.text, key)}</p>;
        }
        if (block.type === "quote") {
          return <blockquote key={key}>{renderInline(block.text, key)}</blockquote>;
        }
        if (block.type === "image") {
          return <img key={key} src={block.src} alt={block.alt} loading="lazy" />;
        }
        if (block.type === "code") {
          const info = parseCodeInfo(block.info);
          return (
            <pre key={key}>
              <span className="panel-note" style={{ display: "block", marginBottom: "0.4rem" }}>
                {info.filename}
              </span>
              <code>{block.code}</code>
            </pre>
          );
        }
        if (block.type === "ordered-list" || block.type === "unordered-list") {
          const Tag = block.type === "ordered-list" ? "ol" : "ul";
          return (
            <Tag key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </Tag>
          );
        }
        return null;
      })}
    </div>
  );
}

/* ---------- editor ---------- */

export function PostEditor({ postId, onDone, toast }) {
  const load = useCallback(
    async (signal) => {
      if (!postId) return null;
      const list = await getPosts(signal);
      return (list.posts || []).find((post) => post.id === postId) || null;
    },
    [postId],
  );

  const { status, data: post, error, reload } = useAsync(load, [postId]);

  const [form, setForm] = useState(() => ({ ...EMPTY }));
  const [loaded, setLoaded] = useState(!postId);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [view, setView] = useState("write");
  const [autosave, setAutosave] = useState("");
  const [foundDraft, setFoundDraft] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(postId));

  const textareaRef = useRef(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (postId && status !== "ready") return;
    setForm(toForm(post));
    setLoaded(true);
    const draft = readDraft(postId);
    if (draft && (draft.title || draft.content)) setFoundDraft(draft);
  }, [post, postId, status]);

  const set = useCallback((patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
  }, []);

  // Autosave: debounced on input, plus a 30s floor, exactly as before but keyed
  // per post so an edit to one post cannot overwrite another's recovery draft.
  useEffect(() => {
    if (!dirty || !loaded) return undefined;

    const write = () => {
      if (!form.title && !form.content) return;
      try {
        window.localStorage.setItem(
          draftKey(postId),
          JSON.stringify({ ...form, savedAt: new Date().toISOString() }),
        );
        setAutosave(`Draft saved ${new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}`);
      } catch {
        setAutosave("Draft could not be saved locally");
      }
    };

    const debounce = window.setTimeout(write, 3000);
    const interval = window.setInterval(write, 30000);
    return () => {
      window.clearTimeout(debounce);
      window.clearInterval(interval);
    };
  }, [form, dirty, loaded, postId]);

  // Last line of defence against a closed tab.
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!postId && !slugTouched && form.title) {
      setForm((current) => ({ ...current, slug: slugify(current.title) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, slugTouched, postId]);

  function surround(before, after = before) {
    const node = textareaRef.current;
    if (!node) return;
    const { selectionStart: start, selectionEnd: end, value } = node;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    set({ content: next });
    window.requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function insertAtCursor(text) {
    const node = textareaRef.current;
    if (!node) {
      set({ content: `${form.content}\n${text}\n` });
      return;
    }
    const { selectionStart: start, value } = node;
    const next = `${value.slice(0, start)}${text}${value.slice(start)}`;
    set({ content: next });
    window.requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(start + text.length, start + text.length);
    });
  }

  async function onPaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (!item.type.startsWith("image/")) continue;
      const file = item.getAsFile();
      if (!file) continue;

      event.preventDefault();
      setUploading(true);
      const placeholder = `![uploading ${file.name || "image"}...]()`;
      insertAtCursor(placeholder);

      try {
        const result = await uploadImage(file, "blog");
        const url = result.url || result.public_url || result.path;
        setForm((current) => ({
          ...current,
          content: current.content.replace(placeholder, `![${file.name || "image"}](${url})`),
        }));
        toast("Image uploaded");
      } catch (caught) {
        setForm((current) => ({ ...current, content: current.content.replace(placeholder, "") }));
        toast(caught.message || "Image upload failed", { tone: "error" });
      } finally {
        setUploading(false);
      }
      return;
    }
  }

  async function onCoverPick(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file, "blog");
      set({ image_url: result.url || result.public_url || result.path });
      toast("Cover image uploaded");
    } catch (caught) {
      toast(caught.message || "Upload failed", { tone: "error" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function onGalleryPick(event) {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    setUploading(true);
    try {
      const result = await uploadImages(files);
      const urls = (result.files || result.urls || result || [])
        .map((item) => (typeof item === "string" ? item : item.url || item.public_url))
        .filter(Boolean);
      setGallery((current) => [...current, ...urls]);
      toast(`${urls.length} image${urls.length === 1 ? "" : "s"} uploaded`);
    } catch (caught) {
      toast(caught.message || "Upload failed", { tone: "error" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function save(publishState) {
    const published = publishState ?? form.published;

    if (!form.title.trim()) {
      setSaveError(new Error("A title is required."));
      return;
    }
    if (!form.slug.trim()) {
      setSaveError(new Error("A slug is required. It becomes the post's URL."));
      return;
    }
    if (!form.content.trim()) {
      setSaveError(new Error("The post body is empty."));
      return;
    }

    setSaving(true);
    setSaveError(null);

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || form.content.trim().slice(0, 180),
      content: form.content,
      category: form.category.trim() || "Writing",
      tags: parseTags(form.tags),
      published,
      image_url: form.image_url.trim() || null,
    };

    try {
      const saved = postId ? await updatePost(postId, payload) : await createPost(payload);
      savedRef.current = true;
      setDirty(false);
      try {
        window.localStorage.removeItem(draftKey(postId));
      } catch {
        /* nothing to clear */
      }
      toast(published ? "Post published" : "Saved as draft");
      onDone(saved?.id || postId);
    } catch (caught) {
      setSaveError(caught);
    } finally {
      setSaving(false);
    }
  }

  function leave() {
    if (dirty && !savedRef.current) {
      const ok = window.confirm("You have unsaved changes. Leave anyway? Your local draft is kept.");
      if (!ok) return;
    }
    onDone(null);
  }

  if (postId && status === "loading") {
    return (
      <div className="editor">
        <Skeleton height={32} width={260} />
        <Skeleton height={420} />
      </div>
    );
  }

  if (postId && status === "error" && !post) {
    return (
      <div className="editor">
        <ErrorNotice error={error} onRetry={reload} />
      </div>
    );
  }

  const words = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;

  return (
    <div className="editor">
      <div className="editor-bar">
        <button type="button" className="btn btn-ghost btn-icon" onClick={leave} title="Back">
          <ArrowLeft />
        </button>
        <h1>{postId ? "Edit post" : "New post"}</h1>
        <span className="chip">{form.published ? "Published" : "Draft"}</span>
        <span className="editor-status" style={{ opacity: autosave ? 1 : 0 }}>
          {autosave || "."}
        </span>

        <span style={{ marginLeft: "auto", display: "inline-flex", gap: "0.5rem" }}>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "write", label: "Write" },
              { value: "split", label: "Split" },
              { value: "preview", label: "Preview" },
            ]}
          />
          <button
            type="button"
            className="btn"
            onClick={() => save(false)}
            disabled={saving}
          >
            Save draft
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => save(true)}
            disabled={saving}
          >
            {saving && <Loader2 className="animate-spin" />}
            {form.published ? "Update" : "Publish"}
          </button>
        </span>
      </div>

      {foundDraft && (
        <div className="notice notice-accent">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%" }}>
            <span>
              A local draft from {timeAgo(foundDraft.savedAt)} is newer than what loaded.
            </span>
            <span style={{ marginLeft: "auto", display: "inline-flex", gap: "0.4rem" }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const { savedAt, ...rest } = foundDraft;
                  setForm((current) => ({ ...current, ...rest }));
                  setFoundDraft(null);
                  setDirty(true);
                }}
              >
                Restore it
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  try {
                    window.localStorage.removeItem(draftKey(postId));
                  } catch {
                    /* nothing to clear */
                  }
                  setFoundDraft(null);
                }}
              >
                Discard
              </button>
            </span>
          </div>
        </div>
      )}

      {saveError && <ErrorNotice error={saveError} />}

      <div className="editor-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Panel flush>
            <input
              className="input"
              style={{
                border: 0,
                background: "transparent",
                fontSize: 19,
                fontWeight: 600,
                padding: "0.9rem 1rem",
              }}
              placeholder="Post title"
              value={form.title}
              onChange={(event) => set({ title: event.target.value })}
              aria-label="Post title"
            />

            <div className="md-toolbar">
              <button type="button" onClick={() => surround("**")} title="Bold">
                <Bold />
              </button>
              <button type="button" onClick={() => surround("*")} title="Italic">
                <Italic />
              </button>
              <span className="md-toolbar-sep" />
              <button type="button" onClick={() => insertAtCursor("\n## ")} title="Heading 2">
                <Heading2 />
              </button>
              <button type="button" onClick={() => insertAtCursor("\n### ")} title="Heading 3">
                <Heading3 />
              </button>
              <span className="md-toolbar-sep" />
              <button type="button" onClick={() => surround("[", "](url)")} title="Link">
                <Link2 />
              </button>
              <button type="button" onClick={() => surround("`")} title="Inline code">
                <Code />
              </button>
              <button
                type="button"
                onClick={() => insertAtCursor("\n```language\n\n```\n")}
                title="Code block"
              >
                {"{ }"}
              </button>
              <button type="button" onClick={() => insertAtCursor("\n> ")} title="Quote">
                <Quote />
              </button>
              <button type="button" onClick={() => insertAtCursor("\n- ")} title="List">
                <List />
              </button>
              <span className="md-toolbar-sep" />
              <label className="btn btn-ghost" style={{ height: 26, cursor: "pointer" }}>
                <ImagePlus /> Images
                <input type="file" accept="image/*" multiple hidden onChange={onGalleryPick} />
              </label>
              {uploading && (
                <span className="editor-status" style={{ alignSelf: "center", marginLeft: 6 }}>
                  Uploading…
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: view === "split" ? "1fr 1fr" : "1fr",
              }}
            >
              {view !== "preview" && (
                <textarea
                  ref={textareaRef}
                  className="md-input"
                  value={form.content}
                  onChange={(event) => set({ content: event.target.value })}
                  onPaste={onPaste}
                  placeholder="Write in markdown. Paste an image straight in and it uploads."
                  aria-label="Post body"
                  spellCheck
                />
              )}
              {view !== "write" && (
                <div style={{ borderLeft: view === "split" ? "1px solid var(--line)" : "none" }}>
                  <Preview content={form.content} />
                </div>
              )}
            </div>
          </Panel>

          {gallery.length > 0 && (
            <Panel title="Uploaded images" note="click to copy markdown">
              <div className="thumb-grid">
                {gallery.map((url) => (
                  <div className="thumb" key={url}>
                    <img src={url} alt="" />
                    <button
                      type="button"
                      onClick={() => {
                        const markdown = `![](${url})`;
                        navigator.clipboard?.writeText(markdown);
                        insertAtCursor(`\n${markdown}\n`);
                        toast("Inserted and copied");
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <aside className="editor-side">
          <Panel title="Publishing">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <Switch
                id="post-published"
                checked={form.published}
                onChange={(checked) => set({ published: checked })}
                label={form.published ? "Visible on the site" : "Hidden from the site"}
              />
              <Field label="Slug" htmlFor="post-slug" hint="Becomes the post URL.">
                <input
                  id="post-slug"
                  className="input input-mono"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    set({ slug: slugify(event.target.value) });
                  }}
                />
              </Field>
              <Field label="Category" htmlFor="post-category">
                <input
                  id="post-category"
                  className="input"
                  value={form.category}
                  onChange={(event) => set({ category: event.target.value })}
                  placeholder="Engineering"
                />
              </Field>
              <Field label="Tags" htmlFor="post-tags" hint="Comma separated.">
                <input
                  id="post-tags"
                  className="input"
                  value={form.tags}
                  onChange={(event) => set({ tags: event.target.value })}
                  placeholder="python, testing"
                />
              </Field>
              <p className="panel-note">
                {words} words · about {readingTime(form.content)} to read
              </p>
              {postId && form.published && (
                <a
                  className="btn btn-ghost"
                  href={withBase(`blog/post.html?slug=${encodeURIComponent(form.slug)}`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View live <ExternalLink />
                </a>
              )}
            </div>
          </Panel>

          <Panel title="Excerpt" note="shown in the list">
            <textarea
              className="textarea"
              rows={4}
              value={form.excerpt}
              onChange={(event) => set({ excerpt: event.target.value })}
              placeholder="One or two sentences. Falls back to the opening of the post."
              aria-label="Excerpt"
            />
          </Panel>

          <Panel title="Cover image">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {form.image_url ? (
                <div className="thumb" style={{ aspectRatio: "16/9" }}>
                  <img src={form.image_url} alt="" />
                  <button type="button" onClick={() => set({ image_url: "" })}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              ) : (
                <p className="panel-note">No cover set.</p>
              )}
              <input
                className="input input-mono"
                value={form.image_url}
                onChange={(event) => set({ image_url: event.target.value })}
                placeholder="https://…"
                aria-label="Cover image URL"
              />
              <label className="btn" style={{ cursor: "pointer" }}>
                <ImagePlus /> Upload cover
                <input type="file" accept="image/*" hidden onChange={onCoverPick} />
              </label>
            </div>
          </Panel>

          {!postId && (
            <Notice>
              Drafts autosave to this browser while you type, so a reload or a crash will not lose
              the text. Saving sends it to the database.
            </Notice>
          )}
        </aside>
      </div>
    </div>
  );
}
