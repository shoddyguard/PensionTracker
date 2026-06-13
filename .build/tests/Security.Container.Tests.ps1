#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
<#
.SYNOPSIS
    Security tests for the PensionTracker container.
#>

Describe 'PensionTracker container security' {
    BeforeAll {
        $script:ContainerName = 'PensionTracker-sec-pester-' + (Get-Random -Maximum 99999)
        & docker run -d --name $script:ContainerName "$($Global:BrownserveRepoDockerImageName):latest" | Out-Null
        Start-Sleep -Seconds 3
    }
    AfterAll {
        & docker stop $script:ContainerName 2>&1 | Out-Null
        & docker rm $script:ContainerName 2>&1 | Out-Null
    }
    It 'Container runs as a non-root user' {
        $User = & docker exec $script:ContainerName whoami
        $User.Trim() | Should -Not -Be 'root'
    }
}
