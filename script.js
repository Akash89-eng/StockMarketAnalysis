class StockAnalysisApp {
    constructor() {
        // 🔧 REPLACE THIS WITH YOUR ACTUAL RENDER BACKEND URL
        this.apiBaseUrl = 'https://your-stock-backend.onrender.com/api';
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
            
            const response = await fetch(`${this.apiBaseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
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
            
            // Show helpful message
            if (this.apiBaseUrl.includes('your-stock-backend')) {
                this.showError('Please update the API URL in script.js with your actual Render backend URL');
            }
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
            console.log('📊 Sending analysis request...');
            
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
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Analysis response received');

            if (data.success) {
                this.displayResults(data.data);
            } else {
                throw new Error(data.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('❌ Analysis error:', error);
            this.showError(`Analysis failed: ${error.message}\n\nMake sure:\n1. Your Render backend is running\n2. The API URL is correct in script.js\n3. You have internet connection`);
        } finally {
            this.showLoading(false);
            this.disableForm(false);
        }
    }

    displayResults(data) {
        // Update key metrics
        this.updateMetrics(data.analysis);
        
        // Display charts
        this.displayCharts(data);
        
        // Display data tables
        this.displayStockPrices(data.stock_prices);
        this.displayEigenData(data.eigenvalues, data.eigenvectors);

        // Show results section with animation
        this.showResultsSection();
        
        // Log success
        console.log('📈 Results displayed successfully');
    }

    updateMetrics(analysis) {
        document.getElementById('mainTrendStock').textContent = analysis.main_trend_stock.split('.')[0];
        document.getElementById('varianceExplained').textContent = 
            analysis.variance_explained.toFixed(2) + '%';
        document.getElementById('totalVariance').textContent = 
            analysis.total_variance.toFixed(6);
        document.getElementById('tradingDays').textContent = analysis.number_of_days;

        // Add animation to metrics
        this.animateMetrics();
    }

    animateMetrics() {
        const metrics = document.querySelectorAll('.metric-value');
        metrics.forEach(metric => {
            metric.style.opacity = '0';
            metric.style.transform = 'translateY(20px)';
            setTimeout(() => {
                metric.style.transition = 'all 0.5s ease';
                metric.style.opacity = '1';
                metric.style.transform = 'translateY(0)';
            }, 100);
        });
    }

    displayCharts(data) {
        // Display trend chart
        const trendChart = document.getElementById('trendChart');
        trendChart.src = `data:image/png;base64,${data.trend_chart}`;
        trendChart.onload = () => {
            trendChart.style.opacity = '0';
            trendChart.style.transform = 'scale(0.9)';
            setTimeout(() => {
                trendChart.style.transition = 'all 0.5s ease';
                trendChart.style.opacity = '1';
                trendChart.style.transform = 'scale(1)';
            }, 200);
        };

        // Display returns chart
        const returnsChart = document.getElementById('returnsChart');
        returnsChart.src = `data:image/png;base64,${data.returns_chart}`;
        returnsChart.onload = () => {
            returnsChart.style.opacity = '0';
            returnsChart.style.transform = 'scale(0.9)';
            setTimeout(() => {
                returnsChart.style.transition = 'all 0.5s ease';
                returnsChart.style.opacity = '1';
                returnsChart.style.transform = 'scale(1)';
            }, 400);
        };

        // Display correlation chart if available
        if (data.correlation_chart) {
            const correlationChart = document.getElementById('correlationChart');
            correlationChart.src = `data:image/png;base64,${data.correlation_chart}`;
            correlationChart.onload = () => {
                correlationChart.style.opacity = '0';
                correlationChart.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    correlationChart.style.transition = 'all 0.5s ease';
                    correlationChart.style.opacity = '1';
                    correlationChart.style.transform = 'scale(1)';
                }, 600);
            };
        }
    }

    displayStockPrices(pricesData) {
        const tableBody = document.querySelector('#pricesTable tbody');
        tableBody.innerHTML = '';

        if (!pricesData || Object.keys(pricesData).length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.textContent = 'No price data available';
            cell.style.textAlign = 'center';
            cell.style.color = '#666';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        const dates = Object.keys(pricesData).sort().slice(-5);

        dates.forEach((date, index) => {
            const row = document.createElement('tr');
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            
            // Date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = new Date(date).toLocaleDateString();
            dateCell.style.fontWeight = '600';
            row.appendChild(dateCell);

            // Stock price cells
            this.stocks.forEach(stock => {
                const priceCell = document.createElement('td');
                const price = pricesData[date]?.[stock];
                priceCell.textContent = price ? `₹${price.toFixed(2)}` : 'N/A';
                priceCell.style.fontFamily = 'monospace';
                priceCell.style.fontWeight = '500';
                row.appendChild(priceCell);
            });

            tableBody.appendChild(row);

            // Animate row appearance
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateX(0)';
            }, index * 100);
        });
    }

    displayEigenData(eigenvalues, eigenvectors) {
        const tableBody = document.querySelector('#eigenTable tbody');
        tableBody.innerHTML = '';

        if (!eigenvalues || !eigenvectors) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.textContent = 'No PCA data available';
            cell.style.textAlign = 'center';
            cell.style.color = '#666';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        eigenvalues.forEach((eigenvalue, index) => {
            const row = document.createElement('tr');
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';

            // Component cell
            const compCell = document.createElement('td');
            compCell.textContent = `PC${index + 1}`;
            compCell.style.fontWeight = 'bold';
            compCell.style.background = index === 0 ? 'linear-gradient(135deg, #3498db, #2980b9)' : '#f8f9fa';
            compCell.style.color = index === 0 ? 'white' : '#2c3e50';
            compCell.style.padding = '12px';
            row.appendChild(compCell);

            // Eigenvalue cell
            const evalCell = document.createElement('td');
            evalCell.textContent = eigenvalue.toFixed(6);
            evalCell.style.fontFamily = 'monospace';
            evalCell.style.fontWeight = '600';
            evalCell.style.background = index === 0 ? 'rgba(52, 152, 219, 0.1)' : 'transparent';
            row.appendChild(evalCell);

            // Eigenvector cells
            eigenvectors[index].forEach((value, stockIndex) => {
                const vecCell = document.createElement('td');
                vecCell.textContent = value.toFixed(4);
                vecCell.style.fontFamily = 'monospace';
                vecCell.style.fontWeight = '500';
                
                // Highlight the main component
                if (index === 0) {
                    vecCell.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
                    vecCell.style.color = 'white';
                    vecCell.style.fontWeight = 'bold';
                }
                
                row.appendChild(vecCell);
            });

            tableBody.appendChild(row);

            // Animate row appearance
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateX(0)';
            }, index * 100);
        });
    }

    showResultsSection() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
        
        // Add entrance animation
        resultsSection.style.opacity = '0';
        resultsSection.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            resultsSection.style.transition = 'all 0.6s ease';
            resultsSection.style.opacity = '1';
            resultsSection.style.transform = 'translateY(0)';
        }, 100);

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
        
        // Add animation to modal
        const modal = document.getElementById('errorModal');
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '1';
        }, 10);
    }

    // Utility function to format numbers
    formatNumber(num, decimals = 2) {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    // Add download functionality
    downloadResults() {
        const resultsSection = document.getElementById('resultsSection');
        const data = {
            timestamp: new Date().toISOString(),
            analysis: {
                mainTrendStock: document.getElementById('mainTrendStock').textContent,
                varianceExplained: document.getElementById('varianceExplained').textContent,
                totalVariance: document.getElementById('totalVariance').textContent,
                tradingDays: document.getElementById('tradingDays').textContent
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-analysis-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Modal functions
function closeModal() {
    const modal = document.getElementById('errorModal');
    modal.style.opacity = '1';
    setTimeout(() => {
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }, 10);
}

// Close modal when clicking outside or pressing ESC
document.getElementById('errorModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Add download button handler
function addDownloadButton() {
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Results';
    downloadBtn.className = 'download-btn';
    downloadBtn.style.cssText = `
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        margin: 20px auto;
        display: block;
        transition: all 0.3s ease;
    `;
    downloadBtn.onclick = () => window.stockApp.downloadResults();
    downloadBtn.onmouseover = () => {
        downloadBtn.style.transform = 'translateY(-2px)';
        downloadBtn.style.boxShadow = '0 8px 20px rgba(39, 174, 96, 0.3)';
    };
    downloadBtn.onmouseout = () => {
        downloadBtn.style.transform = 'translateY(0)';
        downloadBtn.style.boxShadow = 'none';
    };
    
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.appendChild(downloadBtn);
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.stockApp = new StockAnalysisApp();
    
    // Add download button after a delay
    setTimeout(addDownloadButton, 1000);
    
    console.log('🚀 Stock Analysis App initialized');
    console.log('📊 API Base URL:', window.stockApp.apiBaseUrl);
});

// Add some utility CSS for animations
const style = document.createElement('style');
style.textContent = `
    .download-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(39, 174, 96, 0.3);
    }
    
    .metric-card {
        transition: all 0.3s ease;
    }
    
    .chart-image {
        transition: transform 0.3s ease;
    }
    
    .chart-image:hover {
        transform: scale(1.02);
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .fade-in-up {
        animation: fadeInUp 0.6s ease;
    }
`;
document.head.appendChild(style);
