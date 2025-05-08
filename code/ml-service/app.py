# app.py
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta

# Import service modules
from api.recommend import RecommendationService
from api.sentiment import SentimentAnalysisService
from models.recommendation.rule_based import RuleBasedRecommender
from models.sentiment.transformer_model import TransformerSentimentAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="InvestIQ ML API",
    description="Machine Learning API for investment recommendations and sentiment analysis",
    version="1.0.0"
)

# Initialize services
recommendation_service = RecommendationService(RuleBasedRecommender())
sentiment_service = SentimentAnalysisService(TransformerSentimentAnalyzer())

# Request/Response models
class UserProfile(BaseModel):
    risk_tolerance: str  # "conservative", "moderate", "aggressive"
    budget: float
    time_horizon: str  # "short", "medium", "long"
    sector_preferences: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None

class StockRecommendation(BaseModel):
    symbol: str
    name: str
    confidence_score: float
    price: float
    target_price: Optional[float] = None
    rationale: str
    suggested_allocation: float  # percentage of budget

class RecommendationResponse(BaseModel):
    recommendations: List[StockRecommendation]
    timestamp: datetime

class SentimentRequest(BaseModel):
    text: Optional[str] = None
    symbols: Optional[List[str]] = None
    sources: Optional[List[str]] = None
    date_range: Optional[int] = 7  # days

class SentimentAnalysis(BaseModel):
    symbol: Optional[str] = None
    text: Optional[str] = None
    sentiment_score: float  # -1.0 to 1.0
    sentiment_label: str  # "positive", "neutral", "negative"
    key_terms: List[str]
    confidence: float

class SentimentResponse(BaseModel):
    analysis: List[SentimentAnalysis]
    overall_sentiment: float
    timestamp: datetime

@app.get("/")
async def root():
    return {"message": "InvestIQ ML API is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0"
    }

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(profile: UserProfile):
    try:
        logger.info(f"Processing recommendation request for {profile.risk_tolerance} profile")
        recommendations = recommendation_service.generate_recommendations(
            risk_tolerance=profile.risk_tolerance,
            budget=profile.budget,
            time_horizon=profile.time_horizon,
            sector_preferences=profile.sector_preferences,
            exclusions=profile.exclusions
        )
        
        return RecommendationResponse(
            recommendations=recommendations,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

@app.post("/news-sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    try:
        logger.info(f"Processing sentiment analysis request")
        
        analysis_results = sentiment_service.analyze_sentiment(
            text=request.text,
            symbols=request.symbols,
            sources=request.sources,
            date_range=request.date_range
        )
        
        # Calculate overall sentiment
        if analysis_results:
            overall_sentiment = sum(result.sentiment_score for result in analysis_results) / len(analysis_results)
        else:
            overall_sentiment = 0.0
            
        return SentimentResponse(
            analysis=analysis_results,
            overall_sentiment=overall_sentiment,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze sentiment: {str(e)}")

if __name__ == "__main__":
    logger.info("Starting InvestIQ ML API")
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)