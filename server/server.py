import os
import struct
from dotenv import load_dotenv
from fastapi import FastAPI
import nacl.signing
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Load the .env file
load_dotenv()

# 2. Read the string from the environment
private_key_hex = os.getenv("ADMIN_SECRET_KEY")

# 3. Convert Hex string back to Key Object
admin_private_key = nacl.signing.SigningKey(bytes.fromhex(private_key_hex))


class ClaimRequest(BaseModel):
    userAddress: str
    points: int

@app.post("/claim")
async def sign_claim(req: ClaimRequest):
    print(f"Received claim request from: {req.userAddress} for {req.points} points")

    clean_address = req.userAddress.lower().replace("0x", "")
    addr_bytes = bytes.fromhex(clean_address)
    
    # Pack points as u64 Little Endian
    points_bytes = struct.pack('<Q', req.points * 20_000_00) # 0.1 pt 50 puncte
    # 50 pct ..... 0.1 sui
    # 1 pct ..... x 
    message = addr_bytes + points_bytes
    signed_message = admin_private_key.sign(message)

    return {
        "status": "success",
        "signature": signed_message.signature.hex()
    }

# uvicorn server:app --reload --port 5000