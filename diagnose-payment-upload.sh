#!/bin/bash
# Test utility for diagnosing payment upload issues in ACPN Ota Zone
# This script checks if the backend payment endpoint is correctly configured and can handle file uploads

echo "==== ACPN Ota Zone Payment Upload Diagnostic Tool ===="
echo "This tool will help diagnose upload issues with your payment system."

# Configuration - update these as needed
API_BASE_URL="http://localhost:5000"  # Update to match your actual API base URL
TOKEN=""  # Will be populated after login
TEST_FILE="./test-receipt.jpg"

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not found. Please install curl and try again."
    exit 1
fi

# Create a test file if it doesn't exist
if [ ! -f "$TEST_FILE" ]; then
    echo "Creating test receipt file..."
    # Generate a simple JPG file with a text label
    if command -v convert &> /dev/null; then
        convert -size 800x600 canvas:white -font Arial -pointsize 72 -draw "text 100,300 'TEST RECEIPT'" "$TEST_FILE"
    else
        echo "Warning: ImageMagick not found, cannot create test image."
        echo "Please place a test image named 'test-receipt.jpg' in the current directory."
        exit 1
    fi
fi

# Function to log in and get token
login() {
    echo "Logging in to get authentication token..."
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"YOUR_TEST_EMAIL@example.com","password":"YOUR_TEST_PASSWORD"}')
    
    # Extract token from response
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo "Error: Failed to get authentication token. Check your credentials."
        echo "Response: $LOGIN_RESPONSE"
        exit 1
    else
        echo "Successfully obtained token."
    fi
}

# Function to test endpoint connection without file
test_endpoint_connection() {
    echo "Testing basic connection to payment endpoint..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X OPTIONS "$API_BASE_URL/api/payments/submit" \
        -H "Authorization: Bearer $TOKEN")
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "204" ]; then
        echo "✓ Connection test successful: Payment endpoint is reachable."
    else
        echo "✗ Connection test failed: Payment endpoint returned $RESPONSE."
        echo "This suggests the endpoint may not be properly configured or is unreachable."
    fi
}

# Function to test file upload capability
test_file_upload() {
    echo "Testing file upload capability with small test file..."
    RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/payments/submit" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: multipart/form-data" \
        -F "amount=100" \
        -F "paymentType=DUES" \
        -F "paymentDate=$(date +%Y-%m-%d)" \
        -F "receipt=@$TEST_FILE" \
        -w "\nStatus: %{http_code}")
    
    STATUS_CODE=$(echo "$RESPONSE" | grep -o "Status: [0-9]*" | cut -d' ' -f2)
    
    if [ "$STATUS_CODE" = "200" ] || [ "$STATUS_CODE" = "201" ]; then
        echo "✓ File upload test successful: Server accepted the payment submission."
    else
        echo "✗ File upload test failed: Server returned status $STATUS_CODE."
        echo "Response: $(echo "$RESPONSE" | sed 's/Status: [0-9]*//')"
    fi
}

# Function to test file size limits
test_file_size_limits() {
    echo "Testing file size limit handling..."
    
    # Create a temporarily larger test file (5MB)
    LARGE_TEST_FILE="./large-test-receipt.jpg"
    dd if=/dev/zero of="$LARGE_TEST_FILE" bs=1M count=5 2>/dev/null
    
    RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/payments/submit" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: multipart/form-data" \
        -F "amount=100" \
        -F "paymentType=DUES" \
        -F "paymentDate=$(date +%Y-%m-%d)" \
        -F "receipt=@$LARGE_TEST_FILE" \
        -w "\nStatus: %{http_code}")
    
    STATUS_CODE=$(echo "$RESPONSE" | grep -o "Status: [0-9]*" | cut -d' ' -f2)
    
    if [ "$STATUS_CODE" = "413" ]; then
        echo "✓ File size limit test passed: Server correctly rejected oversized file."
    elif [ "$STATUS_CODE" = "200" ] || [ "$STATUS_CODE" = "201" ]; then
        echo "✓ Server accepted larger file (5MB). This is good if you expect to handle files of this size."
    else
        echo "? File size test returned status $STATUS_CODE."
        echo "Response: $(echo "$RESPONSE" | sed 's/Status: [0-9]*//')"
    fi
    
    # Clean up
    rm -f "$LARGE_TEST_FILE"
}

# Main diagnostic flow
echo "Starting diagnostic tests..."
login
test_endpoint_connection
test_file_upload
test_file_size_limits

echo "==== Diagnostic tests completed ===="
echo "If you encountered errors, check the following:"
echo "1. Verify that your backend server is running"
echo "2. Check that your API_BASE_URL is correct"
echo "3. Ensure that your authentication credentials are valid"
echo "4. Verify that the payment endpoint is correctly implemented"
echo "5. Check server logs for additional error details"
