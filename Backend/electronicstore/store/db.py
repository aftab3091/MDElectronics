import pymongo
import sys

# MongoDB Connection URI (with TLS/SSL options)
MONGO_URI = "mongodb+srv://aftabali6896_db_user:Aftab%403091@cluster0.3b1fwvx.mongodb.net/?tls=true"

db = None

try:
    # Set a 5-second server selection timeout to avoid blocking startup if network is slow
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client["mdelectronics_db"]
    # Verify the connection works
    client.admin.command('ping')
    print("Successfully connected to MongoDB Atlas!")
except Exception as e:
    print(f"WARNING: MongoDB Atlas connection failed: {e}", file=sys.stderr)
    print("Falling back to SQLite database.", file=sys.stderr)
    db = None
