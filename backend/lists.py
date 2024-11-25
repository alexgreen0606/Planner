from fastapi import FastAPI, HTTPException, Query, Body
from pydantic import BaseModel
import uuid
from typing import List, Dict, Optional, Literal

app = FastAPI()

# Models
class ListItem(BaseModel):
    id: str
    sort_id: float
    value: str

class ListModel(BaseModel):
    id: str
    name: str
    parent_folder_id: Optional[str] = None
    sort_id: float
    items: List[ListItem]

class Folder(BaseModel):
    id: str
    name: str
    sort_id: float
    parent_folder_id: Optional[str] = None
    folder_ids: List[str]
    list_ids: List[str]

# Response Models
class FolderItem(BaseModel):
    id: str
    name: str
    sort_id: float
    type: Literal["folder", "list"]

class FolderResponse(BaseModel):
    id: str
    name: str
    sort_id: float
    parent_folder_id: Optional[str] = None
    items: List[FolderItem]

# Data storage
folders_data: Dict[str, Folder] = {}
lists_data: Dict[str, ListModel] = {}

# Helper functions
def get_folder(folder_id: str) -> Folder:
    if folder_id not in folders_data:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folders_data[folder_id]

def get_list(list_id: str) -> ListModel:
    if list_id not in lists_data:
        raise HTTPException(status_code=404, detail="List not found")
    return lists_data[list_id]

def get_folder_response(folder: Folder) -> FolderResponse:
    items = []
    
    for fid in folder.folder_ids:
        child_folder = folders_data[fid]
        items.append(FolderItem(
            id=fid,
            name=child_folder.name,
            sort_id=child_folder.sort_id,
            type="folder"
        ))
    
    for lid in folder.list_ids:
        child_list = lists_data[lid]
        items.append(FolderItem(
            id=lid,
            name=child_list.name,
            sort_id=child_list.sort_id,
            type="list"
        ))
    
    # Sort items by sort_id
    items.sort(key=lambda x: x.sort_id)
    
    return FolderResponse(
        id=folder.id,
        name=folder.name,
        sort_id=folder.sort_id,
        parent_folder_id=folder.parent_folder_id,
        items=items
    )

# Endpoints
@app.get("/folders", response_model=FolderResponse)
def get_root_folder():
    root_folders = [
        folder for folder in folders_data.values() 
        if folder.parent_folder_id is None
    ]
    root_lists = [
        list_model for list_model in lists_data.values()
        if list_model.parent_folder_id is None
    ]
    
    root_folder = Folder(
        id="root",
        name="Root",
        sort_id=0,
        parent_folder_id=None,
        folder_ids=[folder.id for folder in root_folders],
        list_ids=[list_model.id for list_model in root_lists]
    )
    
    return get_folder_response(root_folder)

@app.post("/folders", response_model=FolderResponse)
def create_folder(
    name: str = Body(...), 
    sort_id: float = Body(...), 
    parent_folder_id: Optional[str] = Body(None)
):
    folder_id = str(uuid.uuid4())
    new_folder = Folder(
        id=folder_id, 
        name=name, 
        sort_id=sort_id,
        parent_folder_id=parent_folder_id,
        folder_ids=[], 
        list_ids=[]
    )
    folders_data[folder_id] = new_folder
    
    # If parent_folder_id is provided, add this folder to the parent's folder_ids
    if parent_folder_id:
        parent_folder = get_folder(parent_folder_id)
        parent_folder.folder_ids.append(folder_id)
    
    return get_folder_response(new_folder)

@app.get("/folders/{folder_id}", response_model=FolderResponse)
def get_folder_by_id(folder_id: str):
    folder = get_folder(folder_id)
    return get_folder_response(folder)

@app.put("/folders/{folder_id}", response_model=FolderResponse)
def update_folder(folder_id: str, folder: Folder):
    if folder_id not in folders_data:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    old_folder = folders_data[folder_id]
    
    # If parent_folder_id has changed, update the old and new parent folders
    if old_folder.parent_folder_id != folder.parent_folder_id:
        if old_folder.parent_folder_id:
            old_parent = get_folder(old_folder.parent_folder_id)
            old_parent.folder_ids.remove(folder_id)
        
        if folder.parent_folder_id:
            new_parent = get_folder(folder.parent_folder_id)
            new_parent.folder_ids.append(folder_id)
    
    folders_data[folder_id] = folder
    return get_folder_response(folder)

@app.delete("/folders/{folder_id}", response_model=FolderResponse)
def delete_folder(folder_id: str):
    if folder_id not in folders_data:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    deleted_folder = folders_data.pop(folder_id)
    
    # Remove from parent folder if it exists
    if deleted_folder.parent_folder_id:
        parent_folder = get_folder(deleted_folder.parent_folder_id)
        parent_folder.folder_ids.remove(folder_id)
    
    return get_folder_response(deleted_folder)

@app.post("/lists", response_model=ListModel)
def create_list(
    name: str = Body(...),
    parent_folder_id: Optional[str] = Body(None),
    sort_id: float = Body(...),
    items: List[ListItem] = Body([])
):
    list_id = str(uuid.uuid4())
    new_list = ListModel(
        id=list_id, 
        name=name,
        parent_folder_id=parent_folder_id, 
        sort_id=sort_id,
        items=items
    )
    lists_data[list_id] = new_list

    # Add the new list to the specified folder
    if parent_folder_id:
        folder = get_folder(parent_folder_id)
        folder.list_ids.append(list_id)

    return new_list

@app.get("/lists/{list_id}", response_model=ListModel)
def get_list_by_id(list_id: str):
    return get_list(list_id)

@app.put("/lists/{list_id}", response_model=ListModel)
def update_list(list_id: str, list_model: ListModel):
    if list_id not in lists_data:
        raise HTTPException(status_code=404, detail="List not found")
    
    old_list = lists_data[list_id]
    
    # If the parent_folder_id has changed, update the folder references
    if old_list.parent_folder_id != list_model.parent_folder_id:
        if old_list.parent_folder_id:
            old_folder = get_folder(old_list.parent_folder_id)
            old_folder.list_ids.remove(list_id)
        
        if list_model.parent_folder_id:
            new_folder = get_folder(list_model.parent_folder_id)
            new_folder.list_ids.append(list_id)
    
    lists_data[list_id] = list_model
    return list_model

@app.delete("/lists/{list_id}", response_model=ListModel)
def delete_list(list_id: str):
    if list_id not in lists_data:
        raise HTTPException(status_code=404, detail="List not found")
    
    deleted_list = lists_data.pop(list_id)
    
    # Remove the list from its folder
    if deleted_list.parent_folder_id:
        folder = get_folder(deleted_list.parent_folder_id)
        folder.list_ids.remove(list_id)
    
    return deleted_list