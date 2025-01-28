#!/bin/bash

# Install dependencies if needed
echo "Installing dependencies..."
npm run install:all

# Set NODE_ENV for development mode
export NODE_ENV=development

# Start the webview dev server
cd webview-ui && npm run start &
WEBVIEW_PID=$!

# Start the extension watcher
cd .. && npm run watch &
EXTENSION_PID=$!

# Handle cleanup on script exit
cleanup() {
    echo "Cleaning up processes..."
    kill $WEBVIEW_PID
    kill $EXTENSION_PID
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
