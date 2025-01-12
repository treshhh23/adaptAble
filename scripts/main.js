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


  
  document.addEventListener('DOMContentLoaded', function() {
    const title = document.querySelector('.welcome-text');
    const sliders = document.querySelectorAll('input[type="range"]');
    const optionTexts = document.querySelectorAll('.option-text');

    function updateEffects() {
      let anyActive = false;
      sliders.forEach((slider, index) => {
        const value = parseInt(slider.value);
        const optionText = optionTexts[index];

        if (value > 0) {
          anyActive = true;
          optionText.classList.add('active');

          // Apply specific styles based on the option
          switch(slider.id) {
            case 'high-contrast':
              optionText.style.textShadow = `0 0 ${value * 2}px #fff`;
              break;
            case 'browser-zoom':
              optionText.style.fontSize = `${16 + value}px`;
              break;
            case 'font-type':
              optionText.style.fontWeight = 400 + (value * 100);
              break;
            case 'text-spacing':
              optionText.style.letterSpacing = `${value * 0.5}px`;
              break;
            case 'line-spacing':
              optionText.style.lineHeight = 1 + (value * 0.2);
              break;
          }
        } else {
          optionText.classList.remove('active');
          optionText.removeAttribute('style');
        }
      });

      title.classList.toggle('neon-text', anyActive);
    }

    sliders.forEach(slider => {
      slider.addEventListener('input', updateEffects);
    });
  });