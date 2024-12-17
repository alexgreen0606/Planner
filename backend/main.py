# main.py
from fastapi import FastAPI
from lists import router as list_router

app = FastAPI()

app.include_router(list_router)