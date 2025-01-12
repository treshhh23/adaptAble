/******************************************************************************
 * content.js
 *
 * Features:
 * 1) Listens for Ctrl + "+" and Ctrl + "-" to detect/log browser zoom usage.
 * 2) Provides separate functions to toggle High Contrast & Readable Font.
 * 3) Stores interaction data (zoom usage, time on page, etc.) in an in-memory
 *    SQLite DB (sql.js), no TensorFlow usage.
 ******************************************************************************/


/////////////////////
// Global Variables //
/////////////////////
db = null;        // SQLite Database instance (in-memory via sql.js)
let startTime = Date.now();


// Track how often user uses Ctrl + or Ctrl - (zoom actions)
let zoomInCount = 0;
let zoomOutCount = 0;


// Toggle states for High Contrast & Readable Font
let isHighContrast = false;
let isReadableFont = false;


/////////////////////////////////////////////
// 1) Initialize sql.js & Create a Table  //
/////////////////////////////////////////////
async function initDatabase() {
  // Load sql.js from the WebAssembly file
  // (Ensure "sql-wasm.wasm" is in your extension and declared in manifest.json)
  const SQL = await initSqlJs({
    locateFile: file => chrome.runtime.getURL('sql-wasm.wasm')
  });


  // Create an in-memory database
  db = new SQL.Database();


  // Create a table to store user interactions
  db.run(`
    CREATE TABLE IF NOT EXISTS user_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zoomInCount INT,
      zoomOutCount INT,
      timeOnPage INT
    )
  `);


  console.log("[Accessibility] In-memory SQLite DB initialized.");
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
  console.log("[Accessibility] Interaction logged:", {
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


//////////////////////////////////////////////////////////////
// 3) Functions to Toggle High Contrast & Readable Font    //
//    (Called separately, e.g., from popup or background)  //
//////////////////////////////////////////////////////////////


/**
 * Toggle high contrast on/off.
 * For example, you might call this from the extension's popup.js.
 */
function toggleHighContrast() {
  isHighContrast = !isHighContrast;
  document.documentElement.classList.toggle('high-contrast', isHighContrast);
  console.log("[Accessibility] High Contrast is now:", isHighContrast);
}


/**
 * Toggle a more readable font on/off.
 * Also called from popup or background script as needed.
 */
function toggleReadableFont() {
  isReadableFont = !isReadableFont;
  document.documentElement.classList.toggle('readable-font', isReadableFont);
  console.log("[Accessibility] Readable Font is now:", isReadableFont);
}


///////////////////////////////////////////////////////////
// 4) Key Listener: ONLY for Ctrl +/− (Browser Zoom)     //
///////////////////////////////////////////////////////////
window.addEventListener('keydown', (e) => {
  // Detect Ctrl + '+'
  if (e.ctrlKey && e.key === '+'|| e.key === '=') {
    zoomInCount++;
    console.log(`[Accessibility] Detected browser zoom in. Count: ${zoomInCount}`);
  }


  // Detect Ctrl + '-'
  if (e.ctrlKey && e.key === '-') {
    zoomOutCount++;
    console.log(`[Accessibility] Detected browser zoom out. Count: ${zoomOutCount}`);
  }
});


////////////////////////////////////////////////////////
// 5) Log on Page Unload: store zoom data in database //
////////////////////////////////////////////////////////
window.addEventListener('beforeunload', () => {
  const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
  logInteraction(zoomInCount, zoomOutCount, timeOnPage);
});


///////////////////////////
// 6) Initialization Flow //
///////////////////////////
(async function initAll() {
  await initDatabase();
  console.log("[Accessibility] content.js ready. Tracking Ctrl +/− for zoom usage.");
  console.log("[Accessibility] Call toggleHighContrast() / toggleReadableFont() as needed.");
})();
