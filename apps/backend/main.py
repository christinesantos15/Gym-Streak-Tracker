import os
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, SQLModel, create_engine, Session, select, desc

from fastapi.staticfiles import StaticFiles

# Connects to the PostgreSQL container managed by Docker Compose
# 🟢 CHANGE THIS LINE SO IT SAYS @db TO MATCH YOUR COMPOSE FILE
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:secretpassword@db:5432/gym_tracker")
engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

# Database Schema Blueprint
class WorkoutLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exercise_name: str
    repetitions: int
    sets: int
    logged_date: datetime = Field(default_factory=datetime.utcnow)

class StreakResponse(SQLModel):
    current_streak: int
    last_workout_date: Optional[str] = None

app = FastAPI(title="Dynamic Gym Repetition & Streak Tracker API")

# Allows your frontend to safely request data from this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# CRUD: Add a new workout log
@app.post("/workouts", response_model=WorkoutLog)
def log_workout(workout: WorkoutLog, session: Session = Depends(get_session)):
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout

# CRUD: Get a history list of all logged workouts
@app.get("/workouts", response_model=List[WorkoutLog])
def get_workouts(session: Session = Depends(get_session)):
    return session.exec(select(WorkoutLog).order_by(desc(WorkoutLog.logged_date))).all()

# Logic: Dynamically look through history dates and calculate consecutive days
@app.get("/streak", response_model=StreakResponse)
def calculate_streak(session: Session = Depends(get_session)):
    logs = session.exec(select(WorkoutLog).order_by(desc(WorkoutLog.logged_date))).all()
    if not logs:
        return StreakResponse(current_streak=0, last_workout_date=None)

    unique_dates = sorted(list(set([log.logged_date.date() for log in logs])), reverse=True)
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    
    # If the latest workout wasn't today or yesterday, the streak is broken (0)
    if unique_dates[0] != today and unique_dates[0] != yesterday:
        return StreakResponse(current_streak=0, last_workout_date=unique_dates[0].strftime("%Y-%m-%d"))

    # Loop backward to count consecutive active days
    streak = 1
    for i in range(len(unique_dates) - 1):
        if unique_dates[i] - unique_dates[i+1] == timedelta(days=1):
            streak += 1
        else:
            break

    return StreakResponse(current_streak=streak, last_workout_date=unique_dates[0].strftime("%Y-%m-%d"))

# Add this endpoint at the very end of apps/backend/main.py

@app.delete("/workouts/{workout_id}")
def delete_workout(workout_id: int, session: Session = Depends(get_session)):
    db_workout = session.get(WorkoutLog, workout_id)
    if not db_workout:
        raise HTTPException(status_code=404, detail="Workout log not found")
    
    session.delete(db_workout)
    session.commit()
    return {"message": f"Successfully deleted workout log {workout_id}"}

# Assuming your 'index.html' file is inside a folder named 'frontend'
# on your EC2 instance.
app.mount(
    "/", 
    StaticFiles(directory="frontend", html=True), 
    name="frontend"
)