#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
<#
.SYNOPSIS
    HTTP response tests for PensionTracker.
#>

Describe 'PensionTracker HTTP responses' {
    BeforeAll {
        $script:ContainerName = 'PensionTracker-http-pester-' + (Get-Random -Maximum 99999)
        & docker run -d --name $script:ContainerName -p 3000 `
            -e AUTH_SECRET='test-pester-secret' `
            "$($Global:BrownserveRepoDockerImageName):latest" | Out-Null

        # Retrieve the dynamically assigned host port
        $script:HostPort = (& docker port $script:ContainerName 3000).Split(':')[-1].Trim()

        # Poll until the app responds or timeout
        $script:AppReady = $false
        $Deadline = (Get-Date).AddSeconds(30)
        while ((Get-Date) -lt $Deadline) {
            try {
                $null = Invoke-WebRequest -Uri "http://localhost:$($script:HostPort)/" `
                    -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
                $script:AppReady = $true
                break
            }
            catch {
                if ($null -ne $_.Exception.Response) {
                    $script:AppReady = $true
                    break
                }
                Start-Sleep -Seconds 2
            }
        }
    }
    AfterAll {
        & docker stop $script:ContainerName 2>&1 | Out-Null
        & docker rm $script:ContainerName 2>&1 | Out-Null
    }
    It 'App is ready and responding on port 3000' {
        $script:AppReady | Should -Be $true
    }
    It 'Root path returns a successful or redirect response' {
        $Response = Invoke-WebRequest -Uri "http://localhost:$($script:HostPort)/" `
            -UseBasicParsing -MaximumRedirection 5
        $Response.StatusCode | Should -BeLessOrEqual 399
    }
    It 'Unauthenticated access to /pensions redirects to login or setup' {
        $Response = Invoke-WebRequest -Uri "http://localhost:$($script:HostPort)/pensions" `
            -UseBasicParsing -MaximumRedirection 5
        $Response.BaseResponse.RequestMessage.RequestUri.LocalPath | Should -BeIn @('/login', '/setup')
    }
}
