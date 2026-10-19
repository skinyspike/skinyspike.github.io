<#
  weekly-notice.ps1 — 주간 업데이트 공지 자동 작성
  ---------------------------------------------------------------
  ThanksForWaiting(앱/서버) 저장소의 지난 한 주 커밋을 모아,
  wonderplant_home 의 assets/js/notices-data.js 맨 앞에
  「업데이트」 공지 한 건을 추가한다.

  사용 예
    # 지난 7일 커밋을 모아 공지 초안 작성 + 커밋 (푸시는 하지 않음)
    powershell -ExecutionPolicy Bypass -File tools\weekly-notice.ps1

    # 커밋 목록만 출력 (Claude 예약 작업이 이 모드를 사용한다)
    powershell -ExecutionPolicy Bypass -File tools\weekly-notice.ps1 -CollectOnly

    # 글만 쓰고 git 커밋은 하지 않음
    powershell -ExecutionPolicy Bypass -File tools\weekly-notice.ps1 -NoCommit

  주의: -Push 를 직접 주지 않으면 원격에 푸시하지 않는다. (공개 사이트 반영 전 검토용)
#>
[CmdletBinding()]
param(
  # 커밋 내역을 읽어올 제품 저장소
  [string] $SourceRepo = 'D:\works\thanksforwaiting',
  # 공지 데이터가 있는 홈페이지 저장소 (기본값: 이 스크립트의 상위 폴더)
  [string] $SiteRepo   = '',
  # 며칠 전까지의 커밋을 모을지
  [int]    $Days       = 7,
  # 커밋 목록만 표준출력으로 내보내고 종료
  [switch] $CollectOnly,
  # 공지는 작성하되 git 커밋은 하지 않음
  [switch] $NoCommit,
  # git push 까지 수행 (기본 비활성 — 공개 사이트에 바로 반영되므로)
  [switch] $Push
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $SiteRepo) {
  $here = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $PSCommandPath }
  $SiteRepo = Split-Path -Parent $here
}

$dataFile = Join-Path $SiteRepo 'assets\js\notices-data.js'
if (-not (Test-Path $SourceRepo)) { throw "제품 저장소를 찾을 수 없습니다: $SourceRepo" }
if (-not (Test-Path $dataFile))   { throw "공지 데이터 파일을 찾을 수 없습니다: $dataFile" }

# ---------------------------------------------------------------
# 1) 지난 $Days 일간의 커밋 수집
# ---------------------------------------------------------------
$since = (Get-Date).AddDays(-$Days).ToString('yyyy-MM-dd')
$raw = & git -C $SourceRepo log --no-merges --since=$since --date=short --pretty=format:'%ad|%s'
if ($LASTEXITCODE -ne 0) { throw "git log 실패: $SourceRepo" }

# 의미 없는 커밋 메시지 걸러내기 (".", ",", "/", "g", 버전업, 파이프라인 잡일 등)
$noise = '^\s*$|^[\.\,\/\-\s]+$|^.{1,3}$|^Merge\b|^chore:|^version up|^\.gitignore|^add \.gitignore|^gitignore|^filehashes'
$commits = @(
  $raw |
    Where-Object { $_ -and $_.Contains('|') } |
    ForEach-Object {
      $i = $_.IndexOf('|')
      [pscustomobject]@{ Date = $_.Substring(0, $i); Subject = $_.Substring($i + 1).Trim() }
    } |
    Where-Object { $_.Subject -notmatch $noise }
)

if ($CollectOnly) {
  Write-Output "# $SourceRepo · $since ~ $(Get-Date -Format 'yyyy-MM-dd') · 유효 커밋 $($commits.Count)건"
  $commits | ForEach-Object { Write-Output ("- {0} {1}" -f $_.Date, $_.Subject) }
  exit 0
}

if ($commits.Count -eq 0) {
  Write-Output "지난 $Days 일간 공지로 쓸 만한 커밋이 없습니다. 아무것도 하지 않고 종료합니다."
  exit 0
}

# ---------------------------------------------------------------
# 2) Claude Code 에게 공지 본문 작성을 맡긴다
# ---------------------------------------------------------------
$claude = (Get-Command claude -ErrorAction SilentlyContinue)
if (-not $claude) { throw "claude CLI 를 찾을 수 없습니다. Claude Code 설치 후 다시 실행하세요." }

$tmp = Join-Path $env:TEMP ("weekly-notice-{0}.md" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
$lines = @("# 지난 한 주 커밋 ($since ~ $(Get-Date -Format 'yyyy-MM-dd'))", "")
$lines += ($commits | ForEach-Object { "- {0} {1}" -f $_.Date, $_.Subject })
Set-Content -Path $tmp -Value ($lines -join "`n") -Encoding utf8

$prompt = @"
$SiteRepo 의 assets/js/notices-data.js 에 「업데이트」 공지 한 건을 추가해 주세요.

재료: $tmp (지난 한 주간 제품 저장소 커밋 목록)

규칙
1. 커밋 목록을 읽고, 고객(보호자·기사님)에게 의미 있는 변화만 골라 주제별로 묶으세요.
   빌드/파이프라인/리팩터링/오타 수정 같은 내부 작업은 쓰지 않습니다.
2. 쓸 만한 내용이 없으면 파일을 수정하지 말고 'SKIP' 한 단어만 출력하고 끝내세요.
3. 추가 위치는 'var WP_NOTICES = [' 바로 다음 줄, 배열 맨 앞입니다.
4. 기존 항목의 형식·문체를 그대로 따르세요. 필드는 id / category / title / date / excerpt / body.
   - category 는 '업데이트'
   - date 는 $(Get-Date -Format 'yyyy-MM-dd')
   - id 는 기존 id 와 겹치지 않는 영문 kebab-case
   - body 는 홑따옴표 문자열을 + 로 이어붙인 HTML (<p> <h3> <ul><li> <strong> <a> 만 사용)
   - 홑따옴표 문자열 안에 '(아포스트로피)를 쓰지 마세요.
5. 문체: 존댓말, 과장 없이, 사용자가 무엇을 할 수 있게 되었는지 중심으로. 기존 글들의 톤을 참고하세요.
6. 수정 후 'node -e' 로 파일이 유효한 JS 인지 꼭 확인하세요.
"@

Write-Output "Claude 에게 공지 작성을 요청합니다... (커밋 $($commits.Count)건)"
$result = $prompt | & claude -p --permission-mode acceptEdits --add-dir $SiteRepo
Write-Output $result

if ($result -match 'SKIP') {
  Write-Output "공지로 쓸 만한 내용이 없다고 판단되었습니다. 종료합니다."
  Remove-Item $tmp -ErrorAction SilentlyContinue
  exit 0
}

# ---------------------------------------------------------------
# 3) 검증 후 커밋
# ---------------------------------------------------------------
Push-Location $SiteRepo
try {
  & node -e "global.window={};eval(require('fs').readFileSync('assets/js/notices-data.js','utf8'));if(!Array.isArray(WP_NOTICES)||!WP_NOTICES.length)process.exit(1);console.log('notices-data.js OK — '+WP_NOTICES.length+'건')"
  if ($LASTEXITCODE -ne 0) { throw "notices-data.js 가 유효하지 않습니다. 커밋하지 않고 중단합니다." }

  $changed = & git status --porcelain -- assets/js/notices-data.js
  if (-not $changed) {
    Write-Output "변경된 내용이 없습니다. 커밋하지 않습니다."
    exit 0
  }

  if ($NoCommit) {
    Write-Output "작성 완료. (-NoCommit 이므로 커밋하지 않았습니다. git diff 로 확인하세요.)"
    exit 0
  }

  & git add assets/js/notices-data.js
  & git commit -m "주간 업데이트 공지 추가 ($since ~ $(Get-Date -Format 'yyyy-MM-dd'))"
  Write-Output "커밋했습니다."

  if ($Push) {
    & git push
    Write-Output "푸시했습니다. 공개 사이트에 반영됩니다."
  } else {
    Write-Output "푸시하지 않았습니다. 내용 확인 후 'git push' 하세요."
  }
}
finally {
  Pop-Location
  Remove-Item $tmp -ErrorAction SilentlyContinue
}
