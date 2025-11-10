# Document RAG System

An AI-powered document retrieval system that allows you to upload documents, generate embeddings, and ask questions using RAG (Retrieval-Augmented Generation).

## Features

- Upload documents (`.txt`, `.md`, and `.pdf` files)
- Automatic text chunking and embedding generation
- PostgreSQL database storage with pgvector extension
- Semantic search using cosine similarity
- AI-powered Q&A using OpenAI GPT models

## Prerequisites

- Node.js 18+ (Node 20+ recommended for PDF support in future)
- PostgreSQL database with the [pgvector extension](https://github.com/pgvector/pgvector) installed
- OpenAI API key

### Installing pgvector

The pgvector extension must be installed in your PostgreSQL database before running the application.

**Option 1: Using Docker (Recommended for Docker users)**

A `docker-compose.yml` file is included that uses the `pgvector/pgvector` image which has pgvector pre-installed:

```bash
docker-compose up -d
```

This will start PostgreSQL with pgvector on port 5432. Update your `.env.local`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resume_rag
```

**If you already have a PostgreSQL container running:**

You can either:

- Switch to the `pgvector/pgvector` image (recommended)
- Or install pgvector in your existing container by creating a custom Dockerfile that extends your PostgreSQL image

To switch to the pgvector image, stop your current container and use the provided `docker-compose.yml`, or update your existing docker-compose to use `pgvector/pgvector:pg17` (or your PostgreSQL version) instead of the standard `postgres` image.

**Option 2: macOS (using Homebrew)**

```bash
brew install pgvector
brew services restart postgresql@17  # or your PostgreSQL version
```

**Option 3: From source**

```bash
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
make install
```

After installing pgvector, the extension will be automatically enabled when you run `yarn init-db`.

Alternatively, you can manually enable it by connecting to your PostgreSQL database and running:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

For more installation options, see the [pgvector installation guide](https://github.com/pgvector/pgvector#installation).

## Setup

1. Install dependencies:

```bash
yarn install
```

2. Set up environment variables:
   Create a `.env.local` file in the root directory:

```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
OPENAI_API_KEY=your_openai_api_key_here
```

3. Initialize the database:
   The database tables will be created automatically on first use, or you can run:

```bash
yarn init-db
```

**Note:** Make sure you've installed the pgvector extension in PostgreSQL (see Prerequisites above) before running this command.

4. Run the development server:

```bash
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload a document**: Use the upload form to select and upload a file (`.txt`, `.md`, or `.pdf`).
2. **Ask questions**: Use the chat interface to ask questions about your uploaded documents.

## Architecture

- **Database Schema**: Generic `documents` and `embeddings` tables for extensibility
- **Embeddings**: Uses OpenAI's `text-embedding-3-small` model (1536 dimensions)
- **RAG**: Retrieves top 5 most similar chunks using cosine similarity
- **LLM**: Uses GPT-4o-mini for generating answers with context

## Future Enhancements

- Multiple document management
- Document deletion and updates
- User authentication
- Conversation history
