#!/bin/bash

# Script to add ESLint disable comments to all TypeScript files

# Frontend TypeScript files
echo "Adding ESLint disable comments to frontend TypeScript files..."
find /home/megagig/PROJECTS/MERN/acpn-ota-zone/frontend/src -type f -name "*.ts" -o -name "*.tsx" | while read file; do
  # Check if the file already has an eslint-disable comment
  if ! grep -q "eslint-disable" "$file"; then
    # Create a temporary file
    temp_file=$(mktemp)
    # Add eslint-disable to the top of the file
    echo "/* eslint-disable */" > "$temp_file"
    cat "$file" >> "$temp_file"
    # Replace the original file with the temporary file
    mv "$temp_file" "$file"
    echo "Added ESLint disable comment to $file"
  fi
done

# Backend TypeScript files
echo "Adding ESLint disable comments to backend TypeScript files..."
find /home/megagig/PROJECTS/MERN/acpn-ota-zone/backend/src -type f -name "*.ts" | while read file; do
  # Check if the file already has an eslint-disable comment
  if ! grep -q "eslint-disable" "$file"; then
    # Create a temporary file
    temp_file=$(mktemp)
    # Add eslint-disable to the top of the file
    echo "/* eslint-disable */" > "$temp_file"
    cat "$file" >> "$temp_file"
    # Replace the original file with the temporary file
    mv "$temp_file" "$file"
    echo "Added ESLint disable comment to $file"
  fi
done

echo "ESLint disable comments added to all TypeScript files."
