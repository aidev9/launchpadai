#!/usr/bin/env python3
import asyncio
import json
import os
import requests
import sys
import time
from typing import Dict, Any, List, TypedDict, Annotated
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

# Load environment variables from .env.local
load_dotenv("./.env.local")

# A2A Agent Configuration
A2A_AGENT_ID = os.getenv("A2A_AGENT_ID")
A2A_CLIENT_ID = os.getenv("A2A_CLIENT_ID")
A2A_CLIENT_SECRET = os.getenv("A2A_CLIENT_SECRET")
A2A_BASE_URL = os.getenv("A2A_BASE_URL", "http://localhost:3000")

# Define the state for our graph
class AgentState(TypedDict):
    messages: Annotated[List[Any], add_messages]

class A2AClient:
    """Client for interacting with A2A agents using OAuth2 authentication."""
    
    def __init__(self, agent_id: str, client_id: str, client_secret: str, base_url: str):
        self.agent_id = agent_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url
        self.access_token = None
        self.endpoints = {
            "chat": f"{base_url}/api/a2a/agents/{agent_id}/chat",
            "capabilities": f"{base_url}/api/a2a/agents/{agent_id}/capabilities",
            "health": f"{base_url}/api/a2a/agents/{agent_id}/health"
        }
        self.auth_endpoints = {
            "authorize": f"{base_url}/api/a2a/auth/authorize",
            "token": f"{base_url}/api/a2a/auth/token"
        }
    
    def authenticate(self) -> bool:
        """Authenticate with the A2A service using OAuth2 authorization code flow."""
        try:
            # Step 1: Get authorization code
            # For a command-line client, we'll simulate the authorization flow
            # In a real implementation, this would involve redirecting to the authorization URL
            
            # For testing purposes, we'll use a simplified approach
            # and directly request a token using the authorization code flow
            
            # First, let's try to get an authorization code
            # Since this is a server-to-server communication, we'll simulate the redirect
            redirect_uri = "http://localhost:8080/callback"  # Dummy redirect URI
            
            auth_params = {
                "client_id": self.client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "agent.chat agent.read"
            }
            
            # For this demo, we'll skip the actual authorization step and directly
            # create a mock authorization code that our token endpoint can handle
            import base64
            import time
            
            # Create a mock authorization code (this simulates what would come from the auth endpoint)
            code_data = {
                "clientId": self.client_id,
                "agentId": self.agent_id,
                "redirectUri": redirect_uri,
                "scope": "agent.chat agent.read",
                "expiresAt": int((time.time() + 600) * 1000)  # 10 minutes from now in milliseconds
            }
            
            mock_auth_code = base64.b64encode(json.dumps(code_data).encode()).decode()
            
            # Step 2: Exchange authorization code for access token
            print(f"🔄 Exchanging authorization code for access token...")
            print(f"📡 Token URL: {self.auth_endpoints['token']}")
            
            token_response = requests.post(
                self.auth_endpoints["token"],
                json={
                    "grant_type": "authorization_code",
                    "code": mock_auth_code,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": redirect_uri
                },
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📊 Token response status: {token_response.status_code}")
            
            if token_response.status_code == 200:
                token_data = token_response.json()
                self.access_token = token_data.get("access_token")
                print(f"✅ Successfully authenticated with A2A service")
                print(f"🔑 Access token obtained (expires in {token_data.get('expires_in', 'unknown')} seconds)")
                print(f"🎯 Token type: {token_data.get('token_type', 'unknown')}")
                return True
            else:
                print(f"❌ Token exchange failed: {token_response.status_code}")
                try:
                    error_data = token_response.json()
                    print(f"📋 Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"📋 Error text: {token_response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers with authentication token."""
        if not self.access_token:
            raise Exception("Not authenticated. Call authenticate() first.")
        
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def check_health(self) -> Dict[str, Any]:
        """Check agent health status."""
        try:
            response = requests.get(
                self.endpoints["health"],
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": f"Health check failed: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_capabilities(self) -> Dict[str, Any]:
        """Get agent capabilities."""
        try:
            response = requests.get(
                self.endpoints["capabilities"],
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": f"Capabilities request failed: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def chat(self, message: str, conversation_id: str = None) -> Dict[str, Any]:
        """Send a chat message to the agent."""
        try:
            # Format the message according to A2A chat endpoint expectations
            payload = {
                "message": message,
                "context": {
                    "conversation_id": conversation_id,
                    "user_id": "langgraph_client",
                    "timestamp": int(time.time() * 1000)
                } if conversation_id else {}
            }
            
            print(f"💬 Sending chat message to: {self.endpoints['chat']}")
            print(f"📝 Message: {message[:100]}{'...' if len(message) > 100 else ''}")
            
            response = requests.post(
                self.endpoints["chat"],
                headers=self.get_headers(),
                json=payload
            )
            
            print(f"📊 Chat response status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                return {"success": True, "data": response_data}
            else:
                try:
                    error_data = response.json()
                    error_msg = f"Chat request failed: {response.status_code} - {json.dumps(error_data, indent=2)}"
                except:
                    error_msg = f"Chat request failed: {response.status_code} - {response.text}"
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

@tool
def chat_with_a2a_agent(message: str) -> str:
    """
    Chat with an A2A agent through the LaunchpadAI A2A interface.
    
    Args:
        message: The message to send to the A2A agent
        
    Returns:
        Response from the A2A agent
    """
    # Initialize A2A client
    client = A2AClient(A2A_AGENT_ID, A2A_CLIENT_ID, A2A_CLIENT_SECRET, A2A_BASE_URL)
    
    # Authenticate
    if not client.authenticate():
        return "❌ Failed to authenticate with A2A service. Please check your credentials."
    
    # Send chat message
    result = client.chat(message)
    
    if result["success"]:
        response_data = result["data"]
        agent_response = response_data.get("response", "No response from agent")
        metadata = response_data.get("metadata", {})
        conversation_id = metadata.get("conversation_id", "Unknown")
        agent_name = metadata.get("agent_name", "A2A Agent")
        
        return f"🤖 {agent_name} Response:\n{agent_response}\n\n📝 Conversation ID: {conversation_id}"
    else:
        return f"❌ Chat failed: {result['error']}"

@tool
def check_a2a_agent_health() -> str:
    """
    Check the health status of the A2A agent.
    
    Returns:
        Health status of the A2A agent
    """
    # Initialize A2A client
    client = A2AClient(A2A_AGENT_ID, A2A_CLIENT_ID, A2A_CLIENT_SECRET, A2A_BASE_URL)
    
    # Authenticate
    if not client.authenticate():
        return "❌ Failed to authenticate with A2A service. Please check your credentials."
    
    # Check health
    result = client.check_health()
    
    if result["success"]:
        health_data = result["data"]
        status = health_data.get("status", "unknown")
        return f"🏥 A2A Agent Health: {status}\n📊 Details: {json.dumps(health_data, indent=2)}"
    else:
        return f"❌ Health check failed: {result['error']}"

@tool
def get_a2a_agent_capabilities() -> str:
    """
    Get the capabilities of the A2A agent.
    
    Returns:
        Capabilities of the A2A agent
    """
    # Initialize A2A client
    client = A2AClient(A2A_AGENT_ID, A2A_CLIENT_ID, A2A_CLIENT_SECRET, A2A_BASE_URL)
    
    # Authenticate
    if not client.authenticate():
        return "❌ Failed to authenticate with A2A service. Please check your credentials."
    
    # Get capabilities
    result = client.get_capabilities()
    
    if result["success"]:
        capabilities_data = result["data"]
        return f"🔧 A2A Agent Capabilities:\n{json.dumps(capabilities_data, indent=2)}"
    else:
        return f"❌ Capabilities request failed: {result['error']}"

# Define the tools
tools = [chat_with_a2a_agent, check_a2a_agent_health, get_a2a_agent_capabilities]

# Create the LLM with tools
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
    api_key=os.environ.get("OPENAI_API_KEY")
)
llm_with_tools = llm.bind_tools(tools)

# Define the agent node
def agent_node(state: AgentState) -> AgentState:
    """The main agent node that processes messages and decides on tool usage."""
    messages = state["messages"]
    
    # Add system message if this is the first interaction
    if not any(isinstance(msg, SystemMessage) for msg in messages):
        system_message = SystemMessage(content="""You are an AI assistant that can interact with other AI agents through the LaunchpadAI A2A (Agent-to-Agent) interface.

Your capabilities:
1. Use 'chat_with_a2a_agent' to send messages to the A2A agent and get responses
2. Use 'check_a2a_agent_health' to check if the A2A agent is healthy and operational
3. Use 'get_a2a_agent_capabilities' to discover what the A2A agent can do
4. You can have conversations with the A2A agent and relay information back to the user

The A2A interface uses OAuth2 authentication and provides a standardized way for agents to communicate with each other.""")
        messages = [system_message] + messages
    
    # Get response from LLM
    response = llm_with_tools.invoke(messages)
    
    return {"messages": [response]}

# Define the tool node
tool_node = ToolNode(tools)

# Define the conditional edge function
def should_continue(state: AgentState) -> str:
    """Determine whether to continue with tool calls or end."""
    messages = state["messages"]
    last_message = messages[-1]
    
    # If the last message has tool calls, go to tools
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "tools"
    # Otherwise, end
    return END

# Create the graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)

# Set entry point
workflow.set_entry_point("agent")

# Add edges
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)

# Add edge from tools back to agent
workflow.add_edge("tools", "agent")

# Compile the graph
app = workflow.compile()

def verify_configuration():
    """Verify that all required environment variables are set."""
    missing_vars = []
    
    if not A2A_AGENT_ID:
        missing_vars.append("A2A_AGENT_ID")
    if not A2A_CLIENT_ID:
        missing_vars.append("A2A_CLIENT_ID")
    if not A2A_CLIENT_SECRET:
        missing_vars.append("A2A_CLIENT_SECRET")
    if not os.getenv("OPENAI_API_KEY"):
        missing_vars.append("OPENAI_API_KEY")
    
    if missing_vars:
        print(f"\033[31m❌ Missing required environment variables: {', '.join(missing_vars)}\033[0m")
        print(f"\033[33m💡 Please set these in your .env.local file\033[0m")
        print(f"\033[33m📝 Example values:\033[0m")
        print(f"   A2A_AGENT_ID=AAPsftGygKltaQEFKW3U")
        print(f"   A2A_CLIENT_ID=a2a_AAPsftGy_1748347329526")
        print(f"   A2A_CLIENT_SECRET=a2a_secret_tb6rgrga3wg_1748347329526")
        print(f"   A2A_BASE_URL=http://localhost:3000")
        print(f"   OPENAI_API_KEY=your_openai_api_key_here")
        return False
    
    return True

async def main():
    """Main function to run the LangGraph agent with A2A integration."""
    print("\033[1m\033[36mLangGraph Agent with A2A Integration\033[0m")
    print(f"Connected to A2A Agent: \033[33m{A2A_AGENT_ID}\033[0m")
    print(f"Base URL: \033[33m{A2A_BASE_URL}\033[0m")
    
    # Verify configuration
    if not verify_configuration():
        return
    
    print("Type \033[33mexit\033[0m or \033[33mquit\033[0m to exit, \033[33mhelp\033[0m for instructions\n")
    
    while True:
        try:
            user_input = input("\033[1m\033[32mYou:\033[0m ")
            
            # Handle special commands
            if user_input.lower() in ["exit", "quit", "q"]:
                print("Goodbye!")
                break
            
            if user_input.lower() in ["help", "?"]:
                print("\n\033[1mCommands:\033[0m")
                print("  help, ?       - Show this help message")
                print("  exit, quit, q - Exit the agent")
                print("\033[1mCapabilities:\033[0m")
                print("  - Chat with A2A agents")
                print("  - Check A2A agent health")
                print("  - Get A2A agent capabilities")
                print("  - Relay conversations between you and A2A agents")
                print("  - Press Ctrl+C at any time to interrupt\n")
                continue
            
            if not user_input.strip():
                continue
            
            print("\033[90mProcessing with LangGraph agent...\033[0m")
            
            # Create initial state
            initial_state = {
                "messages": [HumanMessage(content=user_input)]
            }
            
            # Run the graph
            final_state = await app.ainvoke(initial_state)
            
            # Get the final response
            final_message = final_state["messages"][-1]
            if hasattr(final_message, 'content'):
                print(f"\n\033[1m\033[34mA2A Agent Interface:\033[0m {final_message.content}\n")
            else:
                print(f"\n\033[1m\033[34mA2A Agent Interface:\033[0m {final_message}\n")
            
        except KeyboardInterrupt:
            print("\n\033[33mOperation interrupted. Type 'exit' to quit or continue with a new query.\033[0m")
        except EOFError:
            print("\n\033[33mExiting...\033[0m")
            break
        except Exception as e:
            print(f"\n\033[31mError: {e}\033[0m\n")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\033[33mExiting...\033[0m")
        sys.exit(0) 