# MyATSScore Monorepo

This is the monorepo for the `myatsscore.app` SaaS application.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python 3.11, Pydantic v2, async)
- **Database**: PostgreSQL (with persistent volume)
- **Cache**: Redis
- **AI Models**: Ollama (llama3.1:8b)

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.
- [Node.js](https://nodejs.org/) & npm (optional, for local frontend development outside Docker).
- [Python 3.11+](https://www.python.org/) (optional, for local backend development outside Docker).

## Setup & Running Locally

1. **Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. **Start the Application**:
   Run the following command to build and start all services via Docker Compose:
   ```bash
   docker-compose up --build
   ```

   This will start:
   - **Frontend**: http://localhost:3000 (with hot reload)
   - **Backend**: http://localhost:8000 (with hot reload)
   - **Postgres**: localhost:5432
   - **Redis**: localhost:6379
   - **Ollama**: localhost:11434

   *Note: On the first startup, the Ollama container will pull the `llama3.1:8b` model, which might take a few minutes depending on your internet connection.*

3. **Verify API Docs**:
   Navigate to http://localhost:8000/docs to see the FastAPI Swagger UI.

## Adding shadcn/ui Components
To add new components, navigate to the `frontend` directory and use the `shadcn-ui` CLI:
```bash
cd frontend
npx shadcn-ui@latest add button
```
