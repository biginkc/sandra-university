"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createRoleGroup,
  deleteRoleGroup,
  updateRoleGroup,
} from "./actions";

type RoleGroupRow = {
  id: string;
  name: string;
  description: string | null;
};

export function RoleGroupsEditor({ initial }: { initial: RoleGroupRow[] }) {
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  function onAdd() {
    const name = newName.trim();
    if (!name) {
      toast.error("Name is required.");
      return;
    }
    startTransition(async () => {
      const result = await createRoleGroup({
        name,
        description: newDesc.trim() || null,
      });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Role group added.");
        setNewName("");
        setNewDesc("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {initial.length === 0 ? (
        <p className="text-muted-foreground text-sm">No role groups yet.</p>
      ) : (
        <ul className="divide-border divide-y">
          {initial.map((g) => (
            <RoleGroupRow
              key={g.id}
              group={g}
              pending={pending}
              startTransition={startTransition}
            />
          ))}
        </ul>
      )}

      <div className="border-border border-t pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide">
          Add a role group
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Phone Setters"
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="new-desc">Description (optional)</Label>
            <Input
              id="new-desc"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={onAdd} disabled={pending}>
            {pending ? "..." : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RoleGroupRow({
  group,
  pending,
  startTransition,
}: {
  group: RoleGroupRow;
  pending: boolean;
  startTransition: (cb: () => void | Promise<void>) => void;
}) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");

  function onSave() {
    if (name === group.name && description === (group.description ?? "")) return;
    startTransition(async () => {
      const result = await updateRoleGroup({
        id: group.id,
        name,
        description: description.trim() || null,
      });
      if (!result.ok) toast.error(result.error);
      else toast.success("Saved.");
    });
  }

  function onDelete() {
    if (!confirm(`Delete "${group.name}"? Learner assignments and access grants for this group go with it.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteRoleGroup(group.id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Role group removed.");
    });
  }

  return (
    <li className="flex flex-col gap-2 py-3 md:flex-row md:items-center first:pt-0 last:pb-0">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={onSave}
        className="md:max-w-xs"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={onSave}
        placeholder="Description"
        className="flex-1"
      />
      <Button
        variant="outline"
        size="icon-sm"
        disabled={pending}
        onClick={onDelete}
        aria-label="Delete role group"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}
