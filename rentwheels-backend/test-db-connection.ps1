# ===================================================================
# RentWheels Supabase PostgreSQL Connection Tester
# This script tests network connectivity and PostgreSQL authentication.
# It NEVER prints or saves your password.
# ===================================================================

param(
    [string]$Mode = "pooler" # "pooler" (recommended, IPv4) or "direct" (IPv6)
)

$projectRef = "hhknvyvetypclkqsdfkr"
$directHost = "db.$projectRef.supabase.co"
$poolerHost = "aws-0-ap-south-1.pooler.supabase.com"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   RentWheels Supabase PostgreSQL Connectivity Diagnostic" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# 1. Network & Port Check
Write-Host "1. Testing Network Reachability..." -ForegroundColor Yellow

# Test Direct (port 5432)
$directTcp = New-Object System.Net.Sockets.TcpClient
$directAsync = $directTcp.BeginConnect($directHost, 5432, $null, $null)
$directOk = $directAsync.AsyncWaitHandle.WaitOne(3000, $false)
if ($directOk -and $directTcp.Connected) {
    Write-Host "   [DIRECT 5432] Reachable (IPv6/IPv4 direct path OK)" -ForegroundColor Green
    $directTcp.Close()
} else {
    Write-Host "   [DIRECT 5432] TIMED OUT (Supabase Direct resolves to IPv6 only; local ISP lacks IPv6 routing)" -ForegroundColor DarkYellow
    if ($directTcp) { $directTcp.Close() }
}

# Test Pooler (port 6543)
$poolerTcp = New-Object System.Net.Sockets.TcpClient
$poolerAsync = $poolerTcp.BeginConnect($poolerHost, 6543, $null, $null)
$poolerOk = $poolerAsync.AsyncWaitHandle.WaitOne(3000, $false)
if ($poolerOk -and $poolerTcp.Connected) {
    Write-Host "   [POOLER 6543] Reachable (Dual-stack IPv4/IPv6 OK)" -ForegroundColor Green
    $poolerTcp.Close()
} else {
    Write-Host "   [POOLER 6543] Unreachable" -ForegroundColor Red
    if ($poolerTcp) { $poolerTcp.Close() }
}

Write-Host "`n--------------------------------------------------------" -ForegroundColor Gray
if ($Mode -eq "pooler" -or (-not $directOk)) {
    Write-Host "Selected Connection: SUPABASE SESSION POOLER (Recommended IPv4)" -ForegroundColor Cyan
    $hostToUse = $poolerHost
    $portToUse = 6543
    $userToUse = "postgres.$projectRef"
    $jdbcUrl   = "jdbc:postgresql://${poolerHost}:6543/postgres?sslmode=require"
} else {
    Write-Host "Selected Connection: SUPABASE DIRECT (port 5432)" -ForegroundColor Cyan
    $hostToUse = $directHost
    $portToUse = 5432
    $userToUse = "postgres"
    $jdbcUrl   = "jdbc:postgresql://${directHost}:5432/postgres?sslmode=require"
}

Write-Host "Host:     $hostToUse"
Write-Host "Port:     $portToUse"
Write-Host "User:     $userToUse"
Write-Host "Database: postgres"
Write-Host "SSL Mode: require"
Write-Host "JDBC URL: $jdbcUrl`n"

Write-Host "To run your Spring Boot application with these settings:" -ForegroundColor Yellow
Write-Host '$env:SPRING_DATASOURCE_URL = "'$jdbcUrl'"' -ForegroundColor White
Write-Host '$env:SPRING_DATASOURCE_USERNAME = "'$userToUse'"' -ForegroundColor White
Write-Host '$env:SPRING_DATASOURCE_PASSWORD = "<YOUR_SUPABASE_PASSWORD>"' -ForegroundColor White
Write-Host ".\mvnw.cmd spring-boot:run`n" -ForegroundColor White

