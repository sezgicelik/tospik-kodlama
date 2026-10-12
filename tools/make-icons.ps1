# PWA ikonlarını üretir: icons/icon-192.png, icon-512.png, icon-512-maskable.png
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "icons"
New-Item -ItemType Directory -Force $outDir | Out-Null

function Draw-Turtle([int]$size, [bool]$maskable, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $paper = [System.Drawing.ColorTranslator]::FromHtml("#FFF3D6")
  $ink   = [System.Drawing.ColorTranslator]::FromHtml("#2E5A24")
  $leg   = [System.Drawing.ColorTranslator]::FromHtml("#4E9A3C")
  $shell = [System.Drawing.ColorTranslator]::FromHtml("#7CC94E")
  $plate = [System.Drawing.ColorTranslator]::FromHtml("#A8E06E")

  # Arka plan: maskable'da tam kare, normalde yuvarlak köşe kart
  $g.Clear([System.Drawing.Color]::Transparent)
  $bg = New-Object System.Drawing.SolidBrush $paper
  if ($maskable) {
    $g.FillRectangle($bg, 0, 0, $size, $size)
  } else {
    $r = [int]($size * 0.22)
    $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
    $gp.AddArc(0, 0, $r*2, $r*2, 180, 90)
    $gp.AddArc($size-$r*2, 0, $r*2, $r*2, 270, 90)
    $gp.AddArc($size-$r*2, $size-$r*2, $r*2, $r*2, 0, 90)
    $gp.AddArc(0, $size-$r*2, $r*2, $r*2, 90, 90)
    $gp.CloseFigure()
    $g.FillPath($bg, $gp)
  }

  # Ölçek: maskable'da güvenli alan için küçült
  $s = if ($maskable) { $size * 0.62 } else { $size * 0.80 }
  $cx = $size / 2; $cy = $size / 2
  $u = $s / 100.0
  $pen = New-Object System.Drawing.Pen $ink, ([float]($u * 3.5))
  $legB = New-Object System.Drawing.SolidBrush $leg
  $shellB = New-Object System.Drawing.SolidBrush $shell
  $plateB = New-Object System.Drawing.SolidBrush $plate

  $ox = $cx - 50*$u; $oy = $cy - 50*$u
  function E($x,$y,$rx,$ry,$b) {
    $g.FillEllipse($b, [float]($ox+($x-$rx)*$u), [float]($oy+($y-$ry)*$u), [float](2*$rx*$u), [float](2*$ry*$u))
    $g.DrawEllipse($pen, [float]($ox+($x-$rx)*$u), [float]($oy+($y-$ry)*$u), [float](2*$rx*$u), [float](2*$ry*$u))
  }
  # Bacaklar + baş
  E 26 26 11 8 $legB
  E 26 74 11 8 $legB
  E 68 26 11 8 $legB
  E 68 74 11 8 $legB
  E 83 50 12 12 $legB
  # Gözler
  $eye = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#1F2A1A"))
  $g.FillEllipse($eye, [float]($ox+(87-2.6)*$u), [float]($oy+(46-2.6)*$u), [float](5.2*$u), [float](5.2*$u))
  $g.FillEllipse($eye, [float]($ox+(87-2.6)*$u), [float]($oy+(54-2.6)*$u), [float](5.2*$u), [float](5.2*$u))
  # Kabuk
  E 47 50 33 29 $shellB
  # Plakalar
  $pts = @(
    @(47,36),@(58,42),@(58,56),@(47,62),@(36,56),@(36,42)
  ) | ForEach-Object { New-Object System.Drawing.PointF ([float]($ox+$_[0]*$u)), ([float]($oy+$_[1]*$u)) }
  $g.FillPolygon($plateB, [System.Drawing.PointF[]]$pts)
  $pen2 = New-Object System.Drawing.Pen $ink, ([float]($u * 2))
  $g.DrawPolygon($pen2, [System.Drawing.PointF[]]$pts)
  foreach ($poly in @(
    @(@(26,44),@(34,40),@(36,48),@(30,56),@(24,52)),
    @(@(68,44),@(60,40),@(58,48),@(64,56),@(70,52)),
    @(@(40,26),@(48,30),@(44,36),@(36,36)),
    @(@(54,26),@(46,30),@(50,36),@(58,36)),
    @(@(40,74),@(48,70),@(44,64),@(36,64)),
    @(@(54,74),@(46,70),@(50,64),@(58,64))
  )) {
    $p = $poly | ForEach-Object { New-Object System.Drawing.PointF ([float]($ox+$_[0]*$u)), ([float]($oy+$_[1]*$u)) }
    $g.FillPolygon($plateB, [System.Drawing.PointF[]]$p)
    $g.DrawPolygon($pen2, [System.Drawing.PointF[]]$p)
  }

  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "yazıldı: $path"
}

Draw-Turtle 192 $false (Join-Path $outDir "icon-192.png")
Draw-Turtle 512 $false (Join-Path $outDir "icon-512.png")
Draw-Turtle 512 $true  (Join-Path $outDir "icon-512-maskable.png")
