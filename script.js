class StockAnalysisApp {
    constructor() {
        // Your Render backend URL
        this.apiBaseUrl = 'https://stockmarketanalysis-1-biws.onrender.com/api';
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
    }

    async checkAPIStatus() {
        const statusElement = document.getElementById('apiStatus');
        try {
            statusElement.innerHTML = '<i class="fas fa-sync fa-spin"></i> API: Checking...';
            
            // Add timeout to avoid hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.apiBaseUrl}/health`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
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
            
            let errorMessage = 'Cannot connect to backend. ';
            if (error.name === 'AbortError') {
                errorMessage += 'Request timed out. Backend might be starting up.';
            } else {
                errorMessage += 'Please check if backend is deployed correctly.';
            }
            
            console.error('Backend connection error:', errorMessage);
        }
    }

    async analyzeStocks() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            this.showError('Please select both start and end dates');
            return;
        }

        if (new Date(startDate) >= new Date(endDate)) {
            this.showError('Start date must be before end date');
            return;
        }

        this.showLoading(true);

        try {
            console.log('🔄 Starting analysis...');
            
            // Add timeout for the analysis request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(`${this.apiBaseUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📊 Analysis response received');

            if (data.success) {
                this.displayResults(data.data);
            } else {
                throw new Error(data.error || 'Analysis failed on server');
            }
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            
            let userMessage = 'Analysis failed: ';
            if (error.name === 'AbortError') {
                userMessage += 'Request timed out. The backend might be starting up or busy. Please try again in 30 seconds.';
            } else if (error.message.includes('Failed to fetch')) {
                userMessage += 'Cannot connect to backend server. Please check:\n\n• Backend is deployed on Render\n• Backend URL is correct\n• No network connectivity issues';
            } else {
                userMessage += error.message;
            }
            
            this.showError(userMessage);
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(data) {
        // Update metrics
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
        document.getElementById('resultsSection').classList.remove('hidden');
        
        console.log('✅ Results displayed successfully');
    }

    displayStockPrices(pricesData) {
        const tableBody = document.querySelector('#pricesTable tbody');
        tableBody.innerHTML = '';

        const dates = Object.keys(pricesData).sort().slice(-5);

        dates.forEach(date => {
            const row = document.createElement('tr');
            
            const dateCell = document.createElement('td');
            dateCell.textContent = new Date(date).toLocaleDateString();
            dateCell.style.fontWeight = '600';
            row.appendChild(dateCell);

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
            
            const compCell = document.createElement('td');
            compCell.textContent = `PC${index + 1}`;
            compCell.style.fontWeight = 'bold';
            compCell.style.background = index === 0 ? 'linear-gradient(135deg, #3498db, #2980b9)' : '#f8f9fa';
            compCell.style.color = index === 0 ? 'white' : '#2c3e50';
            row.appendChild(compCell);

            const evalCell = document.createElement('td');
            evalCell.textContent = eigenvalue.toFixed(6);
            evalCell.style.fontFamily = 'monospace';
            evalCell.style.fontWeight = '600';
            row.appendChild(evalCell);

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

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('hidden');
            document.getElementById('resultsSection').classList.add('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').classList.remove('hidden');
    }
}

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
});
