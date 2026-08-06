import { marked } from 'marked';

/**
 * Export document to PDF via browser/Electron print dialog
 */
export function exportToPdf(markdown, title = 'Document') {
  const htmlContent = marked.parse(markdown || '');
  const cleanTitle = (title || 'Document').replace(/\.md$/i, '');

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(cleanTitle)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.7;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 20px;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      font-weight: 700;
      margin-top: 1.4em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }
    h1 { font-size: 2.2em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; color: #6d28d9; }
    h2 { font-size: 1.6em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; color: #4c1d95; }
    h3 { font-size: 1.3em; color: #7c3aed; }
    p { margin-bottom: 1.2em; }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9em;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 2px 5px;
      border-radius: 4px;
      color: #6d28d9;
    }
    pre {
      background: #0f172a !important;
      color: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    pre code {
      background: transparent;
      border: none;
      padding: 0;
      color: inherit;
    }
    blockquote {
      border-left: 4px solid #7c3aed;
      background: #f5f3ff;
      padding: 12px 18px;
      margin: 1.5em 0;
      border-radius: 0 8px 8px 0;
      color: #4c1d95;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 14px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    @media print {
      body { background: white; color: black; }
      pre { background: #1e293b !important; color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      blockquote { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="markdown-body">
    ${htmlContent}
  </div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(fullHtml);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 300);
}

/**
 * Export document as styled standalone HTML file download
 */
export function exportToHtml(markdown, title = 'Document') {
  const htmlContent = marked.parse(markdown || '');
  const cleanTitle = (title || 'Document').replace(/\.md$/i, '');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(cleanTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    :root {
      --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0d14;
      color: #e2e8f0;
      font-family: var(--font-sans);
      line-height: 1.8;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 60px 40px;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #f8fafc;
      font-weight: 700;
      margin-top: 1.6em;
      margin-bottom: 0.6em;
    }
    h1 {
      font-size: 2.4em;
      background: linear-gradient(135deg, #a78bfa, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.4em;
    }
    h2 { font-size: 1.7em; color: #f1f5f9; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 0.3em; }
    h3 { font-size: 1.35em; color: #c084fc; }
    p { margin-bottom: 1.4em; }
    a { color: #a78bfa; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      font-family: var(--font-mono);
      font-size: 0.88em;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 3px 7px;
      border-radius: 5px;
      color: #c084fc;
    }
    pre {
      background: #10131c !important;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 20px 24px;
      overflow-x: auto;
      margin: 1.8em 0;
    }
    pre code {
      background: transparent;
      border: none;
      padding: 0;
      color: #e2e8f0;
    }
    blockquote {
      border-left: 4px solid #8b5cf6;
      background: rgba(139, 92, 246, 0.08);
      padding: 14px 22px;
      margin: 1.8em 0;
      border-radius: 0 10px 10px 0;
      color: #cbd5e1;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.8em 0;
    }
    th {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 18px;
      text-align: left;
    }
    td {
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 10px 18px;
      color: #cbd5e1;
    }
    hr {
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin: 2em 0;
    }
    img { max-width: 100%; height: auto; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    ${htmlContent}
  </div>
</body>
</html>`;

  downloadFile(`${cleanTitle}.html`, fullHtml, 'text/html;charset=utf-8;');
}

/**
 * Download raw Markdown source file
 */
export function exportToMarkdown(markdown, title = 'Document') {
  const cleanTitle = title || 'Document';
  const filename = cleanTitle.toLowerCase().endsWith('.md') ? cleanTitle : `${cleanTitle}.md`;
  downloadFile(filename, markdown || '', 'text/markdown;charset=utf-8;');
}

/**
 * Copy rendered HTML content to system clipboard
 */
export async function copyRenderedHtmlToClipboard(markdown) {
  const htmlContent = marked.parse(markdown || '');
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([htmlContent], { type: 'text/plain' });
      const data = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      });
      await navigator.clipboard.write([data]);
    } else {
      await navigator.clipboard.writeText(htmlContent);
    }
    return true;
  } catch (err) {
    console.error('Failed to copy HTML to clipboard:', err);
    try {
      await navigator.clipboard.writeText(htmlContent);
      return true;
    } catch {
      return false;
    }
  }
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 100);
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
