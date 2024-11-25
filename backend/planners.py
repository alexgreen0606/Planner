from fastapi import FastAPI, HTTPException, Query, Body
from pydantic import BaseModel
import uuid
from typing import List, Dict, Optional
from datetime import datetime, timedelta


app = FastAPI()

class PlannerPayload(BaseModel):
    timestamp: datetime

class Event(BaseModel):
    id: str
    sort_id: float
    value: str
    timestamp: datetime
    apple_id: Optional[str] = None
    

events_data = {}


def delete_past_events():
    today = datetime.now().strftime('%Y-%m-%d')
    past_dates = [date for date in events_data.keys() if date < today]

    for date in past_dates:
        del events_data[date]


def get_events_for_day(date_str: str):
    if date_str not in events_data:
        events_data[date_str] = []
    return events_data[date_str]


def sort_events(events: List[Event]) -> List[Event]:
    return sorted(events, key=lambda event: event.sort_id)


@app.get("/getPlanner", response_model=List[Event])
def get_planner(timestamp: str = Query(...)):
    try:
        # Parse the timestamp to ensure it's a valid date
        day_str = datetime.strptime(timestamp, '%Y-%m-%d').strftime('%Y-%m-%d')
        events = get_events_for_day(day_str)
        return sort_events(events)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format. Use YYYY-MM-DD.")


@app.post("/createEvent", response_model=Event)
def create_event(payload: Event):
    date_str = payload.timestamp.strftime('%Y-%m-%d')

    if date_str not in events_data:
        events_data[date_str] = []

    unique_id = str(uuid.uuid4())

    new_event = Event(
        id=unique_id,
        sort_id=payload.sort_id,
        value=payload.value,
        timestamp=payload.timestamp,
        apple_id=None
    )
    events_data[date_str].append(new_event)

    return new_event


@app.put("/updateEvent", response_model=Event)
def update_event(payload: Event):
    date_str = payload.timestamp.strftime('%Y-%m-%d')

    if date_str not in events_data:
        raise HTTPException(status_code=404, detail="No events found for the specified date")

    events = events_data[date_str]
    for i, existing_event in enumerate(events):
        if existing_event.id == payload.id:
            events[i] = payload
            return events[i]

    raise HTTPException(status_code=404, detail="Event with the specified ID not found")


@app.delete("/deleteEvent", response_model=Event | None)
def delete_event(event: Event):
    date_str = event.timestamp.strftime('%Y-%m-%d')

    if date_str not in events_data:
        raise HTTPException(status_code=404, detail="No events found for the specified date")

    events = events_data[date_str]
    for i, existing_event in enumerate(events):
        if existing_event.id == event.id:
            deleted_event = events.pop(i)
            return deleted_event

    return None
