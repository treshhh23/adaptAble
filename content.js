/******************************************************************************
 * content.js
 * 
 * 1) Listens for Ctrl + "+" and Ctrl + "-" to detect/log browser zoom usage.
 * 2) Provides separate functions for toggling High Contrast & Readable Font,
 *    which you can call from a popup or background script (not from Ctrl +/−).
 * 3) Demonstrates storing interaction data in an in-memory SQLite DB (sql.js).
 * 4) (Optional) Includes a small TensorFlow.js model for accessibility predictions.
 ******************************************************************************/

/////////////////////
// Global Variables //
/////////////////////
let db = null;                 // SQLite Database instance (in-memory via sql.js)
let model = null;              // TensorFlow.js model (if you want to train/predict)
let startTime = Date.now();

// Track how often user uses Ctrl + or Ctrl - (zoom actions)
let zoomInCount = 0;
let zoomOutCount = 0;

// Toggle states for High Contrast & Readable Font (managed by separate functions)
let isHighContrast = false;
let isReadableFont = false;

/////////////////////////////////////////////
// 1) Initialize sql.js & Create a Table  //
/////////////////////////////////////////////
async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => chrome.runtime.getURL('sql-wasm.wasm')
  });
  db = new SQL.Database();
  db.run(`
    CREATE TABLE IF NOT EXISTS user_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zoomInCount INT,
      zoomOutCount INT,
      timeOnPage INT
      /* Add columns for toggleContrastCount, toggleFontCount, etc. if desired. */
    )
  `);
  console.log("[AI Accessibility] SQLite DB initialized (in memory).");
}

////////////////////////////
// 2) Logging Interactions //
////////////////////////////
function logInteraction(zoomIn, zoomOut, timeOnPage) {
  // Insert basic info about user's zoom usage, time on page
  const stmt = db.prepare(`
    INSERT INTO user_interactions
    (zoomInCount, zoomOutCount, timeOnPage)
    VALUES (?, ?, ?)
  `);
  stmt.run([zoomIn, zoomOut, timeOnPage]);
  stmt.free();
  console.log("[AI Accessibility] Interaction logged:", {
    zoomIn,
    zoomOut,
    timeOnPage
  });
}

function getAllData() {
  const stmt = db.prepare("SELECT * FROM user_interactions");
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/////////////////////////////////////////////
// 3) (Optional) TensorFlow.js Model Setup //
/////////////////////////////////////////////
function createAccessibilityModel() {
  // Example: inputShape could be [2] for (zoomInCount, zoomOutCount)
  // or more features if you track other data. Output can be any # of classes.
  // This is purely illustrative. Customize as needed.
  const m = tf.sequential();
  m.add(tf.layers.dense({units: 8, activation: 'relu', inputShape: [2]}));
  m.add(tf.layers.dense({units: 8, activation: 'relu'}));
  m.add(tf.layers.dense({units: 2, activation: 'softmax'})); 
  // e.g., 2 classes (0 or 1) for a simple classification.

  m.compile({
    optimizer: 'adam',
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
  });
  console.log("[AI Accessibility] Model created.");
  return m;
}

// Train model using the data in user_interactions (illustrative)
async function trainModel(m) {
  const rows = getAllData();
  if (rows.length < 2) {
    console.warn("[AI Accessibility] Not enough data to train (need at least 2 rows).");
    return;
  }

  // Suppose each row has (zoomInCount, zoomOutCount). You decide how to build X and y.
  const Xs = [];
  const ys = []; // label

  for (const r of rows) {
    // Example: X => [zoomInCount, zoomOutCount], y => dummy label 0 or 1
    Xs.push([r.zoomInCount, r.zoomOutCount]);
    ys.push(0); // or some real label, if you have one
  }

  const X = tf.tensor2d(Xs, [Xs.length, 2], 'float32');
  const y = tf.tensor1d(ys, 'int32');

  console.log(`[AI Accessibility] Training on ${rows.length} records...`);
  await m.fit(X, y, { epochs: 10, batchSize: 4, verbose: 0 });
  console.log("[AI Accessibility] Model training complete.");
}

//////////////////////////////////////////////////////////////
// 4) Functions to Toggle High Contrast & Readable Font    //
//    (Called separately, e.g., from popup or background)  //
//////////////////////////////////////////////////////////////

/** 
 * Toggle high contrast on/off. 
 * You might call this from the extension's popup.js 
 */
function toggleHighContrast() {
  isHighContrast = !isHighContrast;
  document.documentElement.classList.toggle('high-contrast', isHighContrast);
  console.log("[AI Accessibility] High Contrast is now:", isHighContrast);
}

/**
 * Toggle a more readable font on/off.
 * Also called from popup or background script as needed.
 */
function toggleReadableFont() {
  isReadableFont = !isReadableFont;
  document.documentElement.classList.toggle('readable-font', isReadableFont);
  console.log("[AI Accessibility] Readable Font is now:", isReadableFont);
}

///////////////////////////////////////////////////////////
// 5) Key Listener: ONLY for Ctrl +/− (Browser Zoom)     //
///////////////////////////////////////////////////////////
window.addEventListener('keydown', (e) => {
  // Detect Ctrl + '+'
  if (e.ctrlKey && e.key === '+') {
    zoomInCount++;
    console.log(`[AI Accessibility] Detected browser zoom in. Count: ${zoomInCount}`);
  }

  // Detect Ctrl + '-'
  if (e.ctrlKey && e.key === '-') {
    zoomOutCount++;
    console.log(`[AI Accessibility] Detected browser zoom out. Count: ${zoomOutCount}`);
  }

  // If you still want SHIFT combos for training/prediction, you can keep them:
  // SHIFT+I => train model
  if (e.shiftKey && e.key.toUpperCase() === 'I') {
    trainModel(model);
  }
  // SHIFT+P => do some kind of prediction (example usage)
  if (e.shiftKey && e.key.toUpperCase() === 'P') {
    console.log("[AI Accessibility] (Example) SHIFT+P pressed. No real prediction implemented here.");
  }
});

////////////////////////////////////////////////////////
// 6) Log on Page Unload: store zoom data in database //
////////////////////////////////////////////////////////
window.addEventListener('beforeunload', () => {
  const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
  logInteraction(zoomInCount, zoomOutCount, timeOnPage);
});

///////////////////////////
// 7) Initialization Flow //
///////////////////////////
(async function initAll() {
  await initDatabase();
  model = createAccessibilityModel(); // If you want to do ML
  console.log("[AI Accessibility] content.js ready. Listening for Ctrl +/− for zoom tracking.");
  console.log("[AI Accessibility] Call toggleHighContrast() or toggleReadableFont() separately.");
})();
