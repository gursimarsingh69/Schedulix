from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import List
import json

from pydantic import BaseModel
from metrics.collector import get_system_metrics
import metrics.collector as collector

app = FastAPI(title="CPU/GPU Visualizer API")

class WorkloadRequest(BaseModel):
    profile: str

@app.post("/api/workload")
async def set_workload(req: WorkloadRequest):
    collector.CURRENT_WORKLOAD = req.profile
    return {"status": "success", "profile": req.profile}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(broadcast_metrics())

async def broadcast_metrics():
    while True:
        try:
            metrics = get_system_metrics()
            await manager.broadcast(json.dumps(metrics))
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"Error in broadcast loop: {e}")
            await asyncio.sleep(1)
