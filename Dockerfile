# ==========================================
# TARGET 1: Python Backend Application
# ==========================================
FROM python:3.11-slim AS backend
WORKDIR /app
COPY apps/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/backend/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# ==========================================
# TARGET 2: React Frontend Application
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY apps/frontend/package*.json ./
RUN npm install && npm install @rolldown/binding-linux-x64-musl
COPY apps/frontend/ .
RUN npm run build

FROM nginx:alpine AS frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]