import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';

// ─── Config ──────────────────────────────────────────────────────────────────

const FONT = '17px "Helvetica Neue", Helvetica, Arial, sans-serif';
const LINE_HEIGHT = 28; // px
const GIF_GAP = 12;     // px clearance around GIF on each side
const GIF_ASPECT = 1;   // width / height (square GIF)
const GIF_MIN_WIDTH = 60;

const SAMPLE_TEXT =
  'We are living through one of the most consequential technological shifts in human history. ' +
  'Artificial intelligence — once the domain of science fiction — has quietly become infrastructure. ' +
  'It routes our traffic, filters our inboxes, suggests our next watch, and increasingly, writes our code. ' +
  'The question is no longer whether AI will reshape society, but how fast, and on whose terms. ' +
  'Large language models crossed a threshold in 2022 that few researchers had predicted so soon: ' +
  'they became useful to ordinary people. Not just researchers or engineers, but writers, lawyers, ' +
  'teachers, and students. The barrier between "knowing how to use a computer" and ' +
  '"having access to a capable reasoning system" collapsed almost overnight. ' +
  'This is not without precedent. The printing press did not merely speed up the copying of books — ' +
  'it restructured who could produce knowledge and who could consume it. ' +
  'The internet did not merely accelerate communication — it dissolved the geography of information. ' +
  'AI is doing something similar to cognition itself: making certain kinds of thinking cheap, fast, and abundant. ' +
  'The risks are real and should not be minimised. Misinformation scales effortlessly. ' +
  'Bias baked into training data propagates silently into decisions. ' +
  'Entire categories of knowledge work face displacement faster than retraining programmes can respond. ' +
  'And the concentration of AI capability in a handful of companies raises questions about ' +
  'power and accountability that democratic institutions are only beginning to grapple with. ' +
  'Yet the opportunity is equally real. AI-assisted medicine is catching cancers earlier. ' +
  'Climate models are running faster. Students in under-resourced schools have access to ' +
  'patient, personalised tutoring for the first time. ' +
  'The challenge of our moment is not to choose between enthusiasm and alarm, ' +
  'but to build the governance, the norms, and the tools that let us capture the benefits ' +
  'while containing the harms. That work is harder than building the models themselves — ' +
  'and it is already overdue. 🤖';

// ─── State ───────────────────────────────────────────────────────────────────

// GIF position and size — all in px, relative to container
let gif = { x: 0, y: 0, width: 160, height: 160 };

// Prepare text once
const prepared = prepareWithSegments(SAMPLE_TEXT, FONT);

// ─── DOM refs ────────────────────────────────────────────────────────────────

const container    = document.getElementById('container');
const gifWrapper   = document.getElementById('gifWrapper');
const resizeHandle = document.getElementById('resizeHandle');
const linesContainer = document.getElementById('linesContainer');

// ─── Layout ──────────────────────────────────────────────────────────────────

/**
 * For a text line occupying [lineY, lineY+LINE_HEIGHT), compute the segments
 * of horizontal space that don't overlap the GIF (with gap).
 *
 * Returns an array of { x, maxWidth } regions, left-to-right.
 * If the line doesn't overlap the GIF at all, returns the full container width.
 */
function getLineRegions(lineY, containerWidth) {
  const lineTop    = lineY;
  const lineBottom = lineY + LINE_HEIGHT;

  const gifLeft   = gif.x - GIF_GAP;
  const gifRight  = gif.x + gif.width + GIF_GAP;
  const gifTop    = gif.y - GIF_GAP;
  const gifBottom = gif.y + gif.height + GIF_GAP;

  const overlapsVertically = lineTop < gifBottom && lineBottom > gifTop;

  if (!overlapsVertically) {
    return [{ x: 0, maxWidth: containerWidth }];
  }

  // The GIF occludes [gifLeft, gifRight] horizontally.
  // Available regions: [0, gifLeft] and [gifRight, containerWidth]
  const regions = [];

  const leftWidth = Math.max(0, gifLeft);
  if (leftWidth >= 40) {
    regions.push({ x: 0, maxWidth: leftWidth });
  }

  const rightStart = Math.min(containerWidth, gifRight);
  const rightWidth = containerWidth - rightStart;
  if (rightWidth >= 40) {
    regions.push({ x: rightStart, maxWidth: rightWidth });
  }

  // If both sides are too narrow, fall back to full width (GIF overlaps most of line)
  if (regions.length === 0) {
    return [{ x: 0, maxWidth: containerWidth }];
  }

  return regions;
}

function renderLayout() {
  const containerWidth = container.clientWidth;

  // Clamp GIF within container
  const maxGifWidth = Math.floor(containerWidth * 0.55);
  gif.width  = Math.max(GIF_MIN_WIDTH, Math.min(gif.width, maxGifWidth));
  gif.height = Math.round(gif.width / GIF_ASPECT);
  gif.x = Math.max(0, Math.min(gif.x, containerWidth - gif.width));
  // y clamped after we know total height — just keep it non-negative for now
  gif.y = Math.max(0, gif.y);

  // Apply GIF position/size to DOM
  gifWrapper.style.left   = gif.x + 'px';
  gifWrapper.style.top    = gif.y + 'px';
  gifWrapper.style.width  = gif.width + 'px';
  gifWrapper.style.height = gif.height + 'px';

  // Walk lines — for each line pick the largest available region
  const lines = [];
  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = 0;

  while (true) {
    const regions = getLineRegions(y, containerWidth);

    // Pick the widest region to lay the next line into
    let best = regions[0];
    for (const r of regions) {
      if (r.maxWidth > best.maxWidth) best = r;
    }

    const line = layoutNextLine(prepared, cursor, best.maxWidth);
    if (line === null) break;

    lines.push({ text: line.text, x: best.x, y });
    cursor = line.end;
    y += LINE_HEIGHT;
  }

  const totalHeight = Math.max(y, gif.y + gif.height + GIF_GAP);

  // Clamp GIF y now that we know total height
  gif.y = Math.min(gif.y, totalHeight - gif.height);
  gifWrapper.style.top = gif.y + 'px';

  // Update DOM lines — reuse existing spans
  const existing = linesContainer.children;
  for (let i = 0; i < lines.length; i++) {
    let span = existing[i];
    if (!span) {
      span = document.createElement('span');
      span.className = 'text-line';
      linesContainer.appendChild(span);
    }
    span.textContent = lines[i].text;
    span.style.left  = lines[i].x + 'px';
    span.style.top   = lines[i].y + 'px';
  }
  while (linesContainer.children.length > lines.length) {
    linesContainer.removeChild(linesContainer.lastChild);
  }

  container.style.height = totalHeight + 'px';
}

// ─── Drag GIF to move ────────────────────────────────────────────────────────

let isMoving = false;
let moveOffsetX = 0;
let moveOffsetY = 0;

gifWrapper.addEventListener('pointerdown', (e) => {
  // Don't start a move drag when clicking the resize handle
  if (e.target === resizeHandle || resizeHandle.contains(e.target)) return;

  isMoving = true;
  const rect = container.getBoundingClientRect();
  moveOffsetX = e.clientX - rect.left - gif.x;
  moveOffsetY = e.clientY - rect.top  - gif.y;
  gifWrapper.setPointerCapture(e.pointerId);
  gifWrapper.classList.add('dragging');
  e.preventDefault();
});

gifWrapper.addEventListener('pointermove', (e) => {
  if (!isMoving) return;
  const rect = container.getBoundingClientRect();
  gif.x = e.clientX - rect.left - moveOffsetX;
  gif.y = e.clientY - rect.top  - moveOffsetY;
  renderLayout();
});

gifWrapper.addEventListener('pointerup', () => {
  isMoving = false;
  gifWrapper.classList.remove('dragging');
});

gifWrapper.addEventListener('pointercancel', () => {
  isMoving = false;
  gifWrapper.classList.remove('dragging');
});

// ─── Drag resize handle ──────────────────────────────────────────────────────

let isResizing = false;
let resizeStartX = 0;
let resizeStartWidth = 0;

resizeHandle.addEventListener('pointerdown', (e) => {
  isResizing = true;
  resizeStartX = e.clientX;
  resizeStartWidth = gif.width;
  resizeHandle.setPointerCapture(e.pointerId);
  gifWrapper.classList.add('dragging');
  e.preventDefault();
  e.stopPropagation(); // don't trigger move drag
});

resizeHandle.addEventListener('pointermove', (e) => {
  if (!isResizing) return;
  const delta = e.clientX - resizeStartX;
  gif.width  = resizeStartWidth + delta;
  gif.height = Math.round(gif.width / GIF_ASPECT);
  renderLayout();
});

resizeHandle.addEventListener('pointerup', () => {
  isResizing = false;
  gifWrapper.classList.remove('dragging');
});

resizeHandle.addEventListener('pointercancel', () => {
  isResizing = false;
  gifWrapper.classList.remove('dragging');
});

// ─── Resize observer ─────────────────────────────────────────────────────────

const ro = new ResizeObserver(() => renderLayout());
ro.observe(container);

// ─── Initial render ──────────────────────────────────────────────────────────

document.fonts.ready.then(() => {
  // Start GIF near top-left with a small inset
  gif.x = 0;
  gif.y = 0;
  gif.width = 200;
  gif.height = Math.round(gif.width / GIF_ASPECT);
  renderLayout();
});
