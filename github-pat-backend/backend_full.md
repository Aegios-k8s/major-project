# GitHub PAT Backend - Backend Documentation

This document provides a comprehensive overview of the `github-pat-backend` project, detailing its microservices architecture, database schema, API design, and deployment instructions.

## 1. Project Overview
The backend is a system built in **Go (1.21+)** and **PostgreSQL (15+)** designed to manage GitHub repositories via PAT (Personal Access Token), scan repository files, and extract Kubernetes resources for security posture analysis.

It is structured as a collection of microservices behind an API Gateway, allowing it to easily scale and separate concerns between authentication, GitHub integration, and Kubernetes parsing.

## 2. Microservices Architecture
The application runs across several independent services, routed through an API Gateway:

*   **API Gateway (Port 8080)**: Central entry point that routes all client requests (`/auth/*` to 8081, `/github/*` to 8082, etc.) and handles CORS and request logging.
*   **Auth Service (Port 8081)**: Manages user authentication (signup, login, logout, session validation) using bcrypt password hashing and SHA-256 session tokens. Also manages Organizations. 
*   **GitHub Service (Port 8082)**: Integrates with GitHub REST API v3 to fetch repositories, traverse file trees, and store files with deduplication (`commit_sha` + `content_hash`).
*   **K8s Service (Port 8083)**: Parses extracted YAML files to validate and extract Kubernetes resources (Deployments, Services, ConfigMaps, etc.), render Helm templates, and analyze security posture.
*   **Findings Service (Port 8084)**: Manages security findings and vulnerabilities with severity levels and remediation tracking.
*   **Organization Service (Port 8085)**: Manages multi-tenant organization details and settings.

## 3. Directory Structure
The Go project follows standard idioms:
*   `cmd/`: Entry points for each of the microservices (e.g., `cmd/api-gateway/`, `cmd/auth-service/`).
*   `services/`: Microservice handlers and business logic.
*   `pkg/`: Shared packages used across services:
    *   `database/`: Database connection and table-specific CRUD operations.
    *   `middleware/`: Authentication checks, CORS, and logging.
    *   `models/`: Shared Go structs.
*   `github/` & `kubernetes/`: Domain-specific logic for external integration and internal parsing (Helms, Actions, Scores).
*   `scripts/`: Automation scripts (e.g., PowerShell scripts to run all services).

## 4. Database Schema
The system uses PostgreSQL with the following core tables:

1.  **`organization`**: Multi-tenant organizations.
2.  **`github_credentials`**: User credentials with encrypted PATs linked to organizations.
3.  **`github_repository`**: Discovered GitHub repositories.
4.  **`github_files`**: Scanned repository files. Uses a `UNIQUE(commit_sha, content_hash)` constraint for deduplication.
5.  **`kubernetes_resource`**: Extracted Kubernetes resources, storing raw data as `JSONB` for flexible query logic.
6.  **`findings`**: Security findings associated with extracted resources.
7.  **`user_sessions`**: Active user sessions tracked by SHA-256 tokens.

> **Key Design Decision:** Primary keys use standard serials, but external APIs strictly use randomized **6-digit Business IDs** (e.g., `org_id`, `repo_id`, `resource_id`) to prevent sequential ID enumeration attacks.

## 5. API Flow and Endpoints
### Authentication
The flow starts by signing up and logging in:
*   `POST /auth/signup`: Accepts `organization_name`, `github_username`, `pat`, and `password`. Validates the PAT against GitHub instantly.
*   `POST /auth/login`: Verifies credentials and generates a session token. Crucially, **on the very first login**, it asynchronously kicks off a background sync to fetch all GitHub repositories, scan their file trees, and extract K8s resources, allowing the login to respond instantly.

### GitHub & Kubernetes Logic
*   `POST /github/scan-files`: Manually fetches all repository files for the authenticated org.
*   `POST /k8s/get-resources`: Returns all parsed K8s resources across the discovered repositories. 
*   `POST /k8s/posture` & `/k8s/actions`: Fetches detailed K8s posture results and automated remediation actions, powered by the backend's YAML and Helm parsing implementations.

## 6. Security & Performance
*   **Security**: Authentication tokens expire after 24 hours. SQL injection is prevented via parameterized queries. Data is strictly isolated by `org_id`.
*   **Performance**: Background processing handles the heavy lifting of fetching GitHub files and parsing YAML. `JSONB` indexes provide rapid querying capability over arbitrary Kubernetes configurations.

## 7. Deployment
To run the server locally, developers must have Go installed and a PostgreSQL instance running on port 5433.
*   Set environment variables like `DB_USER` and `DB_PASSWORD`.
*   Compile services via `make build-all`.
*   Run the monolith `main.go` directly, or start all microservices using the provided PowerShell script: `.\scripts\run-all-services.ps1`.
