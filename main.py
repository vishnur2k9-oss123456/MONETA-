import uvicorn
from fastapi import FastAPI
from app.api import auth, complaints, transactions, predictions, risk, feedback, alerts, health
from app.database import init_db

app = FastAPI(title="SIH26184 – Cybercrime Predictive Analytics Backend",
              description="Backend implementing temporal graph, geospatial prediction, feedback loop, and risk prioritisation.",
              version="0.1.0")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(complaints.router, prefix="/complaints", tags=["complaint"])
app.include_router(transactions.router, prefix="/transactions", tags=["transaction"])
app.include_router(predictions.router, prefix="/predictions", tags=["prediction"])
app.include_router(risk.router, prefix="/risk", tags=["risk"])
app.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(health.router, prefix="/health", tags=["health"])

# Startup event – create tables if missing
@app.on_event("startup")
async def on_startup():
    await init_db()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
