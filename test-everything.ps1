# AI Workflow Platform - Test Suite (Clean Version)

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   AI Workflow Platform - Quick Test Suite            " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param($name, $url, $headers = @{})
    Write-Host "Testing: $name..." -NoNewline
    try {
        if ($headers.Count -gt 0) {
            $response = Invoke-RestMethod -Uri $url -Headers $headers -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $url -ErrorAction Stop
        }
        Write-Host " PASS" -ForegroundColor Green
        $script:testsPassed++
        return $response
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $null
    }
}

Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "PART 1: Infrastructure Tests" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""

# Test 1: Node.js Backend
Test-Endpoint "Node.js Backend Health" "http://localhost:5000/health" | Out-Null

# Test 2: Python Engine
$engineInfo = Test-Endpoint "Python Engine Health" "http://localhost:8000/health"

if ($engineInfo) {
    Write-Host "  Service: $($engineInfo.service)" -ForegroundColor Gray
}

# Test 3: Python Engine Root
$rootInfo = Test-Endpoint "Python Engine Info" "http://localhost:8000/"

if ($rootInfo) {
    Write-Host "  Registered Tools: $($rootInfo.registered_tools -join ', ')" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "PART 2: Authentication Tests" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""

# Test 4: User Login (assuming user exists)
Write-Host "Testing: User Login..." -NoNewline
try {
    $loginBody = @{
        email = "test@example.com"
        password = "test123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    $token = $loginResponse.data.token
    Write-Host " PASS" -ForegroundColor Green
    Write-Host "  Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Gray
    $script:testsPassed++
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    Write-Host "  Error: User may not exist. Create user first." -ForegroundColor Yellow
    $script:testsFailed++
    $token = $null
}

# Test 5: Get Current User
if ($token) {
    $authHeaders = @{ Authorization = "Bearer $token" }
    Write-Host "Testing: Get Current User..." -NoNewline
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" `
            -Headers $authHeaders `
            -ErrorAction Stop
        Write-Host " PASS" -ForegroundColor Green
        $script:testsPassed++
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "PART 3: Workflow Tests" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""

if ($token) {
    $authHeaders = @{ Authorization = "Bearer $token" }
    
    # Test 6: Create Workflow
    Write-Host "Testing: Create Workflow..." -NoNewline
    try {
        $workflowBody = @{
            name = "Test Workflow"
            description = "Automated test workflow"
            nodes = @(
                @{
                    id = "node1"
                    type = "llm"
                    config = @{
                        prompt = "Extract data"
                        model = "gpt-4"
                    }
                    data = @{
                        position = @{ x = 100; y = 100 }
                    }
                },
                @{
                    id = "node2"
                    type = "logger"
                    config = @{
                        message = "Data extracted"
                        level = "info"
                    }
                    data = @{
                        position = @{ x = 400; y = 100 }
                    }
                }
            )
            edges = @(
                @{ source = "node1"; target = "node2" }
            )
        } | ConvertTo-Json -Depth 10

        $createResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/workflows" `
            -Method Post `
            -ContentType "application/json" `
            -Headers $authHeaders `
            -Body $workflowBody `
            -ErrorAction Stop

        $workflowId = $createResponse.data._id
        Write-Host " PASS" -ForegroundColor Green
        Write-Host "  Workflow ID: $workflowId" -ForegroundColor Gray
        $script:testsPassed++
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        $workflowId = $null
    }

    # Test 7: Get All Workflows
    Write-Host "Testing: List Workflows..." -NoNewline
    try {
        $listResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/workflows" `
            -Headers $authHeaders `
            -ErrorAction Stop
        Write-Host " PASS" -ForegroundColor Green
        Write-Host "  Found $($listResponse.count) workflow(s)" -ForegroundColor Gray
        $script:testsPassed++
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        $script:testsFailed++
    }

    # Test 8: Get Single Workflow
    if ($workflowId) {
        Write-Host "Testing: Get Single Workflow..." -NoNewline
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:5000/api/workflows/$workflowId" `
                -Headers $authHeaders `
                -ErrorAction Stop
            Write-Host " PASS" -ForegroundColor Green
            $script:testsPassed++
        } catch {
            Write-Host " FAIL" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:testsFailed++
        }
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "PART 4: Python Engine Execution Tests" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""

# Test 9: Simple Execution
Write-Host "Testing: Execute Simple Workflow..." -NoNewline
try {
    $simpleExecution = @{
        workflowId = "test-simple"
        nodes = @(
            @{
                id = "test1"
                type = "logger"
                config = @{
                    message = "Hello World"
                    level = "info"
                }
            }
        )
        edges = @()
    } | ConvertTo-Json -Depth 10

    $simpleResult = Invoke-RestMethod -Uri "http://localhost:8000/api/execute" `
        -Method Post `
        -ContentType "application/json" `
        -Body $simpleExecution `
        -ErrorAction Stop

    Write-Host " PASS" -ForegroundColor Green
    Write-Host "  Status: $($simpleResult.status)" -ForegroundColor Gray
    $script:testsPassed++
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $script:testsFailed++
}

# Test 10: DAG Execution
Write-Host "Testing: Execute DAG Workflow..." -NoNewline
try {
    $dagExecution = @{
        workflowId = "test-dag"
        nodes = @(
            @{ id = "n1"; type = "llm"; config = @{ prompt = "Step 1" } },
            @{ id = "n2"; type = "llm"; config = @{ prompt = "Step 2" } },
            @{ id = "n3"; type = "logger"; config = @{ message = "Complete" } }
        )
        edges = @(
            @{ source = "n1"; target = "n2" },
            @{ source = "n2"; target = "n3" }
        )
    } | ConvertTo-Json -Depth 10

    $dagResult = Invoke-RestMethod -Uri "http://localhost:8000/api/execute" `
        -Method Post `
        -ContentType "application/json" `
        -Body $dagExecution `
        -ErrorAction Stop

    Write-Host " PASS" -ForegroundColor Green
    Write-Host "  Execution Order: $($dagResult.executionOrder -join ' -> ')" -ForegroundColor Gray
    Write-Host "  Total Time: $($dagResult.totalExecutionTime)s" -ForegroundColor Gray
    $script:testsPassed++
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $script:testsFailed++
}

# Test 11: Cycle Detection
Write-Host "Testing: Cycle Detection (should fail gracefully)..." -NoNewline
try {
    $cyclicWorkflow = @{
        workflowId = "test-cycle"
        nodes = @(
            @{ id = "n1"; type = "logger"; config = @{} },
            @{ id = "n2"; type = "logger"; config = @{} }
        )
        edges = @(
            @{ source = "n1"; target = "n2" },
            @{ source = "n2"; target = "n1" }
        )
    } | ConvertTo-Json -Depth 10

    $cycleResult = Invoke-RestMethod -Uri "http://localhost:8000/api/execute" `
        -Method Post `
        -ContentType "application/json" `
        -Body $cyclicWorkflow `
        -ErrorAction Stop

    if ($cycleResult.status -eq "failed" -and $cycleResult.error -like "*cycle*") {
        Write-Host " PASS (Correctly detected cycle)" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host " FAIL (Should have detected cycle)" -ForegroundColor Red
        $script:testsFailed++
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $script:testsFailed++
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "PART 5: End-to-End Execution" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""

# Test 12: Execute via Node.js to Python
if ($token -and $workflowId) {
    Write-Host "Testing: Execute Workflow (End-to-End)..." -NoNewline
    try {
        $e2eResult = Invoke-RestMethod -Uri "http://localhost:5000/api/workflows/$workflowId/execute" `
            -Method Post `
            -ContentType "application/json" `
            -Headers $authHeaders `
            -ErrorAction Stop

        Write-Host " PASS" -ForegroundColor Green
        Write-Host "  Status: $($e2eResult.data.status)" -ForegroundColor Gray
        Write-Host "  Nodes Executed: $($e2eResult.data.nodeResults.Count)" -ForegroundColor Gray
        $script:testsPassed++
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
    }
}

# Test 13: Cleanup - Delete Workflow
if ($token -and $workflowId) {
    Write-Host "Testing: Delete Workflow..." -NoNewline
    try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/workflows/$workflowId" `
            -Method Delete `
            -Headers $authHeaders `
            -ErrorAction Stop | Out-Null
        Write-Host " PASS" -ForegroundColor Green
        $script:testsPassed++
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        $script:testsFailed++
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "SUCCESS! All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your platform is working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
    Write-Host "2. Login with: test@example.com / test123" -ForegroundColor White
    Write-Host "3. Create workflows and watch them execute!" -ForegroundColor White
} else {
    Write-Host "WARNING: Some tests failed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Cyan
    Write-Host "- Backend not running: cd ai-workflow-backend && npm run dev" -ForegroundColor White
    Write-Host "- Python not running: cd execution-engine && .\venv\Scripts\Activate.ps1 && python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor White
    Write-Host "- User not created: Run create-test-workflows.ps1 first" -ForegroundColor White
}

Write-Host ""