#!/bin/bash

# This script tests the payment upload endpoint
echo "Testing payment upload functionality..."

# Create a test file
echo "Creating test receipt file..."
echo "Test Receipt Content" > test-receipt.pdf

# Use curl to upload the file
echo "Uploading test file to payment endpoint..."
curl -v -X POST \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "dueId=60f1a5b9e6b3f32b4c9a1234" \
  -F "pharmacyId=60f1a5b9e6b3f32b4c9a5678" \
  -F "amount=1000" \
  -F "paymentMethod=bank_transfer" \
  -F "receipt=@test-receipt.pdf" \
  http://localhost:5000/api/payments/submit

echo "Test completed."
