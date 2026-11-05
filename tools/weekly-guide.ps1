<#
=============================================================
 주간 가이드 자동 작성 — 로컬 실행 스크립트
-------------------------------------------------------------
 Windows 작업 스케줄러가 주 1회 이 스크립트를 실행합니다.
 하는 일은 tools/weekly-guide-prompt.md 에 적혀 있고,
 이 스크립트는 Claude Code 를 비대화형으로 띄워 그 지시를 넘깁니다.

 직접 실행해 보려면:
   powershell -ExecutionPolicy Bypass -File tools\weekly-guide.ps1

 보낼 내용만 확인하고 아무것도 바꾸지 않으려면:
   powershell -ExecutionPolicy Bypass -File tools\weekly-guide.ps1 -WhatIfOnly

 필요한 환경변수 (사용자 환경변수로 한 번만 설정):
   WONDERPLANT_SLACK_WEBHOOK   슬랙 수신 웹훅 주소
   ⚠ 이 값을 저장소 안 어떤 파일에도 적지 마세요. 공개 저장소입니다.

 로그는 저장소 밖에 쌓입니다:
   %LOCALAPPDATA%\wonderplant\logs\weekly-guide-<날짜>.log
=============================================================
#>

[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$Model = 'opus',
    [switch]$WhatIfOnly
)

$ErrorActionPreference = 'Stop'

# Windows PowerShell 5.1 은 param 기본값에서 $PSScriptRoot 를 못 읽는다.
if (-not $RepoRoot) { $RepoRoot = Split-Path $PSScriptRoot -Parent }

# ---------- 로그 ----------
$logDir = Join-Path $env:LOCALAPPDATA 'wonderplant\logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir ("weekly-guide-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))

function Write-Log {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Write-Output $line
    Add-Content -Path $logFile -Value $line -Encoding utf8
}

Write-Log "시작 — 저장소 $RepoRoot"

# ---------- 사전 점검 ----------
if (-not (Test-Path $RepoRoot)) { Write-Log "중단: 저장소 경로가 없습니다"; exit 1 }
Set-Location $RepoRoot

$promptFile = Join-Path $RepoRoot 'tools\weekly-guide-prompt.md'
if (-not (Test-Path $promptFile)) { Write-Log "중단: $promptFile 이 없습니다"; exit 1 }

$claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
if (-not $claude) { Write-Log "중단: claude CLI 를 찾을 수 없습니다"; exit 1 }

if (-not $env:WONDERPLANT_SLACK_WEBHOOK) {
    Write-Log "주의: WONDERPLANT_SLACK_WEBHOOK 이 비어 있습니다. 글은 쓰되 슬랙 전송은 건너뜁니다"
}

# 작업 트리가 지저분하면 이번 주 커밋에 남의 변경이 섞인다. 멈추는 편이 안전하다.
$dirty = git status --porcelain
if ($dirty) {
    Write-Log "중단: 커밋되지 않은 변경이 있습니다. 정리한 뒤 다시 실행하세요"
    Write-Log ($dirty | Out-String).Trim()
    exit 1
}

# 원격 최신 내용을 먼저 받아 둔다 (푸시는 하지 않는다)
try {
    git pull --ff-only 2>&1 | ForEach-Object { Write-Log "git: $_" }
} catch {
    Write-Log "주의: git pull 실패 — 로컬 상태로 진행합니다"
}

if ($WhatIfOnly) {
    Write-Log "WhatIfOnly — 여기까지 점검만 하고 끝냅니다"
    Write-Log "다음 주제: $((Select-String -Path 'content\guides\BACKLOG.md' -Pattern '^- \[ \]' | Select-Object -First 1).Line)"
    exit 0
}

# ---------- 실행 ----------
$prompt = Get-Content $promptFile -Raw -Encoding utf8

Write-Log "Claude Code 실행 (모델 $Model)"

& $claude --print $prompt `
    --model $Model `
    --permission-mode acceptEdits `
    --allowedTools 'Bash Read Write Edit Glob Grep WebSearch WebFetch' `
    --output-format text 2>&1 | ForEach-Object { Write-Log $_ }

$code = $LASTEXITCODE
Write-Log "Claude Code 종료 코드 $code"

# ---------- 결과 ----------
$head = git log -1 --pretty='%h %s'
Write-Log "현재 HEAD — $head"

$ahead = (git rev-list --count '@{u}..HEAD' 2>$null)
if ($ahead -and [int]$ahead -gt 0) {
    Write-Log "푸시 대기 중인 커밋 $ahead 건 — 확인 후 git push 하세요"
}

Write-Log "끝 — 로그 $logFile"
exit $code
