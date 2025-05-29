"use client";

import { useProjectStore } from "@/stores/project-store";
import { useChatStore } from "@/stores/chat-store";
import { useState } from "react";
import { Button } from "./ui/button";
import { PlusIcon, Edit2Icon, TrashIcon, FolderIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";

export const ProjectSelector = () => {
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const addProject = useProjectStore((state) => state.addProject);
  const renameProject = useProjectStore((state) => state.renameProject);
  const removeProject = useProjectStore((state) => state.removeProject);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const addChatToProject = useProjectStore((state) => state.addChatToProject);
  
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectToRename, setProjectToRename] = useState<string | null>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);
  
  const handleCreateProject = () => {
    if (projectName.trim()) {
      // Disable rapid creation of multiple projects
      const trimmedName = projectName.trim();
      setProjectName("");
      setIsNewProjectDialogOpen(false);
      
      // Small delay to ensure UI updates before creating the project
      setTimeout(() => {
        addProject(trimmedName);
      }, 50);
    }
  };
  
  const handleRenameProject = () => {
    if (projectToRename && projectName.trim()) {
      renameProject(projectToRename, projectName.trim());
      setProjectName("");
      setProjectToRename(null);
      setIsRenameDialogOpen(false);
    }
  };
  
  const openRenameDialog = (id: string, currentName: string) => {
    setProjectToRename(id);
    setProjectName(currentName);
    setIsRenameDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FolderIcon className="h-4 w-4" />
              {activeProject ? activeProject.name : "Select Project"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                className="flex items-center justify-between"
                onClick={() => {
                  setActiveProject(project.id);
                  // If project has no chats, create one
                  if (project.chatIds.length === 0) {
                    const newChatId = useChatStore.getState().addChat();
                    addChatToProject(project.id, newChatId);
                  }
                }}
              >
                <span>{project.name}</span>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRenameDialog(project.id, project.name);
                    }}
                  >
                    <Edit2Icon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProject(project.id);
                    }}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
            {projects.length === 0 && (
              <DropdownMenuItem disabled>No projects</DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setIsNewProjectDialogOpen(true)}
              className="border-t mt-1 pt-1"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsNewProjectDialogOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* New Project Dialog */}
      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateProject();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Project Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameProject();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameProject}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};