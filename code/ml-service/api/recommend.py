# api/recommend.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import List, Optional, Dict, Any

from models.recommendation.rule_based import RuleBasedRecommender
from services.stock_data import StockDataService

logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self, recommender):
        self.recommender = recommender
        self.stock_data_service = StockDataService()
        logger.info("RecommendationService initialized")
        
    def generate_recommendations(
        self,
        risk_tolerance: str,
        budget: float,
        time_horizon: str,
        sector_preferences: Optional[List[str]] = None,
        exclusions: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate stock recommendations based on user profile and market data.
        
        Args:
            risk_tolerance: User's risk tolerance (conservative, moderate, aggressive)
            budget: Available investment amount
            time_horizon: Investment horizon (short, medium, long)
            sector_preferences: Optional list of preferred sectors
            exclusions: Optional list of stocks or sectors to exclude
            
        Returns:
            List of stock recommendations
        """
        logger.info(f"Generating recommendations for {risk_tolerance} profile with ${budget} budget")
        
        # Get default stock universe based on user profile
        stock_universe = self._get_stock_universe(risk_tolerance, sector_preferences, exclusions)
        
        # Fetch historical data for analysis
        historical_data = self._fetch_historical_data(stock_universe)
        
        # Generate recommendations using the rule-based recommender
        recommendations = self.recommender.generate_recommendations(
            historical_data=historical_data,
            risk_tolerance=risk_tolerance,
            time_horizon=time_horizon,
            budget=budget
        )
        
        # Format recommendations for API response
        formatted_recommendations = []
        for rec in recommendations:
            stock_data = self.stock_data_service.get_stock_details(rec["symbol"])
            
            formatted_recommendations.append({
                "symbol": rec["symbol"],
                "name": stock_data["name"],
                "confidence_score": rec["confidence"],
                "price": stock_data["current_price"],
                "target_price": rec.get("target_price"),
                "rationale": rec["rationale"],
                "suggested_allocation": rec["allocation"]
            })
            
        return formatted_recommendations
        
    def _get_stock_universe(
        self, 
        risk_tolerance: str, 
        sector_preferences: Optional[List[str]],
        exclusions: Optional[List[str]]
    ) -> List[str]:
        """Get appropriate stock universe based on user profile."""
        # Default stock universes based on risk tolerance
        stock_universes = {
            "conservative": ["AAPL", "MSFT", "JNJ", "PG", "KO", "PEP", "VZ", "T", "PFE", "MRK"],
            "moderate": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB", "V", "MA", "PYPL", "DIS", "NFLX"],
            "aggressive": ["TSLA", "NVDA", "AMD", "PLTR", "SQ", "SHOP", "ROKU", "CRWD", "NET", "DKNG"]
        }
        
        # Start with default universe based on risk profile
        universe = stock_universes.get(risk_tolerance, stock_universes["moderate"])
        
        # Apply sector preferences if provided
        if sector_preferences:
            # In a real implementation, this would filter stocks by sector
            # For this example, we'll just keep the first 5 stocks
            universe = universe[:5]
            
        # Apply exclusions if provided
        if exclusions:
            universe = [stock for stock in universe if stock not in exclusions]
            
        return universe
        
    def _fetch_historical_data(self, symbols: List[str]) -> pd.DataFrame:
        """Fetch 30-day historical data for the given symbols."""
        # In a real implementation, this would call an external data provider
        # For this example, we'll generate synthetic data
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        historical_data = {}
        
        for symbol in symbols:
            # Generate synthetic price data
            dates = pd.date_range(start=start_date, end=end_date)
            base_price = np.random.randint(50, 500)
            
            # Create price series with some randomness and trend
            prices = np.linspace(base_price, base_price * (1 + np.random.uniform(-0.2, 0.3)), len(dates))
            prices = prices * (1 + np.random.normal(0, 0.01, len(dates)))
            
            # Create volume data
            volumes = np.random.randint(1000000, 10000000, len(dates))
            
            # Create DataFrame
            df = pd.DataFrame({
                'date': dates,
                'open': prices * 0.99,
                'high': prices * 1.02,
                'low': prices * 0.98,
                'close': prices,
                'volume': volumes
            })
            
            historical_data[symbol] = df
            
        return historical_data


# api/sentiment.py
import logging
from typing import List, Optional, Dict, Any
import pandas as pd
from datetime import datetime, timedelta

from models.sentiment.transformer_model import TransformerSentimentAnalyzer
from services.news_service import NewsService

logger = logging.getLogger(__name__)

class SentimentAnalysisService:
    def __init__(self, sentiment_analyzer):
        self.sentiment_analyzer = sentiment_analyzer
        self.news_service = NewsService()
        logger.info("SentimentAnalysisService initialized")
        
    def analyze_sentiment(
        self,
        text: Optional[str] = None,
        symbols: Optional[List[str]] = None,
        sources: Optional[List[str]] = None,
        date_range: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Analyze sentiment from financial news or provided text.
        
        Args:
            text: Optional text to analyze
            symbols: Optional list of stock symbols to analyze news for
            sources: Optional list of news sources to include
            date_range: Number of days to look back for news
            
        Returns:
            List of sentiment analysis results
        """
        logger.info(f"Analyzing sentiment for {symbols if symbols else 'provided text'}")
        
        results = []
        
        # If text is provided directly, analyze it
        if text:
            sentiment = self.sentiment_analyzer.analyze(text)
            results.append({
                "text": text[:100] + "..." if len(text) > 100 else text,  # Truncate for display
                "sentiment_score": sentiment["score"],
                "sentiment_label": sentiment["label"],
                "key_terms": sentiment["key_terms"],
                "confidence": sentiment["confidence"]
            })
            
        # If symbols are provided, fetch and analyze news for each symbol
        if symbols:
            for symbol in symbols:
                news_items = self.news_service.get_news(
                    symbol=symbol,
                    sources=sources,
                    days=date_range
                )
                
                for news in news_items[:5]:  # Limit to 5 news items per symbol
                    sentiment = self.sentiment_analyzer.analyze(news["content"])
                    results.append({
                        "symbol": symbol,
                        "text": news["title"],
                        "sentiment_score": sentiment["score"],
                        "sentiment_label": sentiment["label"],
                        "key_terms": sentiment["key_terms"],
                        "confidence": sentiment["confidence"]
                    })
        
        return results