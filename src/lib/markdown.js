/*
  Block-level markdown parsing shared by the public post page and the admin
  editor's preview. Keeping one parser is what makes the preview honest: both
  surfaces get identical blocks and only the skin differs.

  Rendering stays with each caller, since the blog page and the editor use
  different component vocabularies.
*/

export const languageExtensions = {
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

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(value, usedIds) {
  const base = slugify(value) || "section";
  const nextCount = (usedIds.get(base) || 0) + 1;
  usedIds.set(base, nextCount);
  return nextCount === 1 ? base : `${base}-${nextCount}`;
}

export function parseCodeInfo(info) {
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

// Inline spans a renderer needs to tokenize: code, bold, italic, links, images.
// Built fresh per call because a shared /g regex carries lastIndex between uses.
export function inlinePattern() {
  return /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|!\[[^\]]*\]\([^)]+\))/g;
}

export function parseMarkdown(content) {
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
