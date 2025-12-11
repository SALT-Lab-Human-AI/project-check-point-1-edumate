# Data Access Instructions

This document provides detailed instructions for accessing and using the EduMate dataset.

## Dataset Location

**Primary Dataset:** `application/data/test.jsonl`  
**Alternative Dataset:** `application/data/test_without_grade1.jsonl`

## Dataset Format

The dataset is in JSONL format (one JSON object per line). Each entry contains:

```json
{
  "question": "What is 2 + 2?",
  "answer": "2 + 2 = 4. This is basic addition.",
  "grade": 1
}
```

### Fields

- **`question`** (string, required): The mathematical question or problem
- **`answer`** (string, required): The answer with explanation
- **`grade`** (integer, optional): Grade level (1-12)

## Access Methods

### Method 1: Direct File Access

```bash
# View first 5 entries
head -5 application/data/test.jsonl

# Count total entries
wc -l application/data/test.jsonl

# View specific entry (line 10)
sed -n '10p' application/data/test.jsonl | python3 -m json.tool
```

### Method 2: Python Script

```python
import json

# Load dataset
with open('application/data/test.jsonl', 'r', encoding='utf-8') as f:
    data = [json.loads(line) for line in f if line.strip()]

print(f"Total entries: {len(data)}")
print(f"First entry: {data[0]}")
```

### Method 3: Using Data Preparation Script

```bash
# Use the provided data preparation script
python3 application/backend/prepare_data.py \
    --infile application/data/test.jsonl \
    --outdir application/data/hf_dataset
```

## Dataset Statistics

To get dataset statistics:

```python
import json
from collections import Counter

# Load dataset
with open('application/data/test.jsonl', 'r', encoding='utf-8') as f:
    data = [json.loads(line) for line in f if line.strip()]

# Count by grade
grades = [entry.get('grade') for entry in data if 'grade' in entry]
grade_counts = Counter(grades)

print(f"Total entries: {len(data)}")
print(f"Entries with grade: {len(grades)}")
print(f"Grade distribution: {dict(grade_counts)}")
```

## Database Access

The dataset is loaded into PostgreSQL with pgvector for RAG retrieval.

### Database Schema

```sql
CREATE TABLE k12_content (
    id VARCHAR(255) PRIMARY KEY,
    document TEXT NOT NULL,
    question TEXT,
    embedding vector(384)
);
```

### Querying the Database

```python
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv('application/.env')
DATABASE_URL = os.getenv('DATABASE_URL')

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# Count entries
cursor.execute("SELECT COUNT(*) FROM k12_content;")
count = cursor.fetchone()[0]
print(f"Entries in database: {count}")

# Get sample entry
cursor.execute("SELECT question, document FROM k12_content LIMIT 1;")
result = cursor.fetchone()
print(f"Sample: {result}")

cursor.close()
conn.close()
```

### Vector Search

```python
from backend.rag_groq_bot import get_embed_model
from backend.database import get_db_connection

# Generate query embedding
query = "How do I solve linear equations?"
embed_model = get_embed_model()
query_embed = embed_model.encode(query).tolist()
query_embed_str = '[' + ','.join(map(str, query_embed)) + ']'

# Search for similar documents
conn = get_db_connection()
cursor = conn.cursor()

cursor.execute(
    """
    SELECT question, document, 
           1 - (embedding <=> %s::vector) as similarity
    FROM k12_content
    ORDER BY embedding <=> %s::vector
    LIMIT 3;
    """,
    (query_embed_str, query_embed_str)
)

results = cursor.fetchall()
for question, document, similarity in results:
    print(f"Similarity: {similarity:.3f}")
    print(f"Question: {question}")
    print(f"Document: {document[:100]}...")
    print()

cursor.close()
conn.close()
```

## Data Population

To populate the database from the JSONL file:

```bash
# Use the data setup script
bash artifacts/scripts/reproduce_data_setup.sh
```

Or manually:

```python
import json
import uuid
from backend.database import get_db_connection
from backend.rag_groq_bot import get_embed_model

# Load dataset
with open('application/data/test.jsonl', 'r', encoding='utf-8') as f:
    data = [json.loads(line) for line in f if line.strip()]

# Generate embeddings
embed_model = get_embed_model()
conn = get_db_connection()
cursor = conn.cursor()

for entry in data:
    question = entry.get('question', '')
    answer = entry.get('answer', '')
    document = f"{question} {answer}".strip()
    
    embedding = embed_model.encode(document).tolist()
    embedding_str = '[' + ','.join(map(str, embedding)) + ']'
    
    doc_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO k12_content (id, document, question, embedding) VALUES (%s, %s, %s, %s::vector)",
        (doc_id, document, question, embedding_str)
    )

conn.commit()
cursor.close()
conn.close()
```

## Data Privacy and Usage

- The dataset contains K-12 mathematics questions and answers
- Data is used for RAG retrieval in the tutoring system
- No personal information is stored in the dataset
- Data is publicly available in the repository

## Troubleshooting

### Issue: File not found

**Solution:** Ensure you're in the correct directory:
```bash
cd /path/to/project-check-point-1-edumate
ls application/data/test.jsonl
```

### Issue: Database connection failed

**Solution:** Check your `.env` file:
```bash
cat application/.env | grep DATABASE_URL
```

### Issue: Empty vector database

**Solution:** Run the data population script:
```bash
bash artifacts/scripts/reproduce_data_setup.sh
```

## Additional Resources

- **Data Preparation Script:** `application/backend/prepare_data.py`
- **Database Setup:** `application/backend/database.py`
- **RAG Implementation:** `application/backend/rag_groq_bot.py`
- **Full Documentation:** `application/docs/FINAL_REPORT.md`

