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

# MCP Collection Configuration
MCP_ENDPOINT_ID = os.getenv("MCP_ENDPOINT_ID")
MCP_API_KEY = os.getenv("MCP_API_KEY")
MCP_BASE_URL = os.getenv("MCP_BASE_URL", "http://localhost:3000")
MCP_SERVER_URL = f"{MCP_BASE_URL}/api/mcp/{MCP_ENDPOINT_ID}"

# Define the state for our graph
class AgentState(TypedDict):
    messages: Annotated[List[Any], add_messages]

@tool
def search_collection(query: str, limit: int = 10) -> str:
    """
    Search documents in a LaunchpadAI collection through the MCP endpoint.
    
    Args:
        query: The search query to find relevant documents
        limit: Maximum number of results to return (default: 10, max: 100)
        
    Returns:
        Search results from the collection
    """
    # Validate limit
    if limit < 1 or limit > 100:
        return "Error: Limit must be between 1 and 100"
    
    # Prepare the request payload
    payload = {
        "query": query,
        "limit": limit
    }
    
    # Execute curl command to send the request
    cmd = [
        "curl", "-s",
        "-X", "POST",
        MCP_SERVER_URL,
        "-H", "Content-Type: application/json",
        "-H", f"x-api-key: {MCP_API_KEY}",
        "-d", json.dumps(payload)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return f"Error calling MCP endpoint: {result.stderr}"
            
        # Try to parse the response
        try:
            response = json.loads(result.stdout)
            
            if response.get("success"):
                results = response.get("results", [])
                if not results:
                    return "No documents found matching your query. This could mean:\n- The collection is empty\n- Your search terms don't match any documents\n- The collection hasn't been indexed yet"
                
                # Format the results for better readability
                formatted_results = []
                for i, doc in enumerate(results[:limit], 1):
                    # Use the correct field names from the MCP endpoint response
                    title = doc.get("document_title", doc.get("filename", "Untitled"))
                    content = doc.get("chunk_content", "No content available")
                    score = doc.get("relevance_score", doc.get("similarity", doc.get("vector_similarity", 0)))
                    
                    # Truncate content if too long
                    if len(content) > 300:
                        content = content[:300] + "..."
                    
                    formatted_results.append(
                        f"{i}. **{title}** (Score: {score:.3f})\n{content}\n"
                    )
                
                return f"Found {len(results)} documents:\n\n" + "\n".join(formatted_results)
            else:
                error_msg = response.get("error", "Unknown error occurred")
                if "Invalid API key" in error_msg:
                    return f"🔑 Authentication failed: {error_msg}\nPlease check your MCP_API_KEY configuration."
                elif "not found" in error_msg.lower():
                    return f"🔍 Endpoint not found: {error_msg}\nPlease check your MCP_ENDPOINT_ID configuration."
                else:
                    return f"Search failed: {error_msg}"
                
        except json.JSONDecodeError:
            # Check if it's an HTML error page (server not running)
            if "<html>" in result.stdout.lower() or "<!doctype" in result.stdout.lower():
                return f"🌐 Server appears to be down. Please start the LaunchpadAI development server on port 3000."
            else:
                return f"Invalid JSON response: {result.stdout[:200]}..."
    except Exception as e:
        return f"Error: {e}"

# Define the tools
tools = [search_collection]

# Create the LLM with tools
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY")
)
llm_with_tools = llm.bind_tools(tools)

# Define the agent node
def agent_node(state: AgentState) -> AgentState:
    """The main agent node that processes messages and decides on tool usage."""
    messages = state["messages"]
    
    # Add system message if this is the first interaction
    if not any(isinstance(msg, SystemMessage) for msg in messages):
        system_message = SystemMessage(content="""You are an AI assistant that can search through document collections using MCP (Model Context Protocol) endpoints.

Your capabilities:
1. Use 'search_collection' to search for documents in the connected collection using natural language queries
2. You can search multiple times with different queries to find comprehensive information
3. Always provide helpful summaries of the search results

The collection contains documents that you can search through. Be helpful in formulating good search queries and interpreting the results for the user.""")
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
    """Main function to run the LangGraph agent with MCP Collections integration."""
    print("\033[1m\033[36mLangGraph Agent with MCP Collections Integration\033[0m")
    print(f"Connected to: \033[33m{MCP_SERVER_URL}\033[0m")
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
                print("  - Search documents in the collection")
                print("  - Ask questions about the content")
                print("  - Get summaries and insights from documents")
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
                print(f"\n\033[1m\033[34mMCP Collections Agent:\033[0m {final_message.content}\n")
            else:
                print(f"\n\033[1m\033[34mMCP Collections Agent:\033[0m {final_message}\n")
            
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