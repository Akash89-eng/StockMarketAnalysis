from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

class StockAnalyzer:
    def __init__(self):
        self.stocks = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ITC.NS']
    
    def generate_stock_data(self, start_date, end_date):
        """Generate realistic stock data"""
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        dates = dates[dates.dayofweek < 5]  # Remove weekends
        
        # Base prices for Indian stocks
        base_prices = {
            'RELIANCE.NS': 2500,
            'TCS.NS': 3500, 
            'INFY.NS': 1800,
            'HDFCBANK.NS': 1600,
            'ITC.NS': 400
        }
        
        data = {}
        for stock in self.stocks:
            prices = []
            current_price = base_prices[stock] * (1 + np.random.uniform(-0.1, 0.1))
            
            for i in range(len(dates)):
                # Realistic price movement with trend and noise
                trend = np.sin(i * 0.1) * 0.001  # Small cyclic trend
                news_effect = np.random.normal(0, 0.01)  # Random news impact
                market_sentiment = np.random.normal(0, 0.005)  # General market movement
                
                price_change = trend + news_effect + market_sentiment
                current_price = max(current_price * (1 + price_change), base_prices[stock] * 0.5)  # Prevent crash below 50%
                prices.append(current_price)
            
            data[stock] = pd.Series(prices, index=dates)
        
        return pd.DataFrame(data)
    
    def calculate_returns(self, data):
        """Calculate daily returns"""
        returns = data.pct_change().dropna()
        return returns
    
    def perform_pca_analysis(self, returns):
        """Perform PCA analysis on returns"""
        # Calculate covariance matrix
        cov_matrix = returns.cov()
        
        # Calculate eigenvalues and eigenvectors
        eigenvalues, eigenvectors = np.linalg.eig(cov_matrix)
        
        # Sort by eigenvalues (descending)
        idx = eigenvalues.argsort()[::-1]
        eigenvalues = eigenvalues[idx]
        eigenvectors = eigenvectors[:, idx]
        
        return cov_matrix, eigenvalues, eigenvectors
    
    def create_trend_chart(self, eigenvectors, eigenvalues):
        """Create market trend visualization"""
        plt.figure(figsize=(10, 6))
        main_vector = eigenvectors[:, 0]  # First principal component
        
        colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
        bars = plt.bar(range(len(self.stocks)), main_vector, color=colors, alpha=0.8)
        
        plt.title('Stock Influence on Main Market Trend', fontsize=14, fontweight='bold')
        plt.xlabel('Stocks', fontweight='bold')
        plt.ylabel('Eigenvector Value', fontweight='bold')
        
        stock_names = [stock.split('.')[0] for stock in self.stocks]
        plt.xticks(range(len(self.stocks)), stock_names, rotation=45)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.3f}', ha='center', va='bottom', fontweight='bold')
        
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        
        return self.plot_to_base64()
    
    def create_returns_chart(self, returns):
        """Create cumulative returns chart"""
        plt.figure(figsize=(10, 6))
        cumulative_returns = (1 + returns).cumprod()
        
        colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
        
        for i, stock in enumerate(self.stocks):
            plt.plot(cumulative_returns.index, cumulative_returns[stock], 
                    label=stock.split('.')[0], linewidth=2, color=colors[i])
        
        plt.title('Cumulative Returns Over Time', fontsize=14, fontweight='bold')
        plt.xlabel('Date', fontweight='bold')
        plt.ylabel('Cumulative Returns', fontweight='bold')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        return self.plot_to_base64()
    
    def plot_to_base64(self):
        """Convert matplotlib plot to base64 string"""
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
        buffer.seek(0)
        image_png = buffer.getvalue()
        buffer.close()
        plt.close()
        return base64.b64encode(image_png).decode('utf-8')

# Initialize analyzer
analyzer = StockAnalyzer()

@app.route('/')
def home():
    return jsonify({
        "message": "Stock Analysis Backend is Running! 🚀",
        "status": "active",
        "endpoints": {
            "health": "/api/health",
            "analyze": "/api/analyze (POST)"
        },
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'message': 'Stock Analysis API is running smoothly',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_stocks():
    try:
        # Get request data
        data = request.get_json()
        start_date = data.get('start_date', '2024-09-01')
        end_date = data.get('end_date', '2024-10-01')
        
        print(f"📊 Received analysis request: {start_date} to {end_date}")
        
        # Generate stock data
        stock_data = analyzer.generate_stock_data(start_date, end_date)
        
        # Calculate returns
        returns = analyzer.calculate_returns(stock_data)
        
        # Perform PCA analysis
        cov_matrix, eigenvalues, eigenvectors = analyzer.perform_pca_analysis(returns)
        
        # Prepare response
        response_data = {
            'stock_prices': stock_data.tail().to_dict(),
            'daily_returns': returns.tail().to_dict(),
            'covariance_matrix': cov_matrix.to_dict(),
            'eigenvalues': eigenvalues.tolist(),
            'eigenvectors': eigenvectors.tolist(),
            'analysis': {
                'main_trend_stock': analyzer.stocks[np.argmax(np.abs(eigenvectors[:, 0]))],
                'variance_explained': (eigenvalues[0] / np.sum(eigenvalues)) * 100,
                'total_variance': np.sum(eigenvalues),
                'number_of_days': len(stock_data)
            },
            'trend_chart': analyzer.create_trend_chart(eigenvectors, eigenvalues),
            'returns_chart': analyzer.create_returns_chart(returns)
        }
        
        print("✅ Analysis completed successfully")
        return jsonify({
            'success': True,
            'data': response_data,
            'message': 'Stock analysis completed successfully'
        })
        
    except Exception as e:
        print(f"❌ Error in analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error performing stock analysis'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting Stock Analysis Backend on port {port}...")
    app.run(host='0.0.0.0', port=port)
