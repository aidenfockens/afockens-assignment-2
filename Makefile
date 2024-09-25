# Makefile for Flask project

# Variables
APP_NAME=app.py
PYTHON=python3
VENV=venv
PORT=3000

# Install dependencies from requirements.txt
.PHONY: install
install: venv
	@echo "Installing dependencies..."
	$(VENV)/bin/pip install -r requirements.txt

# Create virtual environment
.PHONY: venv
venv:
	@echo "Creating virtual environment..."
	$(PYTHON) -m venv $(VENV)

# Run the Flask app on port 3000
.PHONY: run
run: venv install
	@echo "Starting Flask app on http://localhost:$(PORT)..."
	. $(VENV)/bin/activate && \
		export FLASK_APP=$(APP_NAME) && \
		export FLASK_ENV=development && \
		flask run --port=$(PORT)

# Clean up virtual environment and dependencies
.PHONY: clean
clean:
	@echo "Removing virtual environment..."
	rm -rf $(VENV)

# Help target for usage information
.PHONY: help
help:
	@echo "Usage:"
	@echo "  make install  - Install dependencies"
	@echo "  make run      - Run the Flask app on http://localhost:$(PORT)"
	@echo "  make venv     - Create a virtual environment"
	@echo "  make clean    - Clean up virtual environment"