import { useEffect, useMemo, useState } from "react";
import { BookmarkPlus, BookOpen, CheckCircle2 } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { getBooks, getBookStats } from "@/utils/api";
import { cn } from "@/lib/utils";

const BOOK_FILTERS = [
  { id: "all", label: "All books" },
  { id: "read", label: "Read" },
  { id: "reading", label: "Currently reading" },
  { id: "to-read", label: "To read" },
];

const STATUS_CLASS = {
  read: "is-read",
  reading: "is-reading",
  "to-read": "is-queued",
};

const STATUS_LABEL = {
  read: "Read",
  reading: "Reading",
  "to-read": "To read",
};

function truncate(text, length = 140) {
  if (!text) return "";
  return text.length > length ? `${text.substring(0, length).trimEnd()}…` : text;
}

export function BooksSection() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadBooks() {
      try {
        const [bookResponse, statsResponse] = await Promise.all([
          getBooks(),
          getBookStats(),
        ]);

        if (!cancelled) {
          setBooks(bookResponse);
          setStats(statsResponse);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError);
          setLoading(false);
        }
      }
    }

    loadBooks();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBooks = useMemo(() => {
    if (activeFilter === "all") return books;
    return books.filter((book) => book.status === activeFilter);
  }, [activeFilter, books]);

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Reading"
        title="Reading"
        description="Books that shape how I think about software, analysis, systems, and long-term craft."
      />

      <div className="reading-toolbar">
        {stats ? (
          <div className="reading-stats-strip">
            <span className="reading-stat">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <strong>{stats.total_read ?? 0}</strong>
              Completed
            </span>
            <span className="reading-stat-divider" aria-hidden="true" />
            <span className="reading-stat">
              <BookOpen className="h-4 w-4 text-sky-700" aria-hidden="true" />
              <strong>{stats.currently_reading ?? 0}</strong>
              Reading
            </span>
            <span className="reading-stat-divider" aria-hidden="true" />
            <span className="reading-stat">
              <BookmarkPlus className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <strong>{stats.to_read ?? 0}</strong>
              Queued
            </span>
          </div>
        ) : (
          <span />
        )}

        <div className="reading-filters">
          {BOOK_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "pill-nav",
                activeFilter === filter.id
                  ? "border-orange-200 bg-orange-50 text-orange-700"
                  : "hover:border-slate-300 hover:bg-white hover:text-slate-950",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
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
            <h3 className="type-card-title">Reading shelf is temporarily unavailable</h3>
            <p className="type-body-sm">{error.message}</p>
          </div>
        </div>
      ) : null}

      {!loading && !error && filteredBooks.length === 0 ? (
        <div className="quiet-panel p-6">
          <div className="space-y-2">
            <h3 className="type-card-title">No books in this view yet</h3>
            <p className="type-body-sm">
              Books in this reading state will appear here.
            </p>
          </div>
        </div>
      ) : null}

      {!loading && !error && filteredBooks.length > 0 ? (
        <div className="book-grid">
          {filteredBooks.map((book) => {
            const reviewText = truncate(book.review);
            const tags = (book.tags ?? []).slice(0, 3);

            return (
              <article key={book.id} className="book-card group">
                <div className="book-cover">
                  <span className={cn("book-status-pill", STATUS_CLASS[book.status])}>
                    {STATUS_LABEL[book.status] ?? "Unread"}
                  </span>
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title} loading="lazy" />
                  ) : (
                    <div className="book-cover-fallback">
                      <strong>{book.title}</strong>
                      <span>{book.author}</span>
                    </div>
                  )}
                </div>

                <div className="book-meta">
                  <div>
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">{book.author}</p>
                  </div>

                  {reviewText ? <p className="book-review">{reviewText}</p> : null}

                  {tags.length > 0 ? (
                    <div className="book-tags">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="subtle">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
