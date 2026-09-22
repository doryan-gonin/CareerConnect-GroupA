# ENTRYPOINT

from fastapi import FastAPI

app = FastAPI(title = "CareerConnect")

@app.get("/")
def read_root():
    return {"message": "Hello World", "status": "running"}

@app.get("/items/{item_id}")
def read_item(item_id):
    return {"item_id": item_id}