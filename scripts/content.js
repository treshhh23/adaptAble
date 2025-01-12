// Toggle states for High Contrast & Readable Font
let isHighContrast = false;
let isReadableFont = false;
let isZoomed = false;

const site = window.location.hostname

const Add_Custom_Style = (css, id) => {
  let styleElement = document.getElementById(id);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = id;
    document.head.appendChild(styleElement);
  }
  styleElement.innerHTML = css;
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
  contrastValue = Number(contrastValue);
  console.log("[Accessibility] Setting contrast level to:", contrastValue);

  if (contrastValue === 0) {
    Remove_Custom_Style("__contrast");
  } else {

  const ratio = (contrastValue - 1) / 3;

  const textVal = Math.round(240 * ratio);
  const bgVal = Math.round(240 * (1 - ratio));

  const textColor = `rgb(${textVal}, ${textVal}, ${textVal})`;
  const backgroundColor = `rgb(${bgVal}, ${bgVal}, ${bgVal})`;

  Add_Custom_Style(`
    * {
      color: ${textColor} !important;
      background-color: ${backgroundColor} !important;
    }
  `, "__contrast");
  }
  chrome.storage.local.set({ contrast: contrastValue });
}


// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "toggleHighContrast") {
//     toggleHighContrast();
//     sendResponse({status: "High contrast toggled"});
//   } else if (request.action === "setHighContrast") {
//     setHighContrast(request.value);
//     sendResponse({status: `Contrast set to ${request.value}`});
//   }
// });

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
  chrome.storage.local.set({ readableFont: isReadableFont });
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "toggleReadableFont") {
//     toggleReadableFont();
//     sendResponse({status: "Readable Font toggled"});
//   }
// });


function setZoom(zoomValue) {
  // Convert string to number if needed
  zoomValue = Number(zoomValue);
  console.log("[Accessibility] Setting zoom level to:", zoomValue);
  
  // For example, update the contrast style based on a given value
  // (This is just an example. You can customize your style as needed)
  Add_Custom_Style(`
    * {
        zoom: ${1.0 + 0.01*zoomValue}
    }
  `, "__zoom");

  chrome.storage.local.set({ zoom: zoomValue });
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if(request.action === "setZoom") {
//     setZoom(request.value);
//     sendResponse({status: `Zoom set to ${request.value}`});
//   }
// }
// );

function setSpace(spaceValue) {
  // Convert string to number if needed
  spaceValue = Number(spaceValue);
  console.log("[Accessibility] Setting zoom level to:", spaceValue);
  
  // For example, update the contrast style based on a given value
  // (This is just an example. You can customize your style as needed)
  Add_Custom_Style(`
    * {
        word-spacing: ${2 * spaceValue}px;
    }
  `, "__space");

  chrome.storage.local.set({ spacing: spaceValue });
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if(request.action === "setSpace") {
//     setSpace(request.value);
//     sendResponse({status: `Space set to ${request.value}`});
//   }
// }
// );

function setAlign(alignValue) {
  // Convert string to number if needed
  alignValue = Number(alignValue);
  console.log("[Accessibility] Setting zoom level to:", alignValue);
  
  // For example, update the contrast style based on a given value
  // (This is just an example. You can customize your style as needed)
  if (alignValue != 0) {
    Add_Custom_Style(`
      * {
          line-height: ${150 + alignValue * 5}%;
      }
    `, "__align");
  }
  else {
    Remove_Custom_Style("__align");
  }

  chrome.storage.local.set({ align: alignValue });
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if(request.action === "setAlign") {
//     setAlign(request.value);
//     sendResponse({status: `Space set to ${request.value}`});
//   }
// }
// );

function setFont(fontValue) {
  // Convert string to number if needed
  alignValue = Number(fontValue);
  console.log("[Accessibility] Setting zoom level to:", fontValue);
  
  // For example, update the contrast style based on a given value
  // (This is just an example. You can customize your style as needed)
  if (alignValue == 0) {
    Remove_Custom_Style("__font");
  } else if (alignValue == 1) {
    Add_Custom_Style(`
      * {
          font-family: "Comic Sans MS", "Comic Sans", cursive;
      }
    `, "__font");
  } else if (alignValue == 2) {
    Add_Custom_Style(`
      @import url('https://fonts.googleapis.com/css?family=Raleway:wght@400;700&display=swap');

      * {
          font-family: 'Raleway', sans-serif;
      }
    `, "__font");
  } else if (alignValue == 3) {
    Add_Custom_Style(`
      @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap');
      * {
          font-family: 'Open Sans', sans-serif;
      }
    `, "__font");
  } else if (alignValue == 4) {
    Add_Custom_Style(`
      * {
          font-family: "Times New Roman", Times, serif;
      }
    `, "__font");
  }
  else {
    Add_Custom_Style(`
      @import url("https://fonts.googleapis.com/css?family=Raleway");

      * {
          font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
      }
    `, "__font");
  }

  chrome.storage.local.set({ font: fontValue });
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if(request.action === "setFont") {
//     setFont(request.value);
//     sendResponse({status: `Space set to ${request.value}`});
//   }
// }
// );

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "toggleHighContrast":
      // Optionally, you can toggle a boolean if needed
      // toggleHighContrast();
      // sendResponse({status: "High contrast toggled"});
      break;
    case "setHighContrast":
      setHighContrast(request.value);
      sendResponse({ status: `Contrast set to ${request.value}` });
      break;
    case "toggleReadableFont":
      toggleReadableFont();
      sendResponse({ status: "Readable Font toggled" });
      break;
    case "setZoom":
      setZoom(request.value);
      sendResponse({ status: `Zoom set to ${request.value}` });
      break;
    case "setSpace":
      setSpace(request.value);
      sendResponse({ status: `Spacing set to ${request.value}` });
      break;
    case "setAlign":
      setAlign(request.value);
      sendResponse({ status: `Line spacing set to ${request.value}` });
      break;
    case "setFont":
      setFont(request.value);
      sendResponse({ status: `Font set to ${request.value}` });
      break;
    default:
      break;
  }
});

(function initAll() {
  initDatabase().then(() => {
    chrome.storage.local.get(
      {
        contrast: 0,
        font: 0,
        zoom: 0,
        spacing: 0,
        align: 0,
        readableFont: false
      },
      (items) => {
        console.log("[Accessibility] Restoring saved settings:", items);
        setHighContrast(items.contrast);
        setFont(items.font);
        setZoom(items.zoom);
        setSpace(items.spacing);
        setAlign(items.align);
        // Restore readable font toggle if it was enabled
        if (items.readableFont) {
          toggleReadableFont(); // this toggles and saves the state
        }
      }
    );
  });
})();