document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings from storage and update slider values
  chrome.storage.local.get(
    {
      contrast: 0,
      font: 0,
      zoom: 0,
      spacing: 0,
      align: 0
    },
    function(items) {
      // Update slider positions
      var sliderContrast = document.getElementById('high-contrast');
      if (sliderContrast) {
        sliderContrast.value = items.contrast;
      }

      var sliderFont = document.getElementById('font-select');
      if (sliderFont) {
        sliderFont.value = items.font;
      }

      var sliderZoom = document.getElementById('browser-zoom');
      if (sliderZoom) {
        sliderZoom.value = items.zoom;
      }

      var sliderSpacing = document.getElementById('text-spacing');
      if (sliderSpacing) {
        sliderSpacing.value = items.spacing;
      }

      var sliderAlign = document.getElementById('line-spacing');
      if (sliderAlign) {
        sliderAlign.value = items.align;
      }

      // Optionally, update any related UI (like visual labels or effects)
      updateEffects();
    }
  );

  
// For the slider that sets contrast
const sliderContrast = document.getElementById('high-contrast');
sliderContrast.addEventListener('input', (event) => {
  const contrastValue = event.target.value;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(
      activeTab.id, 
      { action: 'setHighContrast', value: contrastValue },
      (response) => {
        console.log(response?.status);
      }
    );
  });
});

const sliderFont = document.getElementById('font-select');
sliderFont.addEventListener('input', (event) => {
  const fontValue = event.target.value;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(
      activeTab.id, 
      { action: 'setFont', value: fontValue },
      (response) => {
        console.log(response?.status);
      }
    );
  });
});

  const sliderZoom = document.getElementById('browser-zoom');
  sliderZoom.addEventListener('input', (event) => {
    const zoomValue = event.target.value;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(
        activeTab.id, 
        { action: 'setZoom', value: zoomValue },
        (response) => {
          console.log(response?.status);
        }
      );
    });
  });
  

const sliderSpacing = document.getElementById('text-spacing');
  sliderSpacing.addEventListener('input', (event) => {
    const textValue = event.target.value;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(
        activeTab.id, 
        { action: 'setSpace', value: textValue },
        (response) => {
          console.log(response?.status);
        }
      );
    });
  });
  

const sliderAlign = document.getElementById('line-spacing');
  sliderAlign.addEventListener('input', (event) => {
    const slideAlign = event.target.value;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(
        activeTab.id, 
        { action: 'setAlign', value: slideAlign },
        (response) => {
          console.log(response?.status);
        }
      );
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

  function updateEffects() {
    const optionTexts = document.querySelectorAll('.option-text');
    const sliders = document.querySelectorAll('input[type="range"]');
    const title = document.querySelector('.welcome-text');
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
          default:
            break;
        }
      } else {
        optionText.classList.remove('active');
        optionText.removeAttribute('style');
      }
    });
    title.classList.toggle('neon-text', anyActive);
  }
});