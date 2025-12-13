import nacl.signing

# Generate a new random private key
private_key = nacl.signing.SigningKey.generate()
public_key = private_key.verify_key

# Get the Hex strings
priv_hex = private_key.encode().hex()
pub_hex = public_key.encode().hex()

print(f"PRIVATE KEY (.env file): {priv_hex}")
print(f"PUBLIC KEY  (Move file): {pub_hex}")