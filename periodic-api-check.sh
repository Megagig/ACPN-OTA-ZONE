#!/bin/bash

# Periodic API connectivity check script
# This script checks the API connection every 5 minutes and logs the results
# Usage: ./periodic-api-check.sh [options]
# Options:
#   --interval=N  Check every N seconds (default: 300)
#   --log=FILE    Log file path (default: api-connection-log.txt)
#   --alert       Send alerts on failures (requires mailutils)

# Default settings
INTERVAL=300
LOG_FILE="api-connection-log.txt"
SEND_ALERTS=false
BACKEND_URL="http://localhost:5000/api"
MAX_RETRIES=3
RETRY_DELAY=5
ERROR_COUNT=0
SUCCESS_COUNT=0

# Process command line arguments
for arg in "$@"; do
  case $arg in
    --interval=*)
      INTERVAL="${arg#*=}"
      ;;
    --log=*)
      LOG_FILE="${arg#*=}"
      ;;
    --alert)
      SEND_ALERTS=true
      ;;
    --help)
      echo "Usage: ./periodic-api-check.sh [options]"
      echo "Options:"
      echo "  --interval=N  Check every N seconds (default: 300)"
      echo "  --log=FILE    Log file path (default: api-connection-log.txt)"
      echo "  --alert       Send alerts on failures (requires mailutils)"
      echo "  --help        Show this help message"
      exit 0
      ;;
  esac
done

# Check if we have curl
if ! command -v curl &> /dev/null; then
  echo "Error: curl is required but not installed. Please install curl."
  exit 1
fi

# Check if mail is available when alerts are enabled
if [ "$SEND_ALERTS" = true ] && ! command -v mail &> /dev/null; then
  echo "Warning: mail command not found. Alerts will not be sent."
  echo "Install mailutils to enable email alerts: sudo apt-get install mailutils"
  SEND_ALERTS=false
fi

# Initialize log file
echo "=== ACPN Ota Zone API Connection Monitoring ===" > "$LOG_FILE"
echo "Started at $(date)" >> "$LOG_FILE"
echo "Checking API every $INTERVAL seconds" >> "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE"

# Function to send alert
send_alert() {
  local subject="$1"
  local message="$2"
  
  if [ "$SEND_ALERTS" = true ]; then
    echo -e "$message" | mail -s "$subject" "admin@example.com"
    echo "[$(date)] Alert sent: $subject" >> "$LOG_FILE"
  fi
  
  # Always output to console
  echo -e "$message"
}

# Function to check API connection
check_api() {
  local retry=0
  local success=false
  local start_time=$(date +%s)
  
  echo "[$(date)] Checking API connection..." >> "$LOG_FILE"
  
  # Try up to MAX_RETRIES times
  while [ $retry -lt $MAX_RETRIES ] && [ "$success" = false ]; do
    if [ $retry -gt 0 ]; then
      echo "  Retry $retry/$MAX_RETRIES after $RETRY_DELAY seconds..." >> "$LOG_FILE"
      sleep $RETRY_DELAY
    fi
    
    # Make the API request
    HTTP_CODE=$(curl -s -o /tmp/api-response.txt -w "%{http_code}" "$BACKEND_URL/health-check")
    
    # Check if request was successful
    if [ "$HTTP_CODE" -eq 200 ]; then
      success=true
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
      RESPONSE=$(cat /tmp/api-response.txt)
      echo "  Success! HTTP Code: $HTTP_CODE" >> "$LOG_FILE"
      echo "  Response: $RESPONSE" >> "$LOG_FILE"
      
      # Reset error count after a successful check
      if [ $ERROR_COUNT -gt 0 ]; then
        echo "  API is back online after $ERROR_COUNT consecutive failures" >> "$LOG_FILE"
        if [ $ERROR_COUNT -ge 3 ]; then
          send_alert "API Connection Restored" "The API connection has been restored after $ERROR_COUNT consecutive failures.\n\nTime: $(date)\nBackend URL: $BACKEND_URL"
        fi
        ERROR_COUNT=0
      fi
    else
      echo "  Failed! HTTP Code: $HTTP_CODE" >> "$LOG_FILE"
      retry=$((retry + 1))
    fi
  done
  
  # If all retries failed
  if [ "$success" = false ]; then
    ERROR_COUNT=$((ERROR_COUNT + 1))
    echo "  All retries failed. API connection is down." >> "$LOG_FILE"
    
    # Send an alert if configured and it's the first or third consecutive failure
    if [ $ERROR_COUNT -eq 1 ] || [ $ERROR_COUNT -eq 3 ]; then
      send_alert "API Connection Failure" "The API connection check has failed $ERROR_COUNT consecutive times.\n\nTime: $(date)\nBackend URL: $BACKEND_URL\nHTTP Code: $HTTP_CODE"
    fi
  fi
  
  # Calculate response time
  local end_time=$(date +%s)
  local response_time=$((end_time - start_time))
  echo "  Response time: ${response_time}s" >> "$LOG_FILE"
  echo "----------------------------------------" >> "$LOG_FILE"
}

# Main loop
echo "API connection monitoring started. Press Ctrl+C to stop."
while true; do
  check_api
  
  # Display stats
  echo -ne "Monitoring API: $SUCCESS_COUNT successes, $ERROR_COUNT current consecutive failures. Next check in $INTERVAL seconds...\r"
  
  sleep $INTERVAL
done
