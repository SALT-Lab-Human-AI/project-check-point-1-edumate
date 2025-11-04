# setup_chroma.py
import json
import uuid
from tqdm import tqdm
from chromadb import Client
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

DATASET_PATH = "data/test.jsonl"
CHROMA_DIR = "./chroma_db"
COLLECTION_NAME = "k12_content"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"

# Load dataset
with open(DATASET_PATH, "r", encoding="utf-8") as f:
    data = [json.loads(line) for line in f]

print(f"Total QA pairs found: {len(data)}")

# Initialize Chroma
chroma = Client(Settings())

# Create collection
collection = chroma.create_collection(name=COLLECTION_NAME)
embed_model = SentenceTransformer(EMBED_MODEL_NAME)

for entry in tqdm(data, desc="Adding QA pairs to ChromaDB"):
    text = entry["question"] + " " + entry["answer"]
    embedding = embed_model.encode(text).tolist()
    collection.add(
        ids=[str(uuid.uuid4())],
        documents=[text],
        embeddings=[embedding],
        metadatas=[{"question": entry["question"]}]
    )

print(f"Collection '{COLLECTION_NAME}' created and populated!")