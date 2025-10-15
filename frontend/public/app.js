// API Configuration
const API_BASE_URL = '/api';

// Global state
let statsData = {};
let countryChart = null;
let topCountriesChart = null;
let autoRefreshInterval = null;
let countryNames = {}; // Will be populated from API
let availableCountries = []; // Will be populated from API

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadCountries().then(() => {
        loadStatistics();
        // Auto-refresh every 5 seconds
        autoRefreshInterval = setInterval(loadStatistics, 5000);
    });
});

function initializeApp() {
    console.log('Initializing Website Visit Tracker...');
    showLoading(false);
}

function setupEventListeners() {
    // Track visit button
    document.getElementById('trackBtn').addEventListener('click', trackVisit);
    
    // Bulk operations
    document.getElementById('bulkTrackBtn').addEventListener('click', simulateBulkVisits);
    document.getElementById('refreshBtn').addEventListener('click', loadStatistics);
    document.getElementById('resetBtn').addEventListener('click', resetStatistics);
    
    // Enter key support for country code input
    document.getElementById('countryCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            trackVisit();
        }
    });
}

// API Functions
async function makeApiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

async function trackVisit() {
    const countryCode = document.getElementById('countryCode').value;
    
    if (!countryCode) {
        showMessage('Please select a country', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await makeApiRequest('/visits/track', {
            method: 'POST',
            body: JSON.stringify({ countryCode })
        });
        
        if (response.success) {
            showMessage(`Visit tracked for ${countryCode.toUpperCase()}`, 'success');
            document.getElementById('countryCode').value = '';
            await loadStatistics();
        } else {
            showMessage('Failed to track visit', 'error');
        }
    } catch (error) {
        showMessage('Error tracking visit: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function loadCountries() {
    try {
        // Load popular countries for the dropdown
        const response = await makeApiRequest('/visits/countries?popular=true');
        
        if (response.success) {
            availableCountries = response.data.countries;
            
            // Populate countryNames object
            countryNames = {};
            availableCountries.forEach(country => {
                countryNames[country.code] = country.name;
            });
            
            // Update the dropdown
            updateCountryDropdown();
            
            console.log(`Loaded ${availableCountries.length} countries`);
        } else {
            console.error('Failed to load countries');
            // Fallback to hardcoded countries
            loadFallbackCountries();
        }
    } catch (error) {
        console.error('Error loading countries:', error);
        // Fallback to hardcoded countries
        loadFallbackCountries();
    }
}

function loadFallbackCountries() {
    // Fallback countries if API fails
    availableCountries = [
        { code: 'us', name: 'United States' },
        { code: 'gb', name: 'United Kingdom' },
        { code: 'de', name: 'Germany' },
        { code: 'fr', name: 'France' },
        { code: 'it', name: 'Italy' },
        { code: 'es', name: 'Spain' },
        { code: 'ca', name: 'Canada' },
        { code: 'au', name: 'Australia' },
        { code: 'jp', name: 'Japan' },
        { code: 'br', name: 'Brazil' }
    ];
    
    countryNames = {};
    availableCountries.forEach(country => {
        countryNames[country.code] = country.name;
    });
    
    updateCountryDropdown();
}

function updateCountryDropdown() {
    const select = document.getElementById('countryCode');
    select.innerHTML = '<option value="">Select a country</option>';
    
    availableCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = `${country.name} (${country.code.toUpperCase()})`;
        select.appendChild(option);
    });
}

async function loadStatistics() {
    try {
        const response = await makeApiRequest('/visits/stats');
        
        if (response.success) {
            statsData = response.data;
            updateStatisticsDisplay();
            updateCharts();
            updateStatsTable();
        } else {
            console.error('Failed to load statistics');
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        if (!autoRefreshInterval) {
            showMessage('Error loading statistics: ' + error.message, 'error');
        }
    }
}

async function resetStatistics() {
    if (!confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await makeApiRequest('/visits/reset', {
            method: 'DELETE'
        });
        
        if (response.success) {
            showMessage('Statistics reset successfully', 'success');
            await loadStatistics();
        } else {
            showMessage('Failed to reset statistics', 'error');
        }
    } catch (error) {
        showMessage('Error resetting statistics: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function simulateBulkVisits() {
    const countryCodes = availableCountries.map(country => country.code);
    const visitsToSimulate = 100;
    
    try {
        showLoading(true);
        showMessage(`Simulating ${visitsToSimulate} visits...`, 'info');
        
        const promises = [];
        for (let i = 0; i < visitsToSimulate; i++) {
            const randomCountry = countryCodes[Math.floor(Math.random() * countryCodes.length)];
            promises.push(
                makeApiRequest('/visits/track', {
                    method: 'POST',
                    body: JSON.stringify({ countryCode: randomCountry })
                })
            );
        }
        
        await Promise.all(promises);
        showMessage(`Successfully simulated ${visitsToSimulate} visits`, 'success');
        await loadStatistics();
    } catch (error) {
        showMessage('Error simulating visits: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Display Functions
function updateStatisticsDisplay() {
    const totalVisits = Object.values(statsData).reduce((sum, count) => sum + count, 0);
    const totalCountries = Object.keys(statsData).length;
    
    document.getElementById('totalVisits').textContent = totalVisits.toLocaleString();
    document.getElementById('totalCountries').textContent = totalCountries;
}

function updateCharts() {
    updateCountryChart();
    updateTopCountriesChart();
}

function updateCountryChart() {
    const ctx = document.getElementById('countryChart').getContext('2d');
    
    if (countryChart) {
        countryChart.destroy();
    }
    
    const countries = Object.keys(statsData);
    const visits = Object.values(statsData);
    const colors = generateColors(countries.length);
    
    countryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: countries.map(code => `${code.toUpperCase()} - ${countryNames[code] || code}`),
            datasets: [{
                data: visits,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        boxWidth: 12,
                        maxWidth: 150,
                        truncate: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} visits (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateTopCountriesChart() {
    const ctx = document.getElementById('topCountriesChart').getContext('2d');
    
    if (topCountriesChart) {
        topCountriesChart.destroy();
    }
    
    const sortedCountries = Object.entries(statsData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    if (sortedCountries.length === 0) {
        return;
    }
    
    const countries = sortedCountries.map(([code]) => code.toUpperCase());
    const visits = sortedCountries.map(([, count]) => count);
    
    topCountriesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: countries,
            datasets: [{
                label: 'Visits',
                data: visits,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateStatsTable() {
    const tbody = document.getElementById('statsTableBody');
    tbody.innerHTML = '';
    
    const totalVisits = Object.values(statsData).reduce((sum, count) => sum + count, 0);
    const sortedCountries = Object.entries(statsData)
        .sort(([,a], [,b]) => b - a);
    
    sortedCountries.forEach(([countryCode, count]) => {
        const percentage = totalVisits > 0 ? ((count / totalVisits) * 100).toFixed(1) : 0;
        
        const countryName = countryNames[countryCode] || countryCode.toUpperCase();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td title="${countryName}">
                <span class="country-flag">${getCountryFlag(countryCode)}</span>
                ${countryName}
            </td>
            <td><code>${countryCode.toUpperCase()}</code></td>
            <td>${count.toLocaleString()}</td>
            <td>
                ${percentage}%
                <div class="percentage-bar">
                    <div class="percentage-fill" style="width: ${percentage}%"></div>
                </div>
            </td>
            <td>
                <button class="btn btn-secondary" onclick="trackSingleVisit('${countryCode}')">
                    <i class="fas fa-plus"></i> Track
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function trackSingleVisit(countryCode) {
    try {
        const response = await makeApiRequest('/visits/track', {
            method: 'POST',
            body: JSON.stringify({ countryCode })
        });
        
        if (response.success) {
            showMessage(`Visit tracked for ${countryCode.toUpperCase()}`, 'success');
            await loadStatistics();
        } else {
            showMessage('Failed to track visit', 'error');
        }
    } catch (error) {
        showMessage('Error tracking visit: ' + error.message, 'error');
    }
}

// Utility Functions
function generateColors(count) {
    const colors = [];
    const hueStep = 360 / count;
    
    for (let i = 0; i < count; i++) {
        const hue = (i * hueStep) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    
    return colors;
}

function getCountryFlag(countryCode) {
    if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
        return '🏳️'; // Return white flag for invalid codes
    }
    
    const code = countryCode.toUpperCase();
    
    // Convert country code to Unicode regional indicator symbols
    // This creates flag emojis dynamically for any valid country code
    const flag = String.fromCodePoint(...code.split('').map(char => 
        0x1F1E6 + char.charCodeAt(0) - 'A'.charCodeAt(0)
    ));
    
    return flag;
}

function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('statusMessage');
    messageEl.textContent = message;
    messageEl.className = `status-message ${type} show`;
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 4000);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});

