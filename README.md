# PKM Vault - Personal Knowledge Management System

A self-hosted, AI-powered personal knowledge vault that serves as your "second brain". Store, connect, search, and generate insights from all your personal knowledge - notes, bookmarks, PDFs, articles, and more.

## Features

- **Multi-format Ingestion**: Import Markdown, PDF, EPUB, images (OCR), bookmarks, and more
- **Semantic Search**: Hybrid keyword + vector search powered by AI embeddings
- **Knowledge Graph**: Automatic bidirectional linking based on content similarity
- **AI Insights**: Daily digests, recommendations, and knowledge gap analysis
- **Rich Editor**: TipTap-based editor with Markdown, backlinks, and block references
- **Graph Visualization**: Interactive knowledge graph with React Flow
- **Self-Hosted**: Your data stays on your machine

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite
- **Embeddings**: HuggingFace Inference API (free tier)
- **Auth**: JWT-based session management
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Running with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/pkm-vault.git
cd pkm-vault

# Copy environment files
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local

# Start the application
docker-compose up -d

# Access the app at http://localhost:3000
```

### Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Project Structure

```
pkm-vault/
├── frontend/          # Next.js frontend application
├── backend/           # FastAPI backend application
├── nginx/             # Nginx reverse proxy configuration
├── scripts/           # Utility scripts
├── docker-compose.yml # Production Docker configuration
└── docker-compose.dev.yml # Development Docker configuration
```

## Environment Variables

See `.env.example` for all available configuration options.

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## License

MIT License - see LICENSE file for details.
