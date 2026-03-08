"""
Main FastAPI Application
Responsibility: Application initialization and configuration
- Register tools
- Mount API routes
- Configure CORS
- Health check endpoint
"""

from dotenv import load_dotenv
load_dotenv() 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.execute import router as execute_router
from app.tools.base import tool_registry
from app.tools.llm_tool import LLMTool
from app.tools.logger_tool import LoggerTool
from app.tools.http_tool import HTTPTool
from app.tools.conditional_tool import ConditionalTool
from app.tools.transform_tool import TransformTool
from app.schemas.workflow_schema import HealthResponse
from app.tools.delay_tool import DelayTool
from app.tools.webhook_tool import WebhookTool
from app.tools.database_tool import DatabaseTool
from app.tools.google_sheets_tool import GoogleSheetsTool
from app.tools.csv_excel_tool import CSVExcelTool
from app.tools.email_tool import EmailTool
from app.tools.slack_tool import SlackTool
from app.tools.sms_tool import SMSTool
from app.tools.loop_tool import LoopTool
from app.tools.code_executor_tool import CodeExecutorTool
from app.tools.ai_vision_tool import AIVisionTool


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    
    Startup: Register tools
    Shutdown: Cleanup resources
    """
    # Startup: Register available tools
    print("🔧 Registering tools...")
    tool_registry.register("llm", LLMTool())
    tool_registry.register("logger", LoggerTool()) 
    tool_registry.register("http", HTTPTool())
    tool_registry.register("conditional", ConditionalTool())  
    tool_registry.register("transform", TransformTool())      
    tool_registry.register("delay", DelayTool())
    tool_registry.register("webhook", WebhookTool())
    tool_registry.register("database", DatabaseTool())
    tool_registry.register("google_sheets", GoogleSheetsTool())
    tool_registry.register("csv_excel", CSVExcelTool())
    tool_registry.register("email", EmailTool())
    tool_registry.register("slack", SlackTool())
    tool_registry.register("sms", SMSTool())
    tool_registry.register("loop", LoopTool())
    tool_registry.register("code_executor", CodeExecutorTool())
    tool_registry.register("ai_vision", AIVisionTool())


    
    registered_types = tool_registry.get_registered_types()
    print(f"✅ Registered tools: {', '.join(registered_types)}")
    
    yield
    
    # Shutdown: Cleanup
    print("🧹 Cleaning up resources...")
    tool_registry.clear()


# Initialize FastAPI app
app = FastAPI(
    title="AI Workflow Execution Engine",
    description="DAG-based workflow execution engine for AI automation",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
# In production, restrict origins to your Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Phase 3: Restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    
    Returns:
        Health status and service info
    """
    return HealthResponse(
        status="healthy",
        service="execution-engine",
        version="1.0.0"
    )


# Mount execution API routes
app.include_router(execute_router, prefix="/api", tags=["execution"])


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with API information
    
    Returns:
        API information
    """
    return {
        "service": "AI Workflow Execution Engine",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "execute": "POST /api/execute",
            "history": "GET /api/history/{workflow_id}",
            "stats": "GET /api/stats"
        },
        "registered_tools": tool_registry.get_registered_types()
    }


if __name__ == "__main__":
    import uvicorn
    
    # Run with uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Auto-reload on code changes (development only)
    )