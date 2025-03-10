<script lang="ts">
    import { onMount } from 'svelte';
    import { FileOperationsDialog } from '../';
    import { adapters } from '../';
    import { logger } from '$lib/components/LogControlPanel/logger';
    import type { ProjectData } from '../adapters/ProjectAdapter';
    
    // Extract project adapter functions and types
    const { 
        PROJECT_FILE_TYPE, 
        projectFileConfig, 
        saveProject, 
        loadProject, 
        deleteProject,
        createNewProject
    } = adapters;
    
    // Project state
    let currentProject: ProjectData = createNewProject('New Project');
    let currentFilename = '';
    let displayFilename = '';
    let isLoading = false;
    let isDirty = false;
    
    // File operations dialog state
    let showFileDialog = false;
    let fileDialogMode: 'save' | 'load' | 'delete' = 'save';
    
    // Create a new project
    function handleNewProject(): void {
        if (isDirty) {
            // In a real app, you would show a confirmation dialog
            if (!confirm('You have unsaved changes. Are you sure you want to create a new project?')) {
                return;
            }
        }
        
        currentProject = createNewProject('New Project');
        currentFilename = '';
        displayFilename = '';
        isDirty = false;
        
        logger('INFO', 'ui', 'ProjectComponent', 'Created new project');
    }
    
    // File operations functions
    function openSaveDialog(): void {
        fileDialogMode = 'save';
        showFileDialog = true;
    }
    
    function openLoadDialog(): void {
        if (isDirty) {
            // In a real app, you would show a confirmation dialog
            if (!confirm('You have unsaved changes. Are you sure you want to load another project?')) {
                return;
            }
        }
        
        fileDialogMode = 'load';
        showFileDialog = true;
    }
    
    function openDeleteDialog(): void {
        fileDialogMode = 'delete';
        showFileDialog = true;
    }
    
    async function handleFileOperation(event: CustomEvent): Promise<void> {
        const { filename, mode } = event.detail;
        
        try {
            isLoading = true;
            
            if (mode === 'save') {
                await saveProject(filename, currentProject);
                currentFilename = filename;
                displayFilename = getDisplayName(filename);
                isDirty = false;
                logger('INFO', 'ui', 'ProjectComponent', `Project saved to ${filename}`);
            } else if (mode === 'load') {
                const projectData = await loadProject(filename);
                currentProject = projectData;
                currentFilename = filename;
                displayFilename = getDisplayName(filename);
                isDirty = false;
                logger('INFO', 'ui', 'ProjectComponent', `Project loaded from ${filename}`);
            } else if (mode === 'delete') {
                await deleteProject(filename);
                
                // If we deleted the current project, create a new one
                if (filename === currentFilename) {
                    handleNewProject();
                }
                
                logger('INFO', 'ui', 'ProjectComponent', `Project deleted: ${filename}`);
            }
        } catch (error) {
            logger('ERROR', 'ui', 'ProjectComponent', `File operation failed: ${error}`);
            alert(`Operation failed: ${error}`);
        } finally {
            isLoading = false;
        }
    }
    
    // Helper function to get a display name from a filename
    function getDisplayName(filename: string): string {
        // Remove path and extension
        const parts = filename.split('/');
        const name = parts[parts.length - 1];
        return name.replace(/\.project\.json$/, '');
    }
    
    // Mark project as dirty when fields change
    function handleProjectChange(): void {
        isDirty = true;
    }
</script>

<div class="flex flex-col h-full border border-gray-300 rounded-lg overflow-hidden bg-white">
    <div class="flex justify-between items-center p-2 border-b border-gray-300 bg-gray-100">
        <div class="flex items-center">
            <h2 class="text-lg font-semibold mr-3">
                {#if displayFilename}
                    {displayFilename}{isDirty ? '*' : ''}
                {:else}
                    New Project{isDirty ? '*' : ''}
                {/if}
            </h2>
            <button 
                on:click={handleNewProject}
                class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative"
                title="New Project"
            >
                <span class="material-symbols-outlined text-base">note_add</span>
                <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    New Project
                </span>
            </button>
            
            <!-- File operation buttons -->
            <div class="flex ml-2">
                <!-- Save button -->
                <button 
                    on:click={openSaveDialog}
                    class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative ml-1"
                    title="Save Project"
                    disabled={isLoading}
                >
                    <span class="material-symbols-outlined text-base">save</span>
                    <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Save Project
                    </span>
                </button>
                
                <!-- Load button -->
                <button 
                    on:click={openLoadDialog}
                    class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative ml-1"
                    title="Load Project"
                    disabled={isLoading}
                >
                    <span class="material-symbols-outlined text-base">folder_open</span>
                    <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Load Project
                    </span>
                </button>
                
                <!-- Delete button -->
                <button 
                    on:click={openDeleteDialog}
                    class="p-1.5 text-sm bg-gray-100 rounded hover:bg-gray-300 transition-colors flex items-center group relative ml-1"
                    title="Delete Project"
                    disabled={isLoading || !currentFilename}
                >
                    <span class="material-symbols-outlined text-base">delete</span>
                    <span class="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Delete Project
                    </span>
                </button>
            </div>
        </div>
        <div class="flex items-center">
            <!-- Loading indicator -->
            {#if isLoading}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            {/if}
        </div>
    </div>
    
    <!-- Project editor -->
    <div class="flex-1 overflow-y-auto p-4">
        <div class="mb-4">
            <label for="projectName" class="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input 
                type="text" 
                id="projectName" 
                bind:value={currentProject.name} 
                on:input={handleProjectChange}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        
        <div class="mb-4">
            <label for="projectDescription" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
                id="projectDescription" 
                bind:value={currentProject.description} 
                on:input={handleProjectChange}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            ></textarea>
        </div>
        
        <div class="mb-4">
            <label for="projectTheme" class="block text-sm font-medium text-gray-700 mb-1">Theme</label>
            <select 
                id="projectTheme" 
                bind:value={currentProject.settings.theme} 
                on:change={handleProjectChange}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
            </select>
        </div>
        
        <div class="mb-4">
            <label for="projectLayout" class="block text-sm font-medium text-gray-700 mb-1">Layout</label>
            <select 
                id="projectLayout" 
                bind:value={currentProject.settings.layout} 
                on:change={handleProjectChange}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="default">Default</option>
                <option value="compact">Compact</option>
                <option value="expanded">Expanded</option>
            </select>
        </div>
        
        <div class="text-sm text-gray-500">
            <p>Created: {new Date(currentProject.created).toLocaleString()}</p>
            <p>Modified: {new Date(currentProject.modified).toLocaleString()}</p>
        </div>
    </div>
    
    <!-- File operations dialog using the project adapter -->
    <FileOperationsDialog 
        bind:isOpen={showFileDialog}
        bind:mode={fileDialogMode}
        currentFilename={currentFilename}
        fileType={PROJECT_FILE_TYPE}
        config={projectFileConfig}
        on:submit={handleFileOperation}
    />
</div> 