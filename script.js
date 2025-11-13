class StockAnalysisApp {
    constructor() {
        // ✅ YOUR RENDER BACKEND URL
        this.apiBaseUrl = 'https://stockmarketanalysis-33c0.onrender.com/api';
        this.stocks = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ITC.NS'];
        this.initializeEventListeners();
        this.checkAPIStatus();
        this.setDefaultDates();
    }

    setDefaultDates() {
        const today = new Date();
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        document.getElementById('startDate').value = this.formatDate(oneMonthAgo);
        document.getElementById('endDate').value = this.formatDate(today);
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    initializeEventListeners() {
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeStocks();
        });

        // Add enter key support
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzeStocks();
            }
        });
    }

    async checkAPIStatus() {
        const statusElement = document.getElementById('apiStatus');
        try {
            statusElement.innerHTML = '<i class="fas fa-sync fa-spin"></i> API: Checking...';
            
            const response = await fetch(`${this.apiBaseUrl}/health`);
            
            if (response.ok) {
                const data = await response.json();
                statusElement.className = 'status-online';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> API: Online';
                console.log('✅ Backend connected:', data);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ API check failed:', error);
            statusElement.className = 'status-offline';
            statusElement.innerHTML = '<i class="fas fa-circle"></i> API: Offline';
            this.showError('Cannot connect to backend server. Please try again later.');
        }
    }

    async analyzeStocks() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        // Validation
        if (!startDate || !endDate) {
            this.showError('Please select both start and end dates');
            return;
        }

        if (new Date(startDate) >= new Date(endDate)) {
            this.showError('Start date must be before end date');
            return;
        }

        // Show loading state
        this.showLoading(true);
        this.disableForm(true);

        try {
            console.log('📊 Sending analysis request to:', `${this.apiBaseUrl}/analyze`);
            
            const response = await fetch(`${this.apiBaseUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Analysis response:', data);

            if (data.success) {
                this.displayResults(data.data);
            } else {
                throw new Error(data.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('❌ Analysis error:', error);
            this.showError(`Analysis failed: ${error.message}`);
        } finally {
            this.showLoading(false);
            this.disableForm(false);
        }
    }

    displayResults(data) {
        // Update key metrics
        document.getElementById('mainTrendStock').textContent = data.analysis.main_trend_stock.split('.')[0];
        document.getElementById('varianceExplained').textContent = 
            data.analysis.variance_explained.toFixed(2) + '%';
        document.getElementById('totalVariance').textContent = 
            data.analysis.total_variance.toFixed(6);
        document.getElementById('tradingDays').textContent = data.analysis.number_of_days;

        // Display charts
        document.getElementById('trendChart').src = `data:image/png;base64,${data.trend_chart}`;
        document.getElementById('returnsChart').src = `data:image/png;base64,${data.returns_chart}`;

        // Display data tables
        this.displayStockPrices(data.stock_prices);
        this.displayEigenData(data.eigenvalues, data.eigenvectors);

        // Show results section
        this.showResultsSection();
        
        console.log('📈 Results displayed successfully');
    }

    displayStockPrices(pricesData) {
        const tableBody = document.querySelector('#pricesTable tbody');
        tableBody.innerHTML = '';

        const dates = Object.keys(pricesData).sort().slice(-5);

        dates.forEach(date => {
            const row = document.createElement('tr');
            
            // Date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = new Date(date).toLocaleDateString();
            dateCell.style.fontWeight = '600';
            row.appendChild(dateCell);

            // Stock price cells
            this.stocks.forEach(stock => {
                const priceCell = document.createElement('td');
                const price = pricesData[date][stock];
                priceCell.textContent = price ? `₹${price.toFixed(2)}` : 'N/A';
                priceCell.style.fontFamily = 'monospace';
                row.appendChild(priceCell);
            });

            tableBody.appendChild(row);
        });
    }

    displayEigenData(eigenvalues, eigenvectors) {
        const tableBody = document.querySelector('#eigenTable tbody');
        tableBody.innerHTML = '';

        eigenvalues.forEach((eigenvalue, index) => {
            const row = document.createElement('tr');
            
            // Component cell
            const compCell = document.createElement('td');
            compCell.textContent = `PC${index + 1}`;
            compCell.style.fontWeight = 'bold';
            compCell.style.background = index === 0 ? 'linear-gradient(135deg, #3498db, #2980b9)' : '#f8f9fa';
            compCell.style.color = index === 0 ? 'white' : '#2c3e50';
            row.appendChild(compCell);

            // Eigenvalue cell
            const evalCell = document.createElement('td');
            evalCell.textContent = eigenvalue.toFixed(6);
            evalCell.style.fontFamily = 'monospace';
            evalCell.style.fontWeight = '600';
            row.appendChild(evalCell);

            // Eigenvector cells
            eigenvectors[index].forEach((value) => {
                const vecCell = document.createElement('td');
                vecCell.textContent = value.toFixed(4);
                vecCell.style.fontFamily = 'monospace';
                
                if (index === 0) {
                    vecCell.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
                    vecCell.style.color = 'white';
                    vecCell.style.fontWeight = 'bold';
                }
                
                row.appendChild(vecCell);
            });

            tableBody.appendChild(row);
        });
    }

    showResultsSection() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 300);
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        if (show) {
            spinner.classList.remove('hidden');
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            analyzeBtn.disabled = true;
        } else {
            spinner.classList.add('hidden');
            analyzeBtn.innerHTML = '<i class="fas fa-rocket"></i> Analyze Stocks';
            analyzeBtn.disabled = false;
        }
    }

    disableForm(disable) {
        const inputs = document.querySelectorAll('input');
        const button = document.getElementById('analyzeBtn');
        
        inputs.forEach(input => {
            input.disabled = disable;
        });
        button.disabled = disable;
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').classList.remove('hidden');
    }
}

// Modal functions
function closeModal() {
    document.getElementById('errorModal').classList.add('hidden');
}

document.getElementById('errorModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StockAnalysisApp();
    console.log('🚀 Stock Analysis App initialized');
    console.log('📊 Backend URL: https://stockmarketanalysis-33c0.onrender.com');
});
