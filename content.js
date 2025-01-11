/******************************************************************************
 * content.js
 * 
 * 1) Listens for Shift + "+" and Shift + "-" to toggle High Contrast & Readable Font.
 * 2) Logs interactions in an in-memory SQLite DB (via sql.js).
 * 3) Demonstrates a small ML model (TensorFlow.js) for predicting a layout profile.
 * 4) Applies predicted layout (optional).
 ******************************************************************************/

/////////////////////
// Global Variables //
/////////////////////
let db = null;            // SQLite Database instance (in-memory via sql.js)
let model = null;         // TensorFlow.js model
let startTime = Date.now();

// Track toggles
let toggleContrastCount = 0;  // # times user toggles high contrast
let toggleFontCount = 0;      // # times user toggles the readable font
let isHighContrast = false;   // Are we currently in high contrast mode?
let isReadableFont = false;   // Are we currently using the readable font?

// Sample final "layout profile" logic: 0=none, 1=high contrast, 2=readable font

//////////////////////////
// 1) Initialize sql.js //
//////////////////////////
async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => chrome.runtime.getURL('sql-wasm.wasm')
  });
  db = new SQL.Database();
  db.run(`
    CREATE TABLE IF NOT EXISTS user_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      toggleContrastCount INT,
      toggleFontCount INT,
      timeOnPage INT,
      layoutProfile INT
    )
  `);
  console.log("[AI Accessibility] SQLite DB initialized (in memory).");
}

///////////////////////////////
// 2) Logging User Sessions  //
///////////////////////////////
function logInteraction(contrastToggles, fontToggles, timeOnPage, layoutProfile) {
  const stmt = db.prepare(`
    INSERT INTO user_interactions
    (toggleContrastCount, toggleFontCount, timeOnPage, layoutProfile)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run([contrastToggles, fontToggles, timeOnPage, layoutProfile]);
  stmt.free();
  console.log("[AI Accessibility] Interaction logged:", {
    contrastToggles,
    fontToggles,
    timeOnPage,
    layoutProfile
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

///////////////////////////////////////
// 3) Machine Learning (TensorFlow.js //
///////////////////////////////////////
function createAccessibilityModel() {
  // We'll assume 2 features: toggleContrastCount, toggleFontCount, plus timeOnPage => total 3
  // Output: 3 categories (0=none, 1=high contrast, 2=readable font)
  // If you want more, adjust as needed
  const m = tf.sequential();
  m.add(tf.layers.dense({units: 8, activation: 'relu', inputShape: [3]}));
  m.add(tf.layers.dense({units: 8, activation: 'relu'}));
  m.add(tf.layers.dense({units: 3, activation: 'softmax'}));
  m.compile({
    optimizer: 'adam',
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
  });
  console.log("[AI Accessibility] Model created.");
  return m;
}

async function trainModel(m) {
  const rows = getAllData();
  if (rows.length < 2) {
    console.warn("[AI Accessibility] Not enough data to train (need at least 2 rows).");
    return;
  }

  const Xs = [];
  const ys = [];

  for (const r of rows) {
    // X = [contrastToggles, fontToggles, timeOnPage]
    Xs.push([r.toggleContrastCount, r.toggleFontCount, r.timeOnPage]);
    // y = layoutProfile
    ys.push(r.layoutProfile);
  }

  const X = tf.tensor2d(Xs, [Xs.length, 3], 'float32');
  const y = tf.tensor1d(ys, 'int32');

  console.log(`[AI Accessibility] Training on ${rows.length} records...`);
  await m.fit(X, y, { epochs: 10, batchSize: 4, verbose: 0 });
  console.log("[AI Accessibility] Model training complete.");
}

function predictLayoutProfile(m, inputVector) {
  // inputVector = [contrastToggles, fontToggles, timeOnPage]
  if (!m) {
    console.log("[AI Accessibility] No model defined, returning 0.");
    return 0;
  }
  const input = tf.tensor2d([inputVector], [1, 3], 'float32');
  const prediction = m.predict(input);
  const argmax = prediction.argMax(-1).dataSync()[0];
  console.log("[AI Accessibility] Predicted layout profile:", argmax);
  return argmax;
}

//////////////////////////////
// 4) Applying Layout Styles //
//////////////////////////////
function applyLayoutProfile(profile) {
  // Remove classes first
  document.documentElement.classList.remove('high-contrast', 'readable-font');

  switch(profile) {
    case 1:
      // High Contrast
      document.documentElement.classList.add('high-contrast');
      break;
    case 2:
      // Readable Font
      document.documentElement.classList.add('readable-font');
      break;
    default:
      // 0 = none
      break;
  }
  console.log("[AI Accessibility] Applied layout profile:", profile);
}

////////////////////////////////////
// 5) Key Listener (Shift +, -)   //
////////////////////////////////////
window.addEventListener('keydown', (e) => {
  // SHIFT + (Plus)
  if (e.shiftKey && e.key === '+') {
    toggleContrastCount++;
    isHighContrast = !isHighContrast;
    document.documentElement.classList.toggle('high-contrast');
    console.log("[AI Accessibility] SHIFT+ + pressed. High Contrast toggled. Count:", toggleContrastCount);
  }

  // SHIFT - (Minus)
  if (e.shiftKey && e.key === '-') {
    toggleFontCount++;
    isReadableFont = !isReadableFont;
    document.documentElement.classList.toggle('readable-font');
    console.log("[AI Accessibility] SHIFT+ - pressed. Readable Font toggled. Count:", toggleFontCount);
  }

  // SHIFT I => Train model
  if (e.shiftKey && e.key.toUpperCase() === 'I') {
    trainModel(model);
  }

  // SHIFT P => Predict & Apply
  if (e.shiftKey && e.key.toUpperCase() === 'P') {
    const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
    const predicted = predictLayoutProfile(model, [toggleContrastCount, toggleFontCount, timeOnPage]);
    applyLayoutProfile(predicted);
  }
});

//////////////////////////////////////////
// 6) Log on Page Unload & Final Profile //
//////////////////////////////////////////
window.addEventListener('beforeunload', () => {
  const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

  // Naive final layoutProfile:
  // if isHighContrast => 1, else if isReadableFont => 2, else 0
  let finalProfile = 0;
  if (isHighContrast) finalProfile = 1;
  else if (isReadableFont) finalProfile = 2;

  logInteraction(toggleContrastCount, toggleFontCount, timeOnPage, finalProfile);
});

///////////////////////////
// 7) Initialization Flow //
///////////////////////////
(async function initAll() {
  await initDatabase();
  model = createAccessibilityModel();
  console.log("[AI Accessibility] Content script ready. Press SHIFT+ + or SHIFT+ - to toggle styles.");
})();
