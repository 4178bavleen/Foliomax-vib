param(
    [Parameter(Mandatory=$true)][string]$InputFile,
    [Parameter(Mandatory=$true)][string]$OutputFile
)

try {
    $pptApp = New-Object -ComObject PowerPoint.Application
    # Open presentation hidden / read-only: (Path, ReadOnly, Untitled, WithWindow)
    $pres = $pptApp.Presentations.Open($InputFile, 1, 0, 0)
    # Format 32 is ppSaveAsPDF
    $pres.SaveAs($OutputFile, 32)
    $pres.Close()
    $pptApp.Quit()
    Write-Host "CONVERT_SUCCESS: $OutputFile"
    exit 0
} catch {
    Write-Error "CONVERT_ERROR: $($_.Exception.Message)"
    if ($pptApp) {
        try { $pptApp.Quit() } catch {}
    }
    exit 1
}
