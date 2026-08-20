# 把 client.template.js 中的 @@WHALE_*@@ 占位符替换为 base64 data URI，
# 生成自包含的 client.js（即 cordis_define 的 code.client）。
# 依赖：assets/web/whale-{think,happy,sorry,smug}.webp（已压缩的 128px 图）。
$ErrorActionPreference = 'Stop'
$base = $PSScriptRoot

$tpl = [IO.File]::ReadAllText((Join-Path $base 'client.template.js'))
$map = @{ THINK = 'think'; HAPPY = 'happy'; SORRY = 'sorry'; SMUG = 'smug' }

foreach ($k in $map.Keys) {
  $webp = Join-Path $base "assets\web\whale-$($map[$k]).webp"
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($webp))
  $chunks = @()
  for ($i = 0; $i -lt $b64.Length; $i += 900) {
    $len = [Math]::Min(900, $b64.Length - $i)
    $chunks += "'" + $b64.Substring($i, $len) + "'"
  }
  $expr = "'data:image/webp;base64,' +" + "`n  " + ($chunks -join " +`n  ")
  $tpl = $tpl.Replace("'@@WHALE_$k@@'", $expr)
  Write-Output "$k : $($b64.Length) chars -> $($chunks.Count) chunks"
}

[IO.File]::WriteAllText((Join-Path $base 'client.js'), $tpl)
Write-Output "client.js written: $((Get-Item (Join-Path $base 'client.js')).Length) bytes"

# 3) 生成浏览器 bundle（lib/client.js，供 dsh.client 模块表加载）
node (Join-Path $base 'build-bundle.mjs')
if ($LASTEXITCODE -ne 0) { throw 'build-bundle.mjs failed' }
