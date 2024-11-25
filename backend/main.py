# main.py
from fastapi import FastAPI
from planners import app as planner_app
from lists import app as list_app

app = FastAPI()

app.mount("/planner", planner_app)
app.mount("/folders", list_app)