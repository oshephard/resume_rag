# Resume RAG Assistant

An AI-powered resume assistant that helps you manage your resume, answer questions about your experience, generate new resume content, and get personalized suggestions based on job postings.

## Features

- **Document Management**

  - Upload resumes, CVs, PDFs, and other documents
  - Support for `.txt`, `.md`, and `.pdf` files
  - Automatic text extraction and ATS-friendly formatting for resumes
  - Document types: `resume` and `other` with tag support

- **Experience Tracking**

  - Use `/new-experience` command to add work experiences, projects, certifications, and more
  - Store experiences with metadata (date, company, position, skills, technologies, etc.)
  - All experiences are searchable and can be referenced when generating resumes

- **Job Posting Integration**

  - Use `/job-posting` command to save job postings with optional links
  - Job postings are tagged and stored for easy reference
  - Get resume suggestions tailored to specific job postings

- **AI-Powered Resume Assistance**

  - Ask questions about your resume and experience
  - Generate new resume content based on your stored experiences
  - Get personalized suggestions for improving your resume
  - Compare your resume against job postings and get tailored recommendations

- **Context Management**

  - Select multiple documents as context for queries
  - Mention documents using `@` symbol in chat
  - View and manage all your documents

- **RAG (Retrieval-Augmented Generation)**
  - Automatic text chunking and embedding generation
  - PostgreSQL database storage with pgvector extension
  - Semantic search using cosine similarity
  - AI-powered Q&A using OpenAI GPT models

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
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

After installing pgvector, the extension will be automatically enabled when you run database migrations.

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
   The database tables will be created automatically on first use, or you can run migrations:

```bash
yarn db:push
```

**Note:** Make sure you've installed the pgvector extension in PostgreSQL (see Prerequisites above) before running this command.

4. Run the development server:

```bash
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Uploading Documents

- **Resumes/CVs**: Upload PDF or text files. Resumes are automatically formatted to be ATS-friendly.
- **Other Documents**: Upload certificates, LinkedIn posts, or any other relevant documents with custom tags.

### Chat Commands

- **`/new-experience`**: Add a new experience to your history. The AI will prompt you for details like:
  - Date and description (required)
  - Title, company, position, location
  - Skills, tools, technologies
  - Projects, education, certifications, awards, publications
- **`/job-posting`**: Save a job posting. Paste the job posting text and optionally include a link. The posting will be saved with the "job" tag for easy reference.

### Using the Chat Interface

- **Ask Questions**: Ask questions about your resume, experiences, or documents
- **Get Resume Suggestions**: Ask for help improving your resume or incorporating experiences
- **Mention Documents**: Type `@` followed by a document name to add it as context
- **Add Context**: Use the "Add Context" button to select multiple documents to include in your query

### Example Queries

- "What experiences do I have with React?"
- "How can I improve my resume for a software engineering role?"
- "Generate a resume section for my work at [Company]"
- "What skills should I highlight for this job posting?" (after saving a job posting)

## Architecture

- **Database Schema**: Generic `documents` and `embeddings` tables supporting document types and tags
- **Embeddings**: Uses OpenAI's `text-embedding-3-small` model (1536 dimensions)
- **RAG**: Retrieves top 10 most similar chunks using cosine similarity for context
- **LLM**: Uses GPT-4o-mini for generating answers and suggestions with context
- **Tools**: AI tools for adding experiences, saving job postings, getting information, and providing resume suggestions

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with pgvector extension
- **AI**: OpenAI GPT-4o-mini and text-embedding-3-small
- **ORM**: Drizzle ORM

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn db:generate` - Generate database migrations
- `yarn db:migrate` - Run database migrations
- `yarn db:push` - Push schema changes to database
- `yarn db:studio` - Open Drizzle Studio
