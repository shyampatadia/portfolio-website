import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  Loader2,
  Tag,
} from "lucide-react";

import { CodeBlock } from "@/components/ui/code-block";
import { getApiBaseUrl } from "@/utils/api";
import "./styles/globals.css";

const languageExtensions = {
  bash: "sh",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  css: "css",
  html: "html",
  java: "java",
  javascript: "js",
  js: "js",
  json: "json",
  jsx: "jsx",
  markdown: "md",
  md: "md",
  python: "py",
  py: "py",
  sql: "sql",
  text: "txt",
  tsx: "tsx",
  typescript: "ts",
  yaml: "yml",
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(value, usedIds) {
  const base = slugify(value) || "section";
  const nextCount = (usedIds.get(base) || 0) + 1;
  usedIds.set(base, nextCount);
  return nextCount === 1 ? base : `${base}-${nextCount}`;
}

function parseCodeInfo(info) {
  const parts = String(info || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const rawLanguage = parts[0] || "text";
  const language = rawLanguage.toLowerCase();
  const filename = parts.slice(1).join(" ");
  const extension = languageExtensions[language] || "txt";

  return {
    language,
    filename: filename || `snippet.${extension}`,
  };
}

function parseMarkdown(content) {
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  const usedIds = new Map();
  let paragraph = [];
  let list = null;
  let codeBlock = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    blocks.push(list);
    list = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^```(.*)$/);

    if (fenceMatch) {
      if (codeBlock) {
        blocks.push({
          type: "code",
          info: codeBlock.info,
          code: codeBlock.lines.join("\n"),
        });
        codeBlock = null;
      } else {
        flushParagraph();
        flushList();
        codeBlock = { info: fenceMatch[1], lines: [] };
      }
      return;
    }

    if (codeBlock) {
      codeBlock.lines.push(line);
      return;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const text = headingMatch[2].trim();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text,
        id: uniqueSlug(text, usedIds),
      });
      return;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "image",
        alt: imageMatch[1],
        src: imageMatch[2],
      });
      return;
    }

    const quoteMatch = trimmed.match(/^>\s?(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", text: quoteMatch[1] });
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (orderedMatch || unorderedMatch) {
      flushParagraph();
      const listType = orderedMatch ? "ordered-list" : "unordered-list";
      const item = orderedMatch ? orderedMatch[1] : unorderedMatch[1];
      if (!list || list.type !== listType) {
        flushList();
        list = { type: listType, items: [] };
      }
      list.items.push(item);
      return;
    }

    flushList();
    paragraph.push(trimmed);
  });

  if (codeBlock) {
    blocks.push({
      type: "code",
      info: codeBlock.info,
      code: codeBlock.lines.join("\n"),
    });
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInline(text) {
  const parts = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|!\[[^\]]*\]\([^)]+\))/g;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index));
    }

    const token = match[0];

    if (token.startsWith("`")) {
      parts.push(
        <code key={`${token}-${match.index}`} className="blog-inline-code">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong key={`${token}-${match.index}`}>
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      parts.push(
        <em key={`${token}-${match.index}`}>
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith("![")) {
      const image = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (image) {
        parts.push(
          <img
            key={`${token}-${match.index}`}
            className="my-4 rounded-2xl border border-slate-200"
            src={image[2]}
            alt={image[1]}
            loading="lazy"
          />,
        );
      }
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        parts.push(
          <a
            key={`${token}-${match.index}`}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
          >
            {link[1]}
          </a>,
        );
      }
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

function BlogMarkdown({ blocks }) {
  return (
    <article className="blog-post-content">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const TagName = `h${Math.min(block.level, 4)}`;
          return (
            <TagName
              key={`${block.id}-${index}`}
              id={block.id}
              className={`blog-heading blog-heading-${Math.min(block.level, 4)}`}
            >
              {renderInline(block.text)}
            </TagName>
          );
        }

        if (block.type === "paragraph") {
          return <p key={index}>{renderInline(block.text)}</p>;
        }

        if (block.type === "quote") {
          return <blockquote key={index}>{renderInline(block.text)}</blockquote>;
        }

        if (block.type === "image") {
          return (
            <figure key={index} className="blog-image-frame">
              <img src={block.src} alt={block.alt} loading="lazy" />
              {block.alt ? <figcaption>{block.alt}</figcaption> : null}
            </figure>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "code") {
          const codeInfo = parseCodeInfo(block.info);
          return (
            <div key={index} className="blog-code-block">
              <CodeBlock
                language={codeInfo.language}
                filename={codeInfo.filename}
                code={block.code}
              />
            </div>
          );
        }

        return null;
      })}
    </article>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogPostPage() {
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const slug = new URLSearchParams(window.location.search).get("slug");

    if (!slug) {
      setStatus("error");
      setError("This post link is missing a slug.");
      return undefined;
    }

    async function loadPost() {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/blog/posts/slug/${encodeURIComponent(slug)}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Post request failed with status ${response.status}`);
        }

        const nextPost = await response.json();
        if (!cancelled) {
          setPost(nextPost);
          setStatus("ready");
          document.title = `${nextPost.title} | Shyam Patadia`;
        }
      } catch (loadError) {
        if (!cancelled) {
          setStatus("error");
          setError(loadError.message);
        }
      }
    }

    loadPost();

    return () => {
      cancelled = true;
    };
  }, []);

  const blocks = useMemo(() => {
    const parsedBlocks = parseMarkdown(post?.content);
    const firstBlock = parsedBlocks[0];

    if (
      firstBlock?.type === "heading" &&
      firstBlock.level === 1 &&
      slugify(firstBlock.text) === slugify(post?.title)
    ) {
      return parsedBlocks.slice(1);
    }

    return parsedBlocks;
  }, [post?.content, post?.title]);
  const headings = useMemo(
    () =>
      blocks.filter(
        (block) => block.type === "heading" && block.level > 1 && block.level < 5,
      ),
    [blocks],
  );

  if (status === "loading") {
    return (
      <main className="blog-post-page">
        <div className="blog-post-state">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading post
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="blog-post-page">
        <a href="/#writing" className="blog-back-link">
          <ArrowLeft className="h-4 w-4" />
          Back to writing
        </a>
        <div className="blog-post-state">
          <strong>Post unavailable</strong>
          <span>{error}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="blog-post-page">
      <nav className="blog-post-nav" aria-label="Blog navigation">
        <a href="/#writing" className="blog-back-link">
          <ArrowLeft className="h-4 w-4" />
          Writing
        </a>
        <a href="/" className="blog-home-link">
          Portfolio
        </a>
      </nav>

      <article className="blog-post-article">
        <header className="blog-post-header">
          <div className="blog-post-meta">
            <span>
              <Tag className="h-4 w-4" />
              {post.category || "Writing"}
            </span>
            <span>
              <CalendarDays className="h-4 w-4" />
              {formatDate(post.published_at || post.created_at)}
            </span>
            {post.read_time ? (
              <span>
                <Clock3 className="h-4 w-4" />
                {post.read_time}
              </span>
            ) : null}
          </div>

          <h1>{post.title}</h1>
          {post.excerpt ? <p>{post.excerpt}</p> : null}

          {post.tags?.length ? (
            <div className="blog-post-tags">
              {post.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
        </header>

        <div className="blog-post-layout">
          <BlogMarkdown blocks={blocks} />

          <aside className="blog-post-toc" aria-label="Post sections">
            <div>
              <span>On this page</span>
              {headings.length ? (
                <ol>
                  {headings.slice(0, 8).map((heading) => (
                    <li key={heading.id}>
                      <a href={`#${heading.id}`}>{heading.text}</a>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>Short read</p>
              )}
              <a
                className="blog-post-source-link"
                href="/#writing"
              >
                More writing
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("blog-post-root")).render(
  <React.StrictMode>
    <BlogPostPage />
  </React.StrictMode>,
);
