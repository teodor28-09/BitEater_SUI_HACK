import nacl.signing

# Generate a new random private key
private_key = nacl.signing.SigningKey.generate()
public_key = private_key.verify_key

# Get the Hex strings
priv_hex = private_key.encode().hex()
pub_hex = public_key.encode().hex()

print("--- COPY THESE ---")
print(f"PRIVATE KEY (For your .env file): {priv_hex}")
print(f"PUBLIC KEY  (For your Move file): {pub_hex}")