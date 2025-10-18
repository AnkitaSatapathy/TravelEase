const priorities = [
  'Budget-Friendly',
  'Beach & Relaxation',
  'Adventure & Hiking',
  'Culture & History',
  'Food & Cuisine',
  'Nightlife',
  'Family-Friendly',
  'Photography'
];

let destinationCount = 1;

function initializePage() {
  renderDestinationInputs();
  renderPriorities();
  attachEventListeners();
}

function renderDestinationInputs() {
  const container = document.getElementById('destinationInputs');
  container.innerHTML = '';
  for (let i = 0; i < destinationCount; i++) {
    const div = document.createElement('div');
    div.className = 'destination-input-group';
    div.innerHTML = `
      <input 
        type="text" 
        placeholder="e.g., Paris, Tokyo, New York"
        class="destination-input"
        id="dest-${i}"
      />
      ${destinationCount > 2 ? `<button onclick="removeDestination(${i})">✕</button>` : ''}
    `;
    container.appendChild(div);
  }
}

function renderPriorities() {
  const container = document.getElementById('prioritiesGrid');
  container.innerHTML = '';
  priorities.forEach((priority, index) => {
    const div = document.createElement('div');
    div.className = 'priority-rating-group';
    div.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600; color: #1a1a2e; font-size: 0.9em;">${priority}</div>
      <div class="rating-stars" id="rating-${index}">
        ${[1, 2, 3, 4, 5].map(star => `
          <span class="star" data-value="${star}" onclick="setRating(${index}, ${star})" style="cursor: pointer; font-size: 1.8em; color: #ddd; transition: all 0.2s;">★</span>
        `).join('')}
      </div>
      <input type="hidden" id="priority-${index}" value="0">
    `;
    container.appendChild(div);
  });
}

function setRating(index, value) {
  document.getElementById(`priority-${index}`).value = value;
  const stars = document.querySelectorAll(`#rating-${index} .star`);
  stars.forEach((star, i) => {
    if (i < value) {
      star.style.color = '#667eea';
    } else {
      star.style.color = '#ddd';
    }
  });
}

function attachEventListeners() {
  document.getElementById('addDestinationBtn').addEventListener('click', addDestination);
  document.getElementById('compareBtn').addEventListener('click', compareDestinations);

  document.getElementById('budget').addEventListener('input', (e) => {
    document.getElementById('budgetValue').textContent = e.target.value;
  });

  document.getElementById('duration').addEventListener('input', (e) => {
    document.getElementById('durationValue').textContent = e.target.value;
  });
}

function addDestination() {
  destinationCount++;
  renderDestinationInputs();
}

function removeDestination(index) {
  if (destinationCount > 2) {
    const inputs = document.querySelectorAll('.destination-input');
    inputs[index].parentElement.remove();
    destinationCount--;
  }
}

async function compareDestinations() {
  const destinations = Array.from(document.querySelectorAll('.destination-input'))
    .map(el => el.value.trim())
    .filter(val => val);

  if (destinations.length < 2) {
    showError('Please add at least 2 destinations');
    return;
  }

  const ratings = [];
  priorities.forEach((priority, index) => {
    const rating = parseInt(document.getElementById(`priority-${index}`).value);
    if (rating > 0) {
      ratings.push({ priority, rating });
    }
  });

  if (ratings.length === 0) {
    showError('Please rate at least one priority');
    return;
  }

  const budget = document.getElementById('budget').value;
  const duration = document.getElementById('duration').value;
  const month = document.getElementById('month').value;

  const compareBtn = document.getElementById('compareBtn');
  compareBtn.disabled = true;
  compareBtn.querySelector('.btn-text').style.display = 'none';
  compareBtn.querySelector('.btn-loader').style.display = 'inline-block';
  clearError();

  try {
    const response = await fetch('http://localhost:5001/api/compare-destinations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destinations,
        priorities: ratings.map(r => `${r.priority} (${r.rating}/5)`),
        budget: parseInt(budget),
        duration: parseInt(duration),
        month
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch comparison data');
    }

    const data = await response.json();
    displayResults(data.comparisons);
  } catch (error) {
    console.error('Error:', error);
    showError(error.message || 'An error occurred while comparing destinations');
  } finally {
    compareBtn.disabled = false;
    compareBtn.querySelector('.btn-text').style.display = 'inline';
    compareBtn.querySelector('.btn-loader').style.display = 'none';
  }
}

function displayResults(comparisons) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsGrid = document.getElementById('resultsGrid');
  
  // Clear and set up the grid
  resultsGrid.className = 'results-grid';
  resultsGrid.innerHTML = '';

  comparisons.forEach(comparison => {
    const card = createComparisonCard(comparison);
    resultsGrid.appendChild(card);
  });

  resultsSection.style.display = 'block';
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function createComparisonCard(comparison) {
  const card = document.createElement('div');
  card.className = 'comparison-card';

  const score = Math.round(comparison.matchScore);
  
  // Format budget breakdown
  let budgetHTML = '';
  if (typeof comparison.budget === 'object' && comparison.budget !== null) {
    budgetHTML = `
      <div class="budget-breakdown">
        ${Object.entries(comparison.budget).map(([key, value]) => {
          if (key !== 'breakdown' && key !== 'total') {
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const displayValue = typeof value === 'number' ? `${value.toLocaleString()}` : value;
            return `
              <div class="budget-item">
                <div class="budget-item-label">${label}</div>
                <div class="budget-item-value">${displayValue}</div>
              </div>
            `;
          }
          return '';
        }).join('')}
      </div>
      ${comparison.budget.breakdown ? `<div style="margin-top: 12px; padding: 14px; background: rgba(102, 126, 234, 0.05); border-radius: 10px; border-left: 3px solid #667eea; color: #555; font-size: 0.95em; line-height: 1.6;">${comparison.budget.breakdown}</div>` : ''}
    `;
  } else {
    budgetHTML = `<div class="section-content">${comparison.budget}</div>`;
  }

  card.innerHTML = `
    <div class="card-header">
      <div class="card-destination">${comparison.destination}</div>
      <div class="score-badge">Match: ${score}%</div>
    </div>
    <div class="card-content">
      <div class="card-section">
        <div class="section-title">📍 Overview</div>
        <div class="section-content">${comparison.overview}</div>
      </div>

      <div class="card-section">
        <div class="section-title">🌤️ Climate & Best Time</div>
        <div class="section-content">${comparison.climate}</div>
      </div>

      <div class="card-section">
        <div class="section-title">💳 Budget Breakdown</div>
        ${budgetHTML}
      </div>

      <div class="card-section">
        <div class="section-title">✨ Highlights</div>
        <ul class="pros">${comparison.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
      </div>

      <div class="card-section">
        <div class="section-title">⚠️ Considerations</div>
        <ul class="cons">${comparison.considerations.map(c => `<li>${c}</li>`).join('')}</ul>
      </div>

      <div class="card-section">
        <div class="section-title">🎯 Recommended Activities</div>
        <ul class="pros" style="color: #555;">
          ${comparison.activities.split('\n').filter(a => a.trim()).map(activity => `<li>${activity.replace(/^\d+\.\s*/, '')}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;

  return card;
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
}

function clearError() {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.classList.remove('show');
  errorDiv.textContent = '';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializePage);