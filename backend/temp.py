import chromadb
from chromadb.config import Settings

def create_and_populate_db():
    # Initialize client with the new syntax
    client = chromadb.PersistentClient(path="./my_chroma_db")
    
    # Create collection
    collection = client.get_or_create_collection(name="knowledge_base")
    
    # Sample data
    documents = [
        "ChromaDB is a vector database for building AI applications",
        "Python 3.12 was released in October 2023",
        "FastAPI is built on Starlette and Pydantic",
        "Large Language Models (LLMs) are transforming AI",
        "Vector databases enable semantic search capabilities"
    ]
    
    metadata = [
        {"category": "database", "year": 2023},
        {"category": "programming", "year": 2023},
        {"category": "web", "year": 2018},
        {"category": "ai", "year": 2023},
        {"category": "database", "year": 2022}
    ]
    
    # Add data
    collection.add(
        ids=[f"doc_{i}" for i in range(len(documents))],
        documents=documents,
        metadatas=metadata
    )
    
    # Verify
    print(f"Added {collection.count()} documents to collection '{collection.name}'")
    
    return client

if __name__ == "__main__":
    db_client = create_and_populate_db()