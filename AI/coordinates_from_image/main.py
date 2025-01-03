from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from models import DetectionResponse
import os
from coordinates import detect_and_get_gps_coordinates

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detect", response_model=DetectionResponse)
async def detect_people(file: UploadFile = File(...), 
                       drone_lat: float = 0.0,
                       drone_lon: float = 0.0,
                       altitude: float = 0.0,
                       fov_h: float = 0.0,
                       fov_v: float = 0.0):
    # Save uploaded file temporarily
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    try:
        # Process the image
        result = detect_and_get_gps_coordinates(
            temp_file_path,
            drone_lat,
            drone_lon,
            altitude,
            fov_h,
            fov_v
        )
        return result
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
