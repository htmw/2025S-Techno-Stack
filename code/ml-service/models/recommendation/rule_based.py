# models/recommendation/rule_based.py
import pandas as pd
import numpy as np
from typing import Dict, List, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class RuleBasedRecommender:
    """
    Rule-based recommendation engine that uses predefined rules to generate
    stock recommendations based on user profiles and market data.
    """
    
    def __init__(self):
        logger.info("Initializing RuleBasedRecommender")
        
    def generate_recommendations(
        self,
        historical_data: Dict[str, pd.DataFrame],
        risk_tolerance: str,
        time_horizon: str,
        budget: float
    ) -> List[Dict[str, Any]]:
        """
        Generate stock recommendations based on historical data and user profile.
        
        Args:
            historical_data: Dictionary mapping symbols to DataFrames of historical data
            risk_tolerance: User's risk tolerance (conservative, moderate, aggressive)
            time_horizon: Investment time horizon (short, medium, long)
            budget: Available investment budget
            
        Returns:
            List of recommended stocks with allocation percentages
        """
        logger.info(f"Generating recommendations for {risk_tolerance} profile, {time_horizon} horizon")
        
        # Calculate technical indicators for each stock
        analyzed_stocks = []
        for symbol, data in historical_data.items():
            analysis = self._analyze_stock(symbol, data, risk_tolerance, time_horizon)
            analyzed_stocks.append(analysis)
            
        # Sort stocks by score in descending order
        analyzed_stocks.sort(key=lambda x: x["score"], reverse=True)
        
        # Select top stocks based on risk tolerance
        num_recommendations = {
            "conservative": 3,  # Fewer stocks for conservative investors
            "moderate": 5,      # More diversification for moderate
            "aggressive": 7      # Even more for aggressive
        }.get(risk_tolerance, 5)
        
        top_stocks = analyzed_stocks[:num_recommendations]
        
        # Calculate allocation percentages
        total_score = sum(stock["score"] for stock in top_stocks)
        
        recommendations = []
        for stock in top_stocks:
            # Calculate allocation based on relative scores
            allocation = (stock["score"] / total_score) * 100
            
            # Adjust allocation based on risk tolerance
            if risk_tolerance == "conservative":
                # More even distribution for conservative profiles
                allocation = 0.7 * allocation + 0.3 * (100 / len(top_stocks))
            elif risk_tolerance == "aggressive":
                # More concentration in top picks for aggressive profiles
                allocation = 1.2 * allocation
                
            recommendations.append({
                "symbol": stock["symbol"],
                "confidence": self._map_score_to_confidence(stock["score"]),
                "rationale": stock["rationale"],
                "allocation": round(allocation, 2),
                "target_price": stock.get("target_price")
            })
            
        # Normalize allocations to sum to 100%
        total_allocation = sum(rec["allocation"] for rec in recommendations)
        for rec in recommendations:
            rec["allocation"] = round((rec["allocation"] / total_allocation) * 100, 2)
            
        return recommendations
        
    def _analyze_stock(
        self, 
        symbol: str, 
        data: pd.DataFrame,
        risk_tolerance: str,
        time_horizon: str
    ) -> Dict[str, Any]:
        """Analyze a stock using technical indicators and return a score and rationale."""
        # Calculate technical indicators
        data = self._calculate_indicators(data)
        
        # Get the most recent data point
        current = data.iloc[-1]
        
        # Initialize score and observations
        score = 50  # Base score
        observations = []
        
        # Check moving average signals
        if current["close"] > current["ma_20"]:
            score += 10
            observations.append("Price above 20-day MA")
        else:
            score -= 5
            observations.append("Price below 20-day MA")
            
        if current["ma_5"] > current["ma_20"]:
            score += 15
            observations.append("5-day MA crossed above 20-day MA")
        
        # Check RSI
        if risk_tolerance == "conservative":
            # Conservative - prefer stable stocks
            if 40 <= current["rsi"] <= 60:
                score += 15
                observations.append("RSI indicates stable momentum")
            elif current["rsi"] > 70:
                score -= 20
                observations.append("RSI indicates potential overbought conditions")
                
        elif risk_tolerance == "aggressive":
            # Aggressive - prefer momentum
            if current["rsi"] >= 60:
                score += 20
                observations.append("RSI shows strong momentum")
                
        # Check volatility based on risk tolerance
        volatility = data["close"].pct_change().std() * np.sqrt(252)  # Annualized volatility
        
        volatility_score = 0
        if risk_tolerance == "conservative":
            # Conservative - prefer low volatility
            if volatility < 0.2:
                volatility_score = 15
                observations.append("Low volatility suitable for conservative profile")
            else:
                volatility_score = -15
                observations.append("Higher volatility than ideal for conservative profile")
                
        elif risk_tolerance == "moderate":
            # Moderate - prefer medium volatility
            if 0.2 <= volatility <= 0.3:
                volatility_score = 10
                observations.append("Moderate volatility suitable for balanced profile")
                
        elif risk_tolerance == "aggressive":
            # Aggressive - can handle higher volatility
            if volatility > 0.3:
                volatility_score = 10
                observations.append("Higher volatility with potential for greater returns")
                
        score += volatility_score
        
        # Trend strength based on time horizon
        trend_strength = self._calculate_trend_strength(data)
        
        if time_horizon == "short":
            # Short-term: Focus on recent momentum
            if trend_strength["short_term"] > 0.7:
                score += 15
                observations.append("Strong short-term uptrend")
                
        elif time_horizon == "medium":
            # Medium-term: Balance of short and medium trends
            avg_trend = (trend_strength["short_term"] + trend_strength["medium_term"]) / 2
            if avg_trend > 0.6:
                score += 15
                observations.append("Consistent medium-term uptrend")
                
        elif time_horizon == "long":
            # Long-term: Focus on longer trends and fundamental strength
            if trend_strength["medium_term"] > 0.6:
                score += 10
                observations.append("Solid long-term growth potential")
        
        # Create rationale based on top observations
        rationale = " and ".join(observations[:3])
        
        # Calculate simple target price based on recent movement and risk profile
        recent_return = (data["close"].iloc[-1] / data["close"].iloc[0]) - 1
        
        target_multiplier = {
            "conservative": 1.05,  # 5% growth target
            "moderate": 1.10,      # 10% growth target
            "aggressive": 1.20     # 20% growth target
        }.get(risk_tolerance, 1.10)
        
        target_price = round(current["close"] * target_multiplier, 2)
        
        return {
            "symbol": symbol,
            "score": round(max(min(score, 100), 0), 2),  # Clamp score between 0-100
            "rationale": rationale,
            "target_price": target_price
        }
    
    def _calculate_indicators(self, data: pd.DataFrame) -> pd.DataFrame:
        """Calculate technical indicators for the given data."""
        # Calculate moving averages
        data["ma_5"] = data["close"].rolling(window=5).mean()
        data["ma_10"] = data["close"].rolling(window=10).mean()
        data["ma_20"] = data["close"].rolling(window=20).mean()
        
        # Calculate RSI
        delta = data["close"].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        
        rs = gain / loss
        data["rsi"] = 100 - (100 / (1 + rs))
        
        # Calculate MACD
        data["ema_12"] = data["close"].ewm(span=12, adjust=False).mean()
        data["ema_26"] = data["close"].ewm(span=26, adjust=False).mean()
        data["macd"] = data["ema_12"] - data["ema_26"]
        data["macd_signal"] = data["macd"].ewm(span=9, adjust=False).mean()
        
        return data
    
    def _calculate_trend_strength(self, data: pd.DataFrame) -> Dict[str, float]:
        """Calculate trend strength at different timeframes."""
        # Short-term trend (5 days)
        short_term_data = data.iloc[-5:]
        short_term_trend = 1 if short_term_data["close"].iloc[-1] > short_term_data["close"].iloc[0] else 0
        
        # Medium-term trend (20 days)
        medium_term_data = data.iloc[-20:]
        medium_term_trend = 1 if medium_term_data["close"].iloc[-1] > medium_term_data["close"].iloc[0] else 0
        
        # Calculate trend consistency (percentage of days with positive returns)
        short_term_consistency = (short_term_data["close"].pct_change() > 0).mean()
        medium_term_consistency = (medium_term_data["close"].pct_change() > 0).mean()
        
        return {
            "short_term": short_term_trend * short_term_consistency,
            "medium_term": medium_term_trend * medium_term_consistency
        }
    
    def _map_score_to_confidence(self, score: float) -> float:
        """Map internal score (0-100) to confidence level (0-1)."""
        # Simple linear mapping
        return round(score / 100, 2)


# models/sentiment/transformer_model.py
import numpy as np
from typing import Dict, List, Any, Optional
import logging
import re

logger = logging.getLogger(__name__)

class TransformerSentimentAnalyzer:
    """
    A sentiment analysis model that uses transformer architecture 
    to analyze financial text for sentiment and key terms.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the sentiment analyzer with a pre-trained transformer model.
        
        In a real implementation, this would load the model from disk.
        For this example, we'll simulate the model's behavior.
        """
        self.model_path = model_path
        logger.info(f"Initializing TransformerSentimentAnalyzer with model path: {model_path}")
        
        # Financial terms dictionary for key term extraction
        self.financial_terms = [
            "earnings", "revenue", "profit", "loss", "dividend", "growth",
            "forecast", "guidance", "outlook", "downgrade", "upgrade",
            "acquisition", "merger", "partnership", "investment", "expansion",
            "restructuring", "layoffs", "CEO", "executive", "strategy",
            "regulation", "Fed", "interest rates", "inflation", "recession",
            "bull market", "bear market", "volatility", "rally", "correction"
        ]
        
        # Load model (simulated in this example)
        logger.info("Model loaded successfully")
        
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze the sentiment of the given text.
        
        Args:
            text: The text to analyze
            
        Returns:
            Dictionary containing sentiment score, label, key terms, and confidence
        """
        logger.info(f"Analyzing text: {text[:50]}...")
        
        # In a real implementation, this would use the transformer model
        # For this example, we'll use a simple rule-based approach
        
        # Positive and negative word dictionaries with weights
        positive_words = {
            "up": 0.5, "gain": 0.7, "profit": 0.8, "growth": 0.6, 
            "positive": 0.7, "increase": 0.6, "higher": 0.5, "beat": 0.8,
            "strong": 0.6, "outperform": 0.8, "exceed": 0.7, "above": 0.5,
            "record": 0.7, "bullish": 0.9, "confident": 0.6, "opportunity": 0.5,
            "recovery": 0.6, "momentum": 0.5, "advantage": 0.5, "successful": 0.6
        }
        
        negative_words = {
            "down": 0.5, "loss": 0.7, "decline": 0.6, "negative": 0.7,
            "decrease": 0.6, "lower": 0.5, "miss": 0.8, "weak": 0.6,
            "underperform": 0.8, "below": 0.5, "disappoint": 0.7, "concern": 0.6,
            "bearish": 0.9, "warning": 0.7, "risk": 0.5, "challenge": 0.5,
            "struggle": 0.6, "slowdown": 0.6, "pressure": 0.5, "fail": 0.8
        }
        
        # Convert to lowercase and tokenize
        tokens = re.findall(r'\b\w+\b', text.lower())
        
        # Count positive and negative words
        positive_score = sum(positive_words.get(word, 0) for word in tokens)
        negative_score = sum(negative_words.get(word, 0) for word in tokens)
        
        # Calculate overall sentiment score (-1 to 1)
        if positive_score + negative_score > 0:
            sentiment_score = (positive_score - negative_score) / (positive_score + negative_score)
        else:
            sentiment_score = 0  # Neutral if no sentiment words found
            
        # Determine sentiment label
        if sentiment_score > 0.2:
            sentiment_label = "positive"
        elif sentiment_score < -0.2:
            sentiment_label = "negative"
        else:
            sentiment_label = "neutral"
            
        # Extract key financial terms
        key_terms = [term for term in self.financial_terms 
                     if re.search(r'\b' + re.escape(term.lower()) + r'\b', text.lower())]
                
        # Limit to top 5 terms
        key_terms = key_terms[:5]
        
        # Calculate confidence (how certain the model is about its prediction)
        # For this example, we'll use a simple approach based on sentiment strength
        confidence = min(0.5 + abs(sentiment_score) * 0.5, 0.95)
        
        return {
            "score": round(sentiment_score, 2),
            "label": sentiment_label,
            "key_terms": key_terms,
            "confidence": round(confidence, 2)
        }