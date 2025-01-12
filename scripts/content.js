// Toggle states for High Contrast & Readable Font
let isHighContrast = false;
let isReadableFont = false;
let isZoomed = false;

const site = window.location.hostname
const Add_Custom_Style = (css, id) => {
  // Check if the style element already exists
  let styleElement = document.getElementById(id);
  if (!styleElement) {
    // Create a new <style> tag
    styleElement = document.createElement("style");
    styleElement.id = id; // Assign the ID
    document.head.appendChild(styleElement);
  }
  styleElement.innerHTML = css; // Update the CSS content
};

async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => chrome.runtime.getURL('sql-wasm.wasm')
  });

  db = new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS user_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      website TEXT,
      contrast INT,
      zoom INT,
      font INT,
      spacing INT,
      align INT
    )
  `);

  console.log("[Accessibility] In-memory SQLite DB initialized.");
}

function logInteraction(website, contrast, zoom, font, spacing, align) {
  const stmt = db.prepare(`
    INSERT INTO user_interactions
    (website, contrast, zoom, font, spacing, align)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run([website, contrast, zoom, font, spacing, align]);
  stmt.free();
  console.log("[Accessibility] Interaction logged:", {
    website, contrast, zoom, font, spacing, align
  });
}

function getAllData() {
  const stmt = db.prepare("SELECT * FROM user_interactions");
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  for (x in rows) {
    console.log(x);
  }
}

function Remove_Custom_Style(id) {
  const styleElement = document.getElementById(id);
  if (styleElement) {
    styleElement.remove();
    console.log(`[Accessibility] Removed style with ID: ${id}`);
  }
}


function setHighContrast(contrastValue) {
  // Convert string to number if needed
  contrastValue = Number(contrastValue);
  console.log("[Accessibility] Setting contrast level to:", contrastValue);
  
  // For example, update the contrast style based on a given value
  // (This is just an example. You can customize your style as needed)
  Add_Custom_Style(`
    * {
        color: #FFFFFF !important;
        background-color: #121212 !important;
        filter: contrast(${50 + contrastValue * 25}%);
    }
  `, "__contrast");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleHighContrast") {
    toggleHighContrast();
    sendResponse({status: "High contrast toggled"});
  } else if (request.action === "setHighContrast") {
    setHighContrast(request.value);
    sendResponse({status: `Contrast set to ${request.value}`});
  }
});

function toggleReadableFont() {
  isReadableFont = !isReadableFont;
  document.documentElement.classList.toggle('readable-font', isReadableFont);
  console.log("[Accessibility] Readable Font is now:", isReadableFont);

  if(isReadableFont) {
    Add_Custom_Style(`
      @import url("https://fonts.googleapis.com/css?family=Raleway");

      * {
          font-family: "Comic Sans MS", "Comic Sans", cursive;
      }


  `, "__readableFont")

  } else {
    Remove_Custom_Style("__readableFont");
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleReadableFont") {
    toggleReadableFont();
    sendResponse({status: "Readable Font toggled"});
  }
});

function toggleZoom() {
  isZoomed = !isZoomed;
  document.documentElement.classList.toggle('readable-zoom', isZoomed);
  console.log("[Accessibility] Zoomed is now:", isZoomed);

  if (isZoomed) {
    Add_Custom_Style(`
    * {
        zoom: 1.02;
    }
  `, "__zoom")
  } else {
    Remove_Custom_Style("__zoom");
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleZoom") {
    toggleZoom();
    sendResponse({status: "Zoom toggled"});
  }
});

(async function initAll() {
  await initDatabase();
})();
