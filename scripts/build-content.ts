import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { marked } from 'marked';
import katex from 'katex';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-jsx.js';
import 'prismjs/components/prism-tsx.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-scss.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-markdown.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-ruby.js';

const ROOT_DIR = process.cwd();
const POSTS_DIR = path.join(ROOT_DIR, '_posts');
const TABS_DIR = path.join(ROOT_DIR, '_tabs');
const DATA_DIR = path.join(ROOT_DIR, '_data');
const CONFIG_FILE = path.join(ROOT_DIR, '_config.yml');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src', 'content');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface SiteConfig {
  title: string;
  tagline: string;
  description: string;
  url: string;
  lang: string;
  timezone: string;
  avatar: string;
  cdn: string;
  theme_mode: string;
  toc: boolean;
  github?: { username: string };
  twitter?: { username: string };
  social?: {
    name: string;
    email: string;
    fediverse_handle?: string;
    links?: string[];
  };
  contact?: Array<{ type: string; icon: string; url?: string; noblank?: boolean }>;
  share?: { platforms: Array<{ type: string; icon: string; link: string }> };
  authors?: Record<string, { name: string; twitter?: string; url?: string }>;
  locales?: Record<string, any>;
}

function loadSiteConfig(): SiteConfig {
  let config: any = {};
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    config = yaml.load(raw) || {};
  }

  // Load _data/contact.yml
  const contactFile = path.join(DATA_DIR, 'contact.yml');
  if (fs.existsSync(contactFile)) {
    config.contact = yaml.load(fs.readFileSync(contactFile, 'utf-8'));
  }

  // Load _data/share.yml
  const shareFile = path.join(DATA_DIR, 'share.yml');
  if (fs.existsSync(shareFile)) {
    config.share = yaml.load(fs.readFileSync(shareFile, 'utf-8'));
  }

  // Load _data/authors.yml
  const authorsFile = path.join(DATA_DIR, 'authors.yml');
  if (fs.existsSync(authorsFile)) {
    config.authors = yaml.load(fs.readFileSync(authorsFile, 'utf-8'));
  }

  // Load default locale _data/locales/en.yml
  const localeFile = path.join(DATA_DIR, 'locales', `${config.lang || 'en'}.yml`);
  if (fs.existsSync(localeFile)) {
    config.locales = yaml.load(fs.readFileSync(localeFile, 'utf-8'));
  }

  return config;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface PostItem {
  slug: string;
  url: string;
  title: string;
  date: string;
  updated?: string;
  author: {
    name: string;
    url?: string;
    twitter?: string;
  };
  categories: string[];
  tags: string[];
  pin: boolean;
  math: boolean;
  mermaid: boolean;
  image?: {
    path: string;
    lqip?: string;
    alt?: string;
  };
  description: string;
  excerpt: string;
  toc: TocItem[];
  hasToc: boolean;
  readingTime: {
    words: number;
    minutes: number;
  };
  html: string;
}

function resolveMediaUrl(rawUrl: string, cdn: string, mediaSubpath?: string): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
    return rawUrl;
  }
  let p = rawUrl;
  if (mediaSubpath && !p.startsWith('/')) {
    p = `/${mediaSubpath.replace(/^\/|\/$/g, '')}/${p}`;
  }
  if (cdn && p.startsWith('/')) {
    return `${cdn.replace(/\/$/, '')}${p}`;
  }
  return p;
}

function processMarkdown(content: string, cdn: string, mediaSubpath?: string) {
  const toc: TocItem[] = [];
  const footnotes: { id: string; num: number; content: string }[] = [];
  let footnoteCounter = 0;
  const footnoteMap: Record<string, number> = {};

  // Clean markdownlint comments
  let text = content
    .replace(/<!--\s*markdownlint-capture\s*-->/g, '')
    .replace(/<!--\s*markdownlint-disable[^-]*-->/g, '')
    .replace(/<!--\s*markdownlint-restore\s*-->/g, '');

  // Extract footnotes definitions: [^footnote]: text
  text = text.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, (_, id, fnContent) => {
    if (!footnoteMap[id]) {
      footnoteCounter++;
      footnoteMap[id] = footnoteCounter;
    }
    footnotes.push({
      id,
      num: footnoteMap[id],
      content: fnContent.trim(),
    });
    return '';
  });

  // Replace footnote references: [^footnote]
  text = text.replace(/\[\^([^\]]+)\]/g, (_, id) => {
    if (!footnoteMap[id]) {
      footnoteCounter++;
      footnoteMap[id] = footnoteCounter;
    }
    const num = footnoteMap[id];
    return `<sup class="footnote-ref"><a href="#fn:${id}" id="fnref:${id}">${num}</a></sup>`;
  });

  // Handle filepath inline {: .filepath}
  text = text.replace(/`([^`]+)`\{:\s*\.filepath\s*\}/g, '<code class="filepath">$1</code>');

  // Handle Liquid includes: {% include embed/youtube.html id='Balreaj8Yqs' %}
  text = text.replace(/\{%\s*include\s+embed\/youtube\.html\s+id=['"]([^'"]+)['"]\s*%\}/g, (_, id) => {
    return `<div class="embed-video youtube-embed my-4"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="w-full aspect-video rounded-lg shadow"></iframe></div>`;
  });

  // Handle block math $$...$$
  text = text.replace(/\$\$\s*\n([\s\S]*?)\n\s*\$\$/g, (_, mathCode) => {
    try {
      const rendered = katex.renderToString(mathCode.trim(), { displayMode: true, throwOnError: false });
      return `\n<div class="katex-display-wrapper my-4">${rendered}</div>\n`;
    } catch {
      return `\n<div class="katex-display-wrapper my-4">$$${mathCode}$$</div>\n`;
    }
  });

  // Handle inline math $...$
  text = text.replace(/\$([^\$\n]+)\$/g, (_, mathCode) => {
    try {
      return katex.renderToString(mathCode.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `$${mathCode}$`;
    }
  });

  // Handle Chirpy prompt blockquotes:
  // > text
  // {: .prompt-tip }
  text = text.replace(
    /(?:^|\n)((?:> [^\n]*\n?)+)\{:\s*\.prompt-(tip|info|warning|danger)\s*\}/g,
    (_, quoteLines, promptType) => {
      const innerText = quoteLines
        .split('\n')
        .map((l: string) => l.replace(/^>\s?/, ''))
        .join('\n')
        .trim();
      return `\n<div class="prompt-${promptType} prompt-box my-4"><div class="prompt-icon"></div><div class="prompt-content">${marked.parse(innerText)}</div></div>\n`;
    }
  );

  // Configure marked custom renderer
  const renderer = new marked.Renderer();

  // Headings
  renderer.heading = ({ text: headingText, depth }: { text: string; depth: number }) => {
    let rawText = headingText;
    const skipToc = rawText.includes('data-toc-skip');
    rawText = rawText.replace(/\{:\s*[^}]*\}/g, '').trim();
    const plainText = rawText.replace(/<[^>]*>/g, '').trim();
    const id = slugify(plainText);

    if (!skipToc && (depth === 2 || depth === 3 || depth === 4)) {
      toc.push({
        id,
        text: plainText,
        level: depth,
      });
    }

    return `<h${depth} id="${id}" class="group relative">${rawText}<a href="#${id}" class="anchor-link ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-link" aria-label="Anchor">#</a></h${depth}>`;
  };

  // Code blocks
  renderer.code = ({ text: codeText, lang }: { text: string; lang?: string }) => {
    const rawLang = lang || 'plaintext';
    let displayLang = rawLang.toLowerCase();
    let fileName = '';

    if (displayLang.includes('file=')) {
      const match = displayLang.match(/file=['"]?([^'"]+)['"]?/);
      if (match) {
        fileName = match[1];
        displayLang = displayLang.replace(/file=['"]?[^'"]+['"]?/, '').trim();
      }
    }

    if (displayLang === 'mermaid') {
      return `<div class="mermaid-wrapper my-6 flex justify-center"><pre class="mermaid">${codeText}</pre></div>`;
    }

    let highlighted = codeText;
    const prismLang = Prism.languages[displayLang] || Prism.languages.plaintext;
    if (prismLang) {
      try {
        highlighted = Prism.highlight(codeText, prismLang, displayLang);
      } catch {
        highlighted = codeText;
      }
    }

    const lines = highlighted.split('\n');
    const lineNumbersHtml = lines
      .map((_, i) => `<span class="lineno">${i + 1}</span>`)
      .join('\n');
    const codeLinesHtml = lines.map((line) => `<span class="line">${line || ' '}</span>`).join('\n');

    const labelText = fileName ? fileName : displayLang !== 'plaintext' ? displayLang.toUpperCase() : '';
    const labelIcon = fileName ? 'fa-regular fa-file-code' : 'fa-solid fa-code';

    return `
<div class="code-block-wrapper language-${displayLang} my-4 rounded-lg overflow-hidden border border-main-border bg-card-bg shadow-sm">
  <div class="code-header flex items-center justify-between px-4 py-2 bg-sidebar-bg border-b border-main-border text-xs text-text-muted">
    <div class="code-header-left flex items-center gap-2">
      <span class="code-dots flex gap-1.5 mr-2">
        <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/70 inline-block"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/70 inline-block"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#27c93f]/70 inline-block"></span>
      </span>
      ${labelText ? `<span class="code-label flex items-center gap-1.5 font-mono font-medium"><i class="${labelIcon}"></i>${labelText}</span>` : ''}
    </div>
    <button class="code-copy-btn p-1.5 rounded hover:bg-sidebar-hover text-text-muted hover:text-text transition-colors" data-code="${encodeURIComponent(codeText)}" title="Copy code" aria-label="Copy code">
      <i class="fa-regular fa-clipboard"></i>
    </button>
  </div>
  <div class="code-body flex overflow-x-auto text-sm font-mono p-4">
    <div class="line-numbers select-none text-right pr-4 text-text-muted/40 border-r border-main-border/30 flex flex-col font-mono text-xs leading-6">
      ${lineNumbersHtml}
    </div>
    <pre class="code-content pl-4 m-0 overflow-x-auto flex-1 font-mono text-xs leading-6"><code>${codeLinesHtml}</code></pre>
  </div>
</div>`;
  };

  // Image renderer
  renderer.image = ({ href, title, text: imgAlt }: { href: string; title?: string | null; text: string }) => {
    let resolvedSrc = resolveMediaUrl(href, cdn, mediaSubpath);
    let classes = 'preview-img rounded-lg shadow-sm';
    let width = '';
    let height = '';
    let alt = imgAlt || '';

    return `
<figure class="post-img-figure my-6 text-center">
  <div class="img-wrapper inline-block cursor-zoom-in group relative overflow-hidden rounded-lg">
    <img src="${resolvedSrc}" alt="${alt}" ${width ? `width="${width}"` : ''} ${height ? `height="${height}"` : ''} class="${classes} max-w-full h-auto transition-transform duration-300 group-hover:scale-[1.01]" loading="lazy" />
  </div>
  ${alt && alt !== 'Desktop View' ? `<figcaption class="text-xs text-text-muted mt-2 italic">${alt}</figcaption>` : ''}
</figure>`;
  };

  marked.use({ renderer });
  let html = marked.parse(text) as string;

  // Post process image attributes
  html = html.replace(
    /<figure[^>]*>[\s\S]*?<\/figure>\s*\{:\s*([^}]+)\s*\}/g,
    (match, attrs) => {
      let figureHtml = match.replace(/\{:\s*[^}]*\}/, '');
      const isLight = attrs.includes('.light');
      const isDark = attrs.includes('.dark');
      const isShadow = attrs.includes('.shadow');
      const isLeft = attrs.includes('.left');
      const isRight = attrs.includes('.right');
      const w50 = attrs.includes('.w-50');
      const w75 = attrs.includes('.w-75');

      if (isLight) figureHtml = figureHtml.replace('<figure', '<figure class="mode-light-only"');
      if (isDark) figureHtml = figureHtml.replace('<figure', '<figure class="mode-dark-only"');
      if (isShadow) figureHtml = figureHtml.replace('preview-img', 'preview-img shadow-lg');
      if (w50) figureHtml = figureHtml.replace('<img', '<img style="max-width: 50%"');
      if (w75) figureHtml = figureHtml.replace('<img', '<img style="max-width: 75%"');
      if (isLeft) figureHtml = `<div class="float-left mr-4 mb-4">${figureHtml}</div>`;
      if (isRight) figureHtml = `<div class="float-right ml-4 mb-4">${figureHtml}</div>`;

      return figureHtml;
    }
  );

  // Append Footnotes
  if (footnotes.length > 0) {
    const fnList = footnotes
      .map(
        (fn) => `
<li id="fn:${fn.id}" class="footnote-item text-xs text-text-muted my-1">
  <span>${fn.content}</span>
  <a href="#fnref:${fn.id}" class="reversefootnote ml-1 text-link" title="Jump back">&#8617;</a>
</li>`
      )
      .join('\n');

    html += `
<div class="footnotes border-t border-main-border mt-12 pt-6">
  <h4 class="text-sm font-semibold text-text mb-3">Footnotes</h4>
  <ol class="list-decimal pl-5 space-y-1">
    ${fnList}
  </ol>
</div>`;
  }

  return { html, toc };
}

function countWords(str: string): number {
  const clean = str.replace(/<[^>]*>/g, ' ').replace(/[^\w\u4e00-\u9fa5]+/g, ' ').trim();
  const enWords = (clean.match(/[a-zA-Z0-9_-]+/g) || []).length;
  const cjkChars = (clean.match(/[\u4e00-\u9fa5]/g) || []).length;
  return enWords + cjkChars;
}

function buildContent() {
  console.log('🚀 [Rsbuild] Starting content build pipeline...');
  const siteConfig = loadSiteConfig();

  // Process Posts
  const postFiles = fs.existsSync(POSTS_DIR)
    ? fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.markdown'))
    : [];

  const posts: PostItem[] = [];
  const categoriesMap: Record<string, { name: string; count: number; posts: string[]; children: Record<string, { name: string; count: number; posts: string[] }> }> = {};
  const tagsMap: Record<string, { name: string; count: number; posts: string[] }> = {};
  const searchIndex: Array<{ id: string; title: string; snippet: string; content: string; categories: string[]; tags: string[]; url: string; date: string }> = [];

  for (const filename of postFiles) {
    const filePath = path.join(POSTS_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);

    // Extract slug from filename: YYYY-MM-DD-title.md
    const match = filename.match(/^\d{4}-\d{2}-\d{2}-(.+)\.(?:md|markdown)$/);
    const slug = match ? match[1] : filename.replace(/\.(?:md|markdown)$/, '');
    const postUrl = `/posts/${slug}/`;

    const title = frontmatter.title || slug;
    const dateStr = frontmatter.date ? String(frontmatter.date) : new Date().toISOString();
    const categories: string[] = Array.isArray(frontmatter.categories)
      ? frontmatter.categories
      : frontmatter.categories
      ? [frontmatter.categories]
      : [];
    const tags: string[] = Array.isArray(frontmatter.tags)
      ? frontmatter.tags.map((t: string) => String(t).toLowerCase())
      : frontmatter.tags
      ? [String(frontmatter.tags).toLowerCase()]
      : [];

    const pin = Boolean(frontmatter.pin);
    const math = Boolean(frontmatter.math);
    const mermaid = Boolean(frontmatter.mermaid);

    // Author
    let authorInfo = {
      name: siteConfig.social?.name || 'Author',
      url: siteConfig.social?.links?.[0] || '',
      twitter: siteConfig.twitter?.username || '',
    };
    if (frontmatter.author && siteConfig.authors && siteConfig.authors[frontmatter.author]) {
      const a = siteConfig.authors[frontmatter.author];
      authorInfo = {
        name: a.name || frontmatter.author,
        url: a.url || '',
        twitter: a.twitter || '',
      };
    }

    // Image
    let imageObj: PostItem['image'] = undefined;
    if (frontmatter.image) {
      if (typeof frontmatter.image === 'string') {
        imageObj = {
          path: resolveMediaUrl(frontmatter.image, siteConfig.cdn, frontmatter.media_subpath),
        };
      } else if (typeof frontmatter.image === 'object') {
        imageObj = {
          path: resolveMediaUrl(frontmatter.image.path, siteConfig.cdn, frontmatter.media_subpath),
          lqip: frontmatter.image.lqip,
          alt: frontmatter.image.alt,
        };
      }
    }

    // Process markdown to HTML
    const { html, toc } = processMarkdown(content, siteConfig.cdn, frontmatter.media_subpath);

    // Words & Reading Time
    const words = countWords(content);
    const minutes = Math.max(1, Math.ceil(words / 200));

    // Excerpt / Description
    const description = frontmatter.description || '';
    const cleanExcerpt = content
      .replace(/!\[[^\]]*\]\([^)]*\)(\{:[^}]*\})?/g, '')
      .replace(/\[\^[^\]]+\]/g, '')
      .replace(/[#*`~_]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 220);

    const postItem: PostItem = {
      slug,
      url: postUrl,
      title,
      date: dateStr,
      updated: frontmatter.updated ? String(frontmatter.updated) : undefined,
      author: authorInfo,
      categories,
      tags,
      pin,
      math,
      mermaid,
      image: imageObj,
      description,
      excerpt: description || cleanExcerpt,
      toc,
      hasToc: frontmatter.toc !== false && toc.length > 0,
      readingTime: { words, minutes },
      html,
    };

    posts.push(postItem);

    // Populate categories tree
    if (categories.length > 0) {
      const topCat = categories[0];
      if (!categoriesMap[topCat]) {
        categoriesMap[topCat] = { name: topCat, count: 0, posts: [], children: {} };
      }
      categoriesMap[topCat].count++;
      categoriesMap[topCat].posts.push(slug);

      if (categories.length > 1) {
        const subCat = categories[1];
        if (!categoriesMap[topCat].children[subCat]) {
          categoriesMap[topCat].children[subCat] = { name: subCat, count: 0, posts: [] };
        }
        categoriesMap[topCat].children[subCat].count++;
        categoriesMap[topCat].children[subCat].posts.push(slug);
      }
    }

    // Populate tags map
    for (const t of tags) {
      if (!tagsMap[t]) {
        tagsMap[t] = { name: t, count: 0, posts: [] };
      }
      tagsMap[t].count++;
      tagsMap[t].posts.push(slug);
    }

    // Populate search index
    searchIndex.push({
      id: slug,
      title,
      snippet: description || cleanExcerpt,
      content: content.slice(0, 5000),
      categories,
      tags,
      url: postUrl,
      date: dateStr,
    });
  }

  // Sort posts: pinned first, then newest date
  posts.sort((a, b) => {
    if (a.pin && !b.pin) return -1;
    if (!a.pin && b.pin) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Build Archives grouping
  const archivesGroup: Record<string, { year: string; posts: Array<{ slug: string; title: string; date: string; url: string }> }> = {};
  for (const p of posts) {
    const y = new Date(p.date).getFullYear().toString();
    if (!archivesGroup[y]) {
      archivesGroup[y] = { year: y, posts: [] };
    }
    archivesGroup[y].posts.push({
      slug: p.slug,
      title: p.title,
      date: p.date,
      url: p.url,
    });
  }

  const archives = Object.values(archivesGroup).sort((a, b) => Number(b.year) - Number(a.year));

  // Process Tabs
  const tabs: Record<string, { title: string; icon?: string; order?: number; html?: string }> = {};
  if (fs.existsSync(TABS_DIR)) {
    const tabFiles = fs.readdirSync(TABS_DIR).filter((f) => f.endsWith('.md'));
    for (const tf of tabFiles) {
      const tabName = tf.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(TABS_DIR, tf), 'utf-8');
      const { data: frontmatter, content } = matter(raw);
      const { html } = processMarkdown(content, siteConfig.cdn);
      tabs[tabName] = {
        title: frontmatter.title || tabName.charAt(0).toUpperCase() + tabName.slice(1),
        icon: frontmatter.icon,
        order: frontmatter.order,
        html,
      };
    }
  }

  // Write outputs
  fs.writeFileSync(path.join(OUTPUT_DIR, 'site.json'), JSON.stringify(siteConfig, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'posts.json'), JSON.stringify(posts, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'categories.json'), JSON.stringify(categoriesMap, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'tags.json'), JSON.stringify(tagsMap, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'archives.json'), JSON.stringify(archives, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'tabs.json'), JSON.stringify(tabs, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'search-index.json'), JSON.stringify(searchIndex, null, 2));

  console.log(`✅ [Rsbuild] Successfully generated content for ${posts.length} posts, ${Object.keys(categoriesMap).length} categories, ${Object.keys(tagsMap).length} tags, ${Object.keys(tabs).length} tabs.`);
}

buildContent();
