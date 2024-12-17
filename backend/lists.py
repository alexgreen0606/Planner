from fastapi import HTTPException, Body, APIRouter
from pydantic import BaseModel
import uuid
from typing import List, Dict, Optional, Literal
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

# Models
class ItemModel(BaseModel):
    id: str
    sortId: float
    value: str

class ListModel(BaseModel):
    id: str
    value: str
    parentFolderId: Optional[str] = None
    sortId: float
    items: List[ItemModel]

class FolderModel(BaseModel):
    id: str
    value: str
    sortId: float
    parentFolderId: Optional[str] = None
    folder_ids: List[str]
    list_ids: List[str]

# Special payload to represent a child of a folder
class FolderItem(BaseModel):
    id: str
    value: str
    sortId: float
    type: Literal["FOLDER", "LIST"]
    childrenCount: int

# Special payload to represent a collection of folders and lists
class FolderPayload(BaseModel):
    id: str
    value: str
    sortId: float
    parentFolderId: Optional[str] = None
    items: List[FolderItem]

# Data storage
folders_data: Dict[str, FolderModel] = {}
lists_data: Dict[str, ListModel] = {}

folders_data["root"] = FolderModel(
    id="root",
    value="Lists",
    sortId=0,
    parentFolderId=None,
    folder_ids=[],
    list_ids=[]
)


# Helper functions
def get_folder_by_id(folder_id: str) -> FolderModel:
    if folder_id not in folders_data:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    return folders_data[folder_id]


def get_list_by_id(list_id: str) -> ListModel:
    if list_id not in lists_data:
        raise HTTPException(status_code=404, detail="List not found")
    list = lists_data[list_id]
    list.items.sort(key=lambda x: x.sortId)
    return list


def folder_to_payload(folder: FolderModel) -> FolderPayload:
    items = []
    
    for fid in folder.folder_ids:
        child_folder = folders_data[fid]
        items.append(FolderItem(
            id=fid,
            value=child_folder.value,
            sortId=child_folder.sortId,
            type="FOLDER",
            childrenCount=len(child_folder.folder_ids) + len(child_folder.list_ids)
        ))
    
    for lid in folder.list_ids:
        child_list = lists_data[lid]
        items.append(FolderItem(
            id=lid,
            value=child_list.value,
            sortId=child_list.sortId,
            type="LIST",
            childrenCount=len(child_list.items)
        ))
    
    # Sort items by sortId
    items.sort(key=lambda x: x.sortId)
    
    return FolderPayload(
        id=folder.id,
        value=folder.value,
        sortId=folder.sortId,
        parentFolderId=folder.parentFolderId,
        items=items
    )
    

# Create a folder
@router.post("/folders", response_model=FolderItem)
def create_folder(
    value: str = Body(...), 
    sortId: float = Body(...), 
    parentFolderId: Optional[str] = Body(None)
):
    folder_id = str(uuid.uuid4())
    new_folder = FolderModel(
        id=folder_id, 
        value=value, 
        sortId=sortId,
        parentFolderId=parentFolderId,
        folder_ids=[], 
        list_ids=[]
    )
    folders_data[folder_id] = new_folder
    
    # If parentFolderId is provided, add this folder to the parent's folder_ids
    if parentFolderId:
        parent_folder = get_folder_by_id(parentFolderId)
        parent_folder.folder_ids.append(folder_id)
    
    return FolderItem(
            id=folder_id,
            value=value,
            sortId=sortId,
            type="FOLDER",
            childrenCount=0
        )

# Get a folder
@router.get("/folders/{folder_id}", response_model=FolderPayload)
def get_folder(folder_id: str):
    folder = get_folder_by_id(folder_id)
    return folder_to_payload(folder)

# Update a folder
@router.put("/folders/{folder_id}", response_model=FolderItem)
def update_folder(folder_id: str, folder: FolderPayload):
    logger.info(folder)
    if folder_id not in folders_data:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    old_folder = folders_data[folder.id]
    
    if old_folder.parentFolderId != folder.parentFolderId:
        old_parent = get_folder_by_id(old_folder.parentFolderId)
        old_parent.folder_ids.remove(old_folder.id)
        new_parent = get_folder_by_id(folder.parentFolderId)
        new_parent.folder_ids.append(folder.id)
    
    old_folder.sortId = folder.sortId
    old_folder.value = folder.value
    old_folder.parentFolderId = folder.parentFolderId
    return FolderItem(
            id=folder.id,
            value=folder.value,
            sortId=folder.sortId,
            type="FOLDER",
            childrenCount=len(old_folder.folder_ids) + len(old_folder.list_ids)
        )


# Delete a folder
@router.delete("/folders/{folder_id}/force", response_model=FolderItem)
def force_delete_folder(folder_id: str):
    if folder_id not in folders_data:
        raise HTTPException(status_code=404, detail="Folder not found")

    def delete_folder_recursively(folder_id: str):
        folder = folders_data.pop(folder_id)

        # Delete all child folders recursively
        for child_folder_id in folder.folder_ids:
            delete_folder_recursively(child_folder_id)

        # Delete all child lists
        for list_id in folder.list_ids:
            lists_data.pop(list_id, None)

        # Remove from parent folder if exists
        if folder.parentFolderId:
            parent_folder = folders_data.get(folder.parentFolderId)
            if parent_folder:
                parent_folder.folder_ids.remove(folder_id)

        return folder

    deleted_folder = delete_folder_recursively(folder_id)
    return FolderItem(
            id=deleted_folder.id,
            value=deleted_folder.value,
            sortId=deleted_folder.sortId,
            type="FOLDER",
            childrenCount=len(deleted_folder.folder_ids) + len(deleted_folder.list_ids)
        )


# Create a list
@router.post("/lists", response_model=FolderItem)
def create_list(
    value: str = Body(...),
    parentFolderId: Optional[str] = Body(None),
    sortId: float = Body(...),
):
    list_id = str(uuid.uuid4())
    new_list = ListModel(
        id=list_id, 
        value=value,
        parentFolderId=parentFolderId, 
        sortId=sortId,
        items=[]
    )
    lists_data[list_id] = new_list

    # Add the new list to the specified folder
    if parentFolderId:
        folder = get_folder_by_id(parentFolderId)
        folder.list_ids.append(list_id)
    
    return FolderItem(
            id=new_list.id,
            value=new_list.value,
            sortId=new_list.sortId,
            type="LIST",
            childrenCount=len(new_list.items)
        )


# Get a list
@router.get("/lists/{list_id}", response_model=ListModel)
def get_list(list_id: str):
    return get_list_by_id(list_id)


# Update a list
@router.put("/lists", response_model=FolderItem)
def update_list(list_model: ListModel):
    if list_model.id not in lists_data:
        raise HTTPException(status_code=404, detail="List not found")
    
    old_list = lists_data[list_model.id]
    
    if old_list.parentFolderId != list_model.parentFolderId:
        old_parent = get_folder_by_id(old_list.parentFolderId)
        old_parent.list_ids.remove(old_list.id)
        new_parent = get_folder_by_id(list_model.parentFolderId)
        new_parent.list_ids.append(list_model.id)
    
    old_list.sortId = list_model.sortId
    old_list.value = list_model.value
    old_list.parentFolderId = list_model.parentFolderId
    
    lists_data[list_model.id] = list_model
    return FolderItem(
            id=list_model.id,
            value=list_model.value,
            sortId=list_model.sortId,
            type="LIST",
            childrenCount=len(list_model.items)
        )


# Delete a list
@router.delete("/lists/{list_id}/force", response_model=FolderItem)
def force_delete_list(list_id: str):
    if list_id not in lists_data:
        raise HTTPException(status_code=404, detail="List not found")

    deleted_list = lists_data.pop(list_id)
    
    # Remove from parent folder if exists
    if deleted_list.parentFolderId:
        parent_folder = folders_data.get(deleted_list.parentFolderId)
        if parent_folder:
            parent_folder.list_ids.remove(list_id)
            
    return FolderItem(
            id=deleted_list.id,
            value=deleted_list.value,
            sortId=deleted_list.sortId,
            type="LIST",
            childrenCount=len(deleted_list.items)
        )


# Create a list item
@router.post("/lists/{list_id}/items", response_model=ItemModel)
def create_item(list_id: str, item: ItemModel):

    unique_id = str(uuid.uuid4())
    
    new_item = ItemModel(
        id=unique_id,
        sortId=item.sortId,
        value=item.value
    )
    lists_data[list_id].items.append(new_item)

    return new_item


# Update a list item
@router.put("/lists/{list_id}/items", response_model=ItemModel)
def update_item(list_id: str, item: ItemModel):
    logger.info(item)

    if list_id not in lists_data:
        raise HTTPException(status_code=404, detail="No list found for the specified id")

    items = lists_data[list_id].items
    for i, existing_item in enumerate(items):
        if existing_item.id == item.id:
            existing_item.value = item.value
            existing_item.sortId = item.sortId
            return existing_item

    raise HTTPException(status_code=404, detail="List item with the specified ID not found")


# Delete a list item
@router.delete("/lists/{list_id}/items/{item_id}", response_model=ItemModel)
def delete_item(list_id: str, item_id: str):

    if list_id not in lists_data:
        raise HTTPException(status_code=404, detail="No list found for the specified id")

    list = lists_data[list_id]
    for i, existing_item in enumerate(list):
        if existing_item.id == item_id:
            deleted_item = list.pop(i)
            return deleted_item

    raise HTTPException(status_code=404, detail="No item found for the specified id")