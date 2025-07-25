from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'document_disk_production')]

# Security
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Document Disk API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    username: str
    password: str
    pin: str
    
    @validator('pin')
    def validate_pin(cls, v):
        if not re.match(r'^\d{4}$', v):
            raise ValueError('Pin must be exactly 4 digits')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        return v.lower().strip()

class UserLogin(BaseModel):
    username: str
    password: str
    pin: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    hashed_password: str
    hashed_pin: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentCreate(BaseModel):
    title: str
    content: str
    
class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    username: str
    created_at: datetime

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)

# Authentication routes
@api_router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_data.username.lower().strip()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    hashed_pin = get_password_hash(user_data.pin)
    
    user = User(
        username=user_data.username.lower().strip(),
        hashed_password=hashed_password,
        hashed_pin=hashed_pin
    )
    
    await db.users.insert_one(user.dict())
    
    return UserResponse(
        id=user.id,
        username=user.username,
        created_at=user.created_at
    )

@api_router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username.lower().strip()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.pin, user["hashed_pin"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

# Document routes
@api_router.post("/documents", response_model=Document)
async def create_document(doc_data: DocumentCreate, current_user: User = Depends(get_current_user)):
    document = Document(
        title=doc_data.title,
        content=doc_data.content,
        user_id=current_user.id
    )
    
    await db.documents.insert_one(document.dict())
    return document

@api_router.get("/documents", response_model=List[Document])
async def get_documents(current_user: User = Depends(get_current_user)):
    documents = await db.documents.find({"user_id": current_user.id}).to_list(1000)
    return [Document(**doc) for doc in documents]

@api_router.get("/documents/{document_id}", response_model=Document)
async def get_document(document_id: str, current_user: User = Depends(get_current_user)):
    document = await db.documents.find_one({"id": document_id, "user_id": current_user.id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return Document(**document)

@api_router.put("/documents/{document_id}", response_model=Document)
async def update_document(document_id: str, doc_data: DocumentUpdate, current_user: User = Depends(get_current_user)):
    document = await db.documents.find_one({"id": document_id, "user_id": current_user.id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = {}
    if doc_data.title is not None:
        update_data["title"] = doc_data.title
    if doc_data.content is not None:
        update_data["content"] = doc_data.content
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.documents.update_one(
            {"id": document_id, "user_id": current_user.id},
            {"$set": update_data}
        )
        
        updated_document = await db.documents.find_one({"id": document_id, "user_id": current_user.id})
        return Document(**updated_document)
    
    return Document(**document)

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: User = Depends(get_current_user)):
    result = await db.documents.delete_one({"id": document_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}

@api_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        created_at=current_user.created_at
    )

# Health check
@api_router.get("/")
async def root():
    return {"message": "Document Disk API is running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)