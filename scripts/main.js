document.getElementById('high-contrast').addEventListener('click', () => {
    // Query the active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const activeTab = tabs[0];
      // Send a message to content.js in the active tab
      chrome.tabs.sendMessage(activeTab.id, {action: "toggleHighContrast"}, (response) => {
        console.log(response.status);
      });
    });
  });
  
  document.getElementById("font-type").addEventListener('click', () => {
    // Query the active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const activeTab = tabs[0];
      // Send a message to content.js in the active tab
      chrome.tabs.sendMessage(activeTab.id, {action: "toggleReadableFont"}, (response) => {
        console.log(response.status);
      });
    });
  });

  document.getElementById("browser-zoom").addEventListener('click', () => {
    // Query the active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const activeTab = tabs[0];
      // Send a message to content.js in the active tab
      chrome.tabs.sendMessage(activeTab.id, {action: "toggleZoom"}, (response) => {
        console.log(response.status);
      });
    });
  });


  