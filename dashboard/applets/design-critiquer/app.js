(function() {
  const htmlInput = document.getElementById('html-input');
  const analyzeButton = document.getElementById('analyze-button');
  const resultsContainer = document.getElementById('results-container');
  const openSettingsButton = document.getElementById('open-settings-button');
  const closeSettingsButton = document.getElementById('close-settings-button');
  const settingsOverlay = document.getElementById('settings-overlay');
  const openaiApiKeyInput = document.getElementById('openai-api-key');
  const modelSelect = document.getElementById('model-select');
  const temperatureSlider = document.getElementById('temperature-slider');

  openSettingsButton.addEventListener('click', () => {
    settingsOverlay.style.display = 'flex';
  });

  closeSettingsButton.addEventListener('click', () => {
    settingsOverlay.style.display = 'none';
  });

  analyzeButton.addEventListener('click', async () => {
    const htmlContent = htmlInput.value.trim();
    if (!htmlContent) {
      resultsContainer.innerHTML = '<p class="error">Please paste the HTML content.</p>';
      return;
    }

    const apiKey = openaiApiKeyInput.value.trim();
    if (!apiKey) {
      resultsContainer.innerHTML = '<p class="error">Please enter your OpenAI API key in the settings.</p>';
      return;
    }

    resultsContainer.innerHTML = '<p class="loading">Analyzing...</p>';

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelSelect.value,
          messages: [
            {
              role: 'user',
              content: `Please provide a design critique for the following website HTML: ${htmlContent}. Analyze its color palette, typography, layout, and overall user experience. Please also provide some suggestions for improvement.`
            }
          ],
          temperature: parseFloat(temperatureSlider.value)
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const critique = data.choices[0].message.content;

      resultsContainer.innerHTML = `
        <h3>Critique</h3>
        <p>${critique}</p>
      `;
    } catch (error) {
      resultsContainer.innerHTML = `<p class="error">An error occurred: ${error.message}</p>`;
    }
  });
})();
