import { useCallback, useMemo, useState } from "react";
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";

import {
  createBook,
  deleteBook,
  getBookStats,
  getBooks,
  updateBook,
  uploadImage,
} from "@/admin/lib/api";
import { Empty, ErrorNotice, Field, Panel, PanelSkeleton, Segmented, Stat, Switch } from "@/admin/components/ui";
import { useAsync } from "@/admin/lib/useAdmin";
import { num, parseTags } from "@/admin/lib/format";

const STATUSES = [
  { value: "read", label: "Read" },
  { value: "reading", label: "Reading" },
  { value: "to-read", label: "To read" },
];

const EMPTY = {
  title: "",
  author: "",
  status: "reading",
  rating: "",
  category: "",
  review: "",
  tags: "",
  cover_image_url: "",
  visible: true,
};

function toForm(book) {
  if (!book) return { ...EMPTY };
  return {
    title: book.title || "",
    author: book.author || "",
    status: book.status || "reading",
    rating: book.rating ?? "",
    category: book.category || "",
    review: book.review || "",
    tags: (book.tags || []).join(", "),
    cover_image_url: book.cover_image_url || "",
    visible: book.visible !== false,
  };
}

export function Reading({ toast }) {
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null); // null | "new" | book id
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async (signal) => {
    const [books, stats] = await Promise.all([
      getBooks(signal),
      getBookStats(signal).catch(() => null),
    ]);
    return { books: books || [], stats };
  }, []);

  const { status, data, error, reload } = useAsync(load);

  const books = useMemo(() => {
    if (!data) return [];
    return data.books.filter((book) => (filter === "all" ? true : book.status === filter));
  }, [data, filter]);

  if (status === "loading") {
    return (
      <div className="admin-screen">
        <Panel title="Bookshelf">
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

  function startEdit(book) {
    setEditing(book ? book.id : "new");
    setForm(toForm(book));
    setSaveError(null);
  }

  async function onCoverPick(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file, "book-cover");
      setForm((current) => ({
        ...current,
        cover_image_url: result.url || result.public_url || result.path,
      }));
    } catch (caught) {
      toast(caught.message || "Cover upload failed", { tone: "error" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function save() {
    if (!form.title.trim() || !form.author.trim()) {
      setSaveError(new Error("Title and author are both required."));
      return;
    }

    setSaving(true);
    setSaveError(null);

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      status: form.status,
      rating: form.rating === "" ? null : Number(form.rating),
      category: form.category.trim() || "General",
      review: form.review.trim() || null,
      tags: parseTags(form.tags),
      cover_image_url: form.cover_image_url.trim() || null,
      visible: form.visible,
    };

    try {
      if (editing === "new") await createBook(payload);
      else await updateBook(editing, payload);
      toast(editing === "new" ? "Book added" : "Book updated");
      setEditing(null);
      reload();
    } catch (caught) {
      setSaveError(caught);
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisible(book) {
    try {
      await updateBook(book.id, { visible: !book.visible });
      toast(book.visible ? "Hidden from the site" : "Now visible on the site");
      reload();
    } catch (caught) {
      toast(caught.message || "Could not update the book", { tone: "error" });
    }
  }

  async function remove(book) {
    setConfirming(null);
    try {
      await deleteBook(book.id);
      toast(`Removed "${book.title}"`);
      reload();
    } catch (caught) {
      toast(caught.message || "Could not delete the book", { tone: "error" });
    }
  }

  const stats = data.stats;

  return (
    <div className="admin-screen">
      {stats && (
        <div className="stat-strip">
          <Stat label="Read" value={num(stats.total_read)} />
          <Stat label="Currently reading" value={num(stats.currently_reading)} />
          <Stat label="To read" value={num(stats.to_read)} />
          <Stat
            label="Hidden"
            value={num(data.books.filter((book) => book.visible === false).length)}
            foot="not shown on the site"
          />
        </div>
      )}

      {editing && (
        <Panel
          title={editing === "new" ? "Add a book" : "Edit book"}
          aside={
            <span style={{ display: "inline-flex", gap: "0.4rem" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                {editing === "new" ? "Add book" : "Save"}
              </button>
            </span>
          }
        >
          {saveError && <ErrorNotice error={saveError} />}
          <div className="grid-2" style={{ gap: "1rem", marginTop: saveError ? "1rem" : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <Field label="Title" htmlFor="book-title">
                <input
                  id="book-title"
                  className="input"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </Field>
              <Field label="Author" htmlFor="book-author">
                <input
                  id="book-author"
                  className="input"
                  value={form.author}
                  onChange={(event) => setForm({ ...form, author: event.target.value })}
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                <Field label="Status" htmlFor="book-status">
                  <select
                    id="book-status"
                    className="select"
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                  >
                    {STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Rating" htmlFor="book-rating" hint="0 to 5, halves allowed.">
                  <input
                    id="book-rating"
                    className="input"
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={form.rating}
                    onChange={(event) => setForm({ ...form, rating: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Category" htmlFor="book-category">
                <input
                  id="book-category"
                  className="input"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  placeholder="Engineering"
                />
              </Field>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <Field label="Tags" htmlFor="book-tags" hint="Comma separated.">
                <input
                  id="book-tags"
                  className="input"
                  value={form.tags}
                  onChange={(event) => setForm({ ...form, tags: event.target.value })}
                />
              </Field>
              <Field label="Review" htmlFor="book-review">
                <textarea
                  id="book-review"
                  className="textarea"
                  rows={4}
                  value={form.review}
                  onChange={(event) => setForm({ ...form, review: event.target.value })}
                />
              </Field>
              <Field label="Cover image" htmlFor="book-cover">
                <input
                  id="book-cover"
                  className="input input-mono"
                  value={form.cover_image_url}
                  onChange={(event) => setForm({ ...form, cover_image_url: event.target.value })}
                  placeholder="https://…"
                />
              </Field>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <label className="btn" style={{ cursor: "pointer" }}>
                  <ImagePlus /> {uploading ? "Uploading…" : "Upload cover"}
                  <input type="file" accept="image/*" hidden onChange={onCoverPick} />
                </label>
                <Switch
                  id="book-visible"
                  checked={form.visible}
                  onChange={(checked) => setForm({ ...form, visible: checked })}
                  label="Visible on the site"
                />
              </div>
            </div>
          </div>
        </Panel>
      )}

      <Panel
        title="Bookshelf"
        note={`${num(data.books.length)} books`}
        aside={
          <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[{ value: "all", label: "All" }, ...STATUSES]}
            />
            <button type="button" className="btn btn-primary" onClick={() => startEdit(null)}>
              <Plus /> Add book
            </button>
          </span>
        }
        flush
      >
        {books.length === 0 ? (
          <Empty
            title={filter === "all" ? "No books yet" : "Nothing in this shelf"}
            hint="Books added here appear in the Reading tab of the public site unless hidden."
          />
        ) : (
          <div className="row-list">
            {books.map((book) => (
              <article className="row-item" key={book.id}>
                {book.cover_image_url ? (
                  <img className="row-cover" src={book.cover_image_url} alt="" loading="lazy" />
                ) : (
                  <span className="row-cover" aria-hidden="true" />
                )}

                <div className="row-main">
                  <span className="row-title">{book.title}</span>
                  <span className="row-meta">
                    <span>{book.author}</span>
                    <span className="chip">
                      {STATUSES.find((option) => option.value === book.status)?.label ||
                        book.status}
                    </span>
                    {book.rating ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Star size={11} /> {book.rating}
                      </span>
                    ) : null}
                    {book.visible === false && <span>Hidden</span>}
                  </span>
                </div>

                {confirming === book.id ? (
                  <span className="confirm-inline">
                    Remove this book?
                    <button type="button" className="btn btn-danger" onClick={() => remove(book)}>
                      Remove
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
                      className="btn btn-ghost btn-icon"
                      onClick={() => toggleVisible(book)}
                      title={book.visible === false ? "Show on site" : "Hide from site"}
                    >
                      {book.visible === false ? <EyeOff /> : <Eye />}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => startEdit(book)}
                      title="Edit"
                    >
                      <Pencil />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-icon"
                      onClick={() => setConfirming(book.id)}
                      title="Remove"
                    >
                      <Trash2 />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
