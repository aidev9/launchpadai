#!/usr/bin/env python3
import asyncio
import json
import os
import subprocess
import sys
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

# MCP Server Configuration
MCP_AGENT_ID = os.getenv("MCP_AGENT_ID")
AGENT_MCP_API_KEY = os.getenv("AGENT_MCP_API_KEY")
MCP_BASE_URL = os.getenv("MCP_BASE_URL", "http://localhost:3000")
MCP_SERVER_URL = f"{MCP_BASE_URL}/api/mcp/agents/{MCP_AGENT_ID}"

# Define the state for our graph
class AgentState(TypedDict):
    messages: Annotated[List[Any], add_messages]

@tool
def launchpad_chat(message: str) -> str:
    """
    Chat with the LaunchpadAI agent through the MCP server.
    
    Args:
        message: The message to send to the LaunchpadAI agent
        
    Returns:
        The response from the LaunchpadAI agent
    """
    # Prepare the JSON-RPC 2.0 request payload for the chat tool
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "chat",
            "arguments": {
                "message": message
            }
        }
    }
    
    # Execute curl command to send the request
    cmd = [
        "curl", "-s",
        "-X", "POST",
        MCP_SERVER_URL,
        "-H", "Content-Type: application/json",
        "-H", f"x-api-key: {AGENT_MCP_API_KEY}",
        "-d", json.dumps(payload)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return f"Error calling LaunchpadAI: {result.stderr}"
            
        # Try to parse the response
        print(f"[DEBUG] Raw stdout length: {len(result.stdout)} chars")
        print(f"[DEBUG] Raw stdout: {repr(result.stdout)}")
        try:
            response = json.loads(result.stdout)
            # Handle JSON-RPC 2.0 response format
            if "result" in response and "content" in response["result"]:
                # Extract text from the content array
                content = response["result"]["content"]
                if isinstance(content, list):
                    # Combine all text content from all parts with proper formatting
                    full_text = []
                    print(f"[DEBUG] Raw response: {json.dumps(response, indent=2)}")
                    print(f"[DEBUG] Found {len(content)} content parts")
                    
                    for i, item in enumerate(content):
                        print(f"[DEBUG] Part {i+1}: {type(item)} - {item}")
                        if isinstance(item, dict):
                            text = item.get("text", "")
                            print(f"[DEBUG] Part {i+1} text length: {len(text)} chars")
                            if text:
                                print(f"[DEBUG] Part {i+1} first 200 chars: {repr(text[:200])}")
                                print(f"[DEBUG] Part {i+1} last 200 chars: {repr(text[-200:])}")
                                if text.strip():  # Only add non-empty text
                                    full_text.append(text.strip())
                    
                    # Join with double newlines for better readability
                    result_text = "\n\n".join(full_text) if full_text else "No text content found"
                    print(f"[DEBUG] Combined {len(full_text)} text parts")
                    print(f"[DEBUG] Final combined text length: {len(result_text)} chars")
                    print(f"[DEBUG] Final text first 200 chars: {repr(result_text[:200])}")
                    print(f"[DEBUG] Final text last 200 chars: {repr(result_text[-200:])}")
                    return result_text
                elif isinstance(content, str):
                    # Handle single string content
                    return content
                else:
                    return "No content found in response"
            elif "error" in response:
                return f"MCP Error: {response['error']['message']}"
            else:
                return f"Unexpected response format: {response}"
        except json.JSONDecodeError:
            return f"Invalid JSON response: {result.stdout}"
    except Exception as e:
        return f"Error: {e}"

@tool
def get_agent_info() -> str:
    """
    Get information about the LaunchpadAI agent.
    
    Returns:
        Information about the agent's capabilities and configuration
    """
    # Prepare the JSON-RPC 2.0 request payload for the get_agent_info tool
    payload = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "get_agent_info",
            "arguments": {}
        }
    }
    
    # Execute curl command to send the request
    cmd = [
        "curl", "-s",
        "-X", "POST",
        MCP_SERVER_URL,
        "-H", "Content-Type: application/json",
        "-H", f"x-api-key: {AGENT_MCP_API_KEY}",
        "-d", json.dumps(payload)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return f"Error getting agent info: {result.stderr}"
            
        # Try to parse the response
        try:
            response = json.loads(result.stdout)
            # Handle JSON-RPC 2.0 response format
            if "result" in response and "content" in response["result"]:
                # Extract text from the content array
                content = response["result"]["content"]
                if isinstance(content, list):
                    # Combine all text content from all parts and properly format URLs
                    full_text = []
                    for item in content:
                        if isinstance(item, dict):
                            text = item.get("text", "")
                            # Clean up URL formatting
                            text = text.replace("](http", "](hxxp")  # Temporarily mark URLs
                            text = text.replace("[", "\n[")  # Add newline before links
                            text = text.replace("](hxxp", "](http")  # Restore URLs
                            full_text.append(text)
                    return "\n".join(full_text) if full_text else "No agent info found"
                elif isinstance(content, str):
                    return content
                else:
                    return "No agent info found in response"
            elif "error" in response:
                return f"MCP Error: {response['error']['message']}"
            else:
                return f"Unexpected response format: {response}"
        except json.JSONDecodeError:
            return f"Invalid JSON response: {result.stdout}"
    except Exception as e:
        return f"Error: {e}"

# Define the tools
tools = [launchpad_chat, get_agent_info]

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
        system_message = SystemMessage(content="""You are an AI assistant that has access to a specialized LaunchpadAI agent through MCP tools. 

Your capabilities:
1. Use the 'launchpad_chat' tool to send messages to the LaunchpadAI agent for specialized knowledge and responses
2. Use the 'get_agent_info' tool to learn about the LaunchpadAI agent's capabilities

When a user asks a question:
- If it's about business, marketing, product development, or startup-related topics, use the launchpad_chat tool to get specialized insights
- If the user wants to know about the agent's capabilities, use the get_agent_info tool
- For general questions, you can answer directly, but consider if the LaunchpadAI agent might provide better insights

Always be helpful and provide comprehensive responses.""")
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

async def main():
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
                print("  - Ask about business, marketing, or startup topics (uses LaunchpadAI)")
                print("  - Ask about agent capabilities")
                print("  - General conversation and assistance")
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
                print(f"\n\033[1m\033[34mLangGraph Agent:\033[0m {final_message.content}\n")
            else:
                print(f"\n\033[1m\033[34mLangGraph Agent:\033[0m {final_message}\n")
            
        except KeyboardInterrupt:
            print("\n\033[33mOperation interrupted. Type 'exit' to quit or continue with a new query.\033[0m")
        except Exception as e:
            print(f"\n\033[31mError: {e}\033[0m\n")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\033[33mExiting...\033[0m")
        sys.exit(0) 