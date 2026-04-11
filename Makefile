SHELL := /bin/sh

BACKEND_DIR := backend
FRONTEND_DIR := frontend

.PHONY: help install install-backend install-frontend run run-backend run-frontend test test-backend test-frontend

help:
	@echo "Available targets:"
	@echo "  make install          Install backend and frontend dependencies"
	@echo "  make install-backend  Install backend dependencies"
	@echo "  make install-frontend Install frontend dependencies"
	@echo "  make run              Run backend and frontend together"
	@echo "  make run-backend      Run the FastAPI backend"
	@echo "  make run-frontend     Run the Vite frontend"
	@echo "  make test             Run backend and frontend tests"
	@echo "  make test-backend     Run backend pytest suite"
	@echo "  make test-frontend    Run frontend Vitest suite"

install: install-backend install-frontend

install-backend:
	cd $(BACKEND_DIR) && uv sync --group dev

install-frontend:
	cd $(FRONTEND_DIR) && npm install

run:
	@set -e; \
	trap 'kill 0' INT TERM EXIT; \
	$(MAKE) run-backend & \
	$(MAKE) run-frontend & \
	wait

run-backend:
	cd $(BACKEND_DIR) && uv run uvicorn main:app --reload

run-frontend:
	cd $(FRONTEND_DIR) && npm run dev

test: test-backend test-frontend

test-backend:
	cd $(BACKEND_DIR) && uv run --group dev pytest -q

test-frontend:
	cd $(FRONTEND_DIR) && npm test
