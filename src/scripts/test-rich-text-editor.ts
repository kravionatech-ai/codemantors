/**
 * Rich Text Editor, Markdown Parser, and HTML Sanitizer Test Suite
 */
import assert from 'node:assert/strict';
import { sanitizeHtml, isHtmlContent } from '../lib/sanitize-html';
import { markdownToHtml, isMarkdown } from '../lib/markdown-parser';

async function runTests() {
  console.log('=======================================================');
  console.log('  TESTING RICH TEXT EDITOR, SANITIZER & MARKDOWN PARSER');
  console.log('=======================================================');

  let passed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(err);
      process.exit(1);
    }
  }

  // 1. Sanitization tests
  test('Sanitizer strips malicious <script> tags and payloads', () => {
    const dirty = '<p>Hello <script>alert("xss")</script>world</p>';
    const clean = sanitizeHtml(dirty);
    assert.equal(clean, '<p>Hello world</p>');
    assert.equal(clean.includes('script'), false);
    assert.equal(clean.includes('alert'), false);
  });

  test('Sanitizer strips inline event handlers (onerror, onclick, etc.)', () => {
    const dirty = '<img src="https://example.com/pic.jpg" onerror="alert(1)" onclick="stealCookies()" alt="Nice photo" />';
    const clean = sanitizeHtml(dirty);
    assert.equal(clean.includes('onerror'), false);
    assert.equal(clean.includes('onclick'), false);
    assert.equal(clean.includes('stealCookies'), false);
    assert.equal(clean.includes('src="https://example.com/pic.jpg"'), true);
  });

  test('Sanitizer strips dangerous URL schemes (javascript:, vbscript:, data:text/html)', () => {
    const dirty = '<a href="javascript:alert(1)">Click me</a> <a href="https://example.com" target="_blank">Safe</a>';
    const clean = sanitizeHtml(dirty);
    assert.equal(clean.includes('javascript:'), false);
    assert.equal(clean.includes('https://example.com'), true);
    assert.equal(clean.includes('rel="noopener noreferrer"'), true);
  });

  test('Sanitizer preserves safe rich text tags (h1-h6, p, blockquote, code, pre, table)', () => {
    const rich = `
      <h1>Title</h1>
      <p>Intro <strong>bold</strong> <em>italic</em> <u>under</u> <del>del</del></p>
      <blockquote>A quote</blockquote>
      <pre><code>const a = 1;</code></pre>
      <table><thead><tr><th>Col</th></tr></thead><tbody><tr><td>Val</td></tr></tbody></table>
    `.trim();
    const clean = sanitizeHtml(rich);
    assert.equal(clean.includes('<h1>Title</h1>'), true);
    assert.equal(clean.includes('<strong>bold</strong>'), true);
    assert.equal(clean.includes('<blockquote>A quote</blockquote>'), true);
    assert.equal(clean.includes('<code>const a = 1;</code>'), true);
    assert.equal(clean.includes('<table>'), true);
  });

  // 2. Markdown Parser tests
  test('Markdown detector correctly recognizes legacy markdown content', () => {
    assert.equal(isMarkdown('### Module 1: Introduction\n\n- Point 1\n- Point 2'), true);
    assert.equal(isMarkdown('```javascript\nconsole.log("hello");\n```'), true);
    assert.equal(isMarkdown('| Header 1 | Header 2 |\n|---|---|\n| A | B |'), true);
    assert.equal(isMarkdown('<p>This is clean HTML with <strong>bold</strong> text</p>'), false);
    assert.equal(isMarkdown('Simple one line text'), false);
  });

  test('Markdown parser transforms headings, lists, blockquotes, bold, and links', () => {
    const md = `# Main Title\n\n## Subtitle\n\nHere is **bold** and *italic* and [CodeMentors](https://codementors.test).\n\n> Important reminder\n\n- Item A\n- Item B`;
    const html = markdownToHtml(md);
    assert.equal(html.includes('<h1'), true);
    assert.equal(html.includes('Main Title</h1>'), true);
    assert.equal(html.includes('<h2'), true);
    assert.equal(html.includes('Subtitle</h2>'), true);
    assert.equal(html.includes('<strong>bold</strong>'), true);
    assert.equal(html.includes('<em>italic</em>'), true);
    assert.equal(html.includes('href="https://codementors.test"'), true);
    assert.equal(html.includes('<blockquote'), true);
    assert.equal(html.includes('<ul'), true);
    assert.equal(html.includes('<li'), true);
  });

  test('Markdown parser transforms fenced code blocks and inline code cleanly', () => {
    const md = 'Use `npm install` to setup.\n\n```typescript\nconst status: string = "active";\n```';
    const html = markdownToHtml(md);
    assert.equal(html.includes('<code>npm install</code>'), true);
    assert.equal(html.includes('<pre'), true);
    assert.equal(html.includes('data-language="typescript"'), true);
    assert.equal(html.includes('const status: string = &quot;active&quot;;'), true);
  });

  test('Markdown parser transforms tables cleanly', () => {
    const md = '| Feature | Supported |\n| --- | --- |\n| Rich Text | Yes |\n| Markdown | Yes |';
    const html = markdownToHtml(md);
    assert.equal(html.includes('<table'), true);
    assert.equal(html.includes('Feature</th>'), true);
    assert.equal(html.includes('Supported</th>'), true);
    assert.equal(html.includes('Rich Text</td>'), true);
  });

  console.log('=======================================================');
  console.log(`  ALL ${passed} UNIT TESTS PASSED SUCCESSFULLY!`);
  console.log('=======================================================');
}

runTests();
