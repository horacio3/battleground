import { useConversationStore } from "@/stores/conversation-store";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { PlusIcon, FolderIcon, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export function ConversationSwitcher() {
  const {
    conversationGroups,
    activeConversationId,
    addConversationGroup,
    setActiveConversationId,
    removeConversationGroup,
    updateConversationGroup,
  } = useConversationStore();

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const activeConversation = conversationGroups.find((group) => group.id === activeConversationId);

  const handleCreateOrUpdate = () => {
    if (editMode && editId) {
      updateConversationGroup(editId, newName, newDescription);
    } else {
      addConversationGroup(newName, newDescription);
    }
    setOpen(false);
    resetForm();
  };

  const startEdit = (id: string, name: string, description?: string) => {
    setEditMode(true);
    setEditId(id);
    setNewName(name);
    setNewDescription(description || "");
    setOpen(true);
  };

  const resetForm = () => {
    setNewName("");
    setNewDescription("");
    setEditMode(false);
    setEditId(null);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <FolderIcon className="h-4 w-4" />
            <span className="max-w-[150px] truncate">
              {activeConversation?.name || "Select Conversation"}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[220px]">
          {conversationGroups.map((group) => (
            <DropdownMenuItem
              key={group.id}
              className="flex justify-between"
              onSelect={() => setActiveConversationId(group.id)}
            >
              <span className="truncate">{group.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1"
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(group.id, group.name, group.description);
                }}
              >
                Edit
              </Button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <PlusIcon className="mr-2 h-4 w-4" />
                New Conversation
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editMode ? "Edit Conversation" : "New Conversation"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="My Project"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="What's this conversation about?"
                  />
                </div>
              </div>
              <DialogFooter>
                {editMode && conversationGroups.length > 1 && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (editId) {
                        removeConversationGroup(editId);
                      }
                      setOpen(false);
                      resetForm();
                    }}
                    className="mr-auto"
                  >
                    Delete
                  </Button>
                )}
                <Button variant="outline" onClick={() => {
                  setOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrUpdate} disabled={!newName.trim()}>
                  {editMode ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}