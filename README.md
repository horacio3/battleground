# Battleground Chat UI

A modern chat interface with support for multiple models and code interpreter functionality.

## Features

- **Multiple Model Support**: Chat with different AI models in the same interface
- **Code Interpreter**: Run Python code directly in the chat
- **Sync Mode**: Synchronize chat messages across different models
- **File Attachments**: Upload and share images with the models
- **Chat History**: Persistent chat history with local storage
- **Project Management**: Organize chats into projects

## Code Interpreter

The Code Interpreter feature allows you to run Python code directly in your chat session. When enabled:

1. A blue "Enabled" badge appears to indicate Code Interpreter is active
2. The model can generate and execute Python code
3. Results, including charts and data visualizations, appear directly in the chat
4. Session state is maintained between executions

### Default Settings

- Code Interpreter: OFF by default for new chats
- Sync Mode: ON by default for new chats

## Development

This project uses Next.js, React, and TypeScript.

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## License

MIT