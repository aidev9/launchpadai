# LaunchpadAI Python Scripts

This directory contains three Python scripts for testing different LaunchpadAI interfaces using LangGraph agents:

1. **`langgraph_mcp_agent.py`** - Tests the MCP (Model Context Protocol) agent interface
2. **`langgraph_mcp_collections.py`** - Tests the MCP collections search interface
3. **`langgraph_a2a_agent.py`** - Tests the A2A (Agent-to-Agent) interface

## Prerequisites

### Python Dependencies

Install the required Python packages:

```bash
pip install langchain-openai langgraph python-dotenv requests
```

### Environment Setup

Create a `.env.local` file in the root directory of your project (one level up from this `python-scripts` folder) with the following environment variables:

```bash
# OpenAI API Key (required for all scripts)
OPENAI_API_KEY=your_openai_api_key_here

# Base URL Configuration (optional, defaults to http://localhost:3000)
MCP_BASE_URL=http://localhost:3000  # For MCP agent and collections scripts
A2A_BASE_URL=http://localhost:3000  # For A2A agent script

# MCP Agent Configuration (for langgraph_mcp_agent.py)
MCP_AGENT_ID=your_mcp_agent_id_here
AGENT_MCP_API_KEY=your_agent_mcp_api_key_here

# MCP Collections Configuration (for langgraph_mcp_collections.py)
MCP_ENDPOINT_ID=your_mcp_endpoint_id_here
MCP_API_KEY=your_mcp_api_key_here

# A2A Agent Configuration (for langgraph_a2a_agent.py)
A2A_AGENT_ID=AAPsftGygKltaQEFKW3U
A2A_CLIENT_ID=your_a2a_client_id_here
A2A_CLIENT_SECRET=your_a2a_client_secret_here
```

### LaunchpadAI Server

Make sure your LaunchpadAI development server is running on port 3000:

```bash
cd web
npm run dev
```

## Script Descriptions

### 1. MCP Agent Script (`langgraph_mcp_agent.py`)

Tests the MCP agent interface that allows communication with AI agents through the Model Context Protocol.

**Features:**

- Chat with MCP agents
- Get agent capabilities
- Check agent health status
- List available tools

**Usage:**

```bash
python python-scripts/langgraph_mcp_agent.py
```

**Environment Variables Required:**

- `OPENAI_API_KEY`
- `MCP_AGENT_ID`
- `AGENT_MCP_API_KEY`
- `MCP_BASE_URL` (optional, defaults to http://localhost:3000)

### 2. MCP Collections Script (`langgraph_mcp_collections.py`)

Tests the MCP collections interface that allows searching through document collections using vector similarity.

**Features:**

- Search documents in collections
- Vector similarity search
- Keyword-based search
- Relevance scoring

**Usage:**

```bash
python python-scripts/langgraph_mcp_collections.py
```

**Environment Variables Required:**

- `OPENAI_API_KEY`
- `MCP_ENDPOINT_ID`
- `MCP_API_KEY`
- `MCP_BASE_URL` (optional, defaults to http://localhost:3000)

### 3. A2A Agent Script (`langgraph_a2a_agent.py`)

Tests the A2A (Agent-to-Agent) interface that allows agents to communicate with each other using OAuth2 authentication.

**Features:**

- Chat with A2A agents
- OAuth2 authentication
- Check agent health
- Get agent capabilities
- Conversation management

**Usage:**

```bash
python python-scripts/langgraph_a2a_agent.py
```

**Environment Variables Required:**

- `OPENAI_API_KEY`
- `A2A_AGENT_ID`
- `A2A_CLIENT_ID`
- `A2A_CLIENT_SECRET`
- `A2A_BASE_URL` (optional, defaults to http://localhost:3000)

## Getting Configuration Values

### MCP Agent Configuration

1. Go to your LaunchpadAI dashboard
2. Navigate to "My Agents"
3. Create or select an agent
4. Go to the MCP tab
5. Copy the agent ID and authentication details

### MCP Collections Configuration

1. Go to your LaunchpadAI dashboard
2. Navigate to "My Collections"
3. Select a collection
4. Go to the MCP tab
5. Create an MCP endpoint
6. Copy the endpoint ID and API key

### A2A Agent Configuration

1. Go to your LaunchpadAI dashboard
2. Navigate to "My Agents"
3. Create or select an agent
4. Go to the A2A tab
5. Copy the agent ID and OAuth2 credentials

## Interactive Commands

All scripts support the following interactive commands:

- `help` or `?` - Show help message
- `exit`, `quit`, or `q` - Exit the script
- `Ctrl+C` - Interrupt current operation

## Example Usage

### MCP Collections Search

```
You: search for information about exotic fish
MCP Collections Agent: I'll search for information about exotic fish in the collection.

Found 5 documents:

1. **Exotic Fish Care Guide** (Score: 0.892)
This comprehensive guide covers the basics of caring for exotic fish species including water temperature, feeding schedules, and tank maintenance...

2. **Tropical Fish Species** (Score: 0.756)
An overview of popular tropical and exotic fish species suitable for home aquariums...
```

### A2A Agent Chat

```
You: ask the agent about its capabilities
A2A Agent Interface: I'll check what the A2A agent can do and then chat with it.

🤖 A2A Agent Response:
I'm an AI assistant that can help with various tasks including answering questions, providing information, and assisting with problem-solving.

📝 Conversation ID: conv_123456789
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**

   - Check your API keys and credentials in `.env.local`
   - Ensure the LaunchpadAI server is running
   - Verify the endpoint URLs are correct

2. **Server Not Running**

   - Start the LaunchpadAI development server: `npm run dev`
   - Check that it's running on port 3000

3. **OpenAI API Key Invalid**

   - Verify your OpenAI API key is correct
   - Check your OpenAI account has sufficient credits

4. **Module Not Found**
   - Install required dependencies: `pip install langchain-openai langgraph python-dotenv requests`

### Debug Mode

To enable debug output, you can modify the scripts to include additional logging. Look for print statements in the code that show request/response details.

## API Endpoints

The scripts interact with these LaunchpadAI API endpoints:

### MCP Agent Endpoints

- `POST /api/mcp/agents/{agentId}` - MCP agent communication

### MCP Collections Endpoints

- `POST /api/mcp/{endpointId}` - Collection search

### A2A Agent Endpoints

- `POST /api/a2a/auth/token` - OAuth2 token endpoint
- `GET /api/a2a/agents/{agentId}/health` - Health check
- `GET /api/a2a/agents/{agentId}/capabilities` - Capabilities
- `POST /api/a2a/agents/{agentId}/chat` - Chat interface

## Contributing

When modifying these scripts:

1. Follow the existing code structure
2. Add proper error handling
3. Update this README if adding new features
4. Test with the LaunchpadAI development server

## License

These scripts are part of the LaunchpadAI project and follow the same license terms.
