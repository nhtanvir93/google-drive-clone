"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { actionsDropdownItems } from "@/constants";
import { constructDownloadUrl } from "@/lib/utils";
import { File, User } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  deleteFile,
  renameFile,
  updateFileUsers,
} from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { FileDetails, ShareInput } from "./ActionsModalContent";

interface Props {
  file: File;
  loggedInUser: User;
}

interface ActionType {
  label: string;
  icon: string;
  value: string;
}

const ActionDropdown = ({ file, loggedInUser }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>(file.users);

  const path = usePathname();

  useEffect(() => {
    setName(file.name);
    setEmails(file.users);
  }, [file]);

  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
    setName(file.name);
  };

  const handleAction = async () => {
    if (!action) return;

    setIsLoading(true);

    const actions = {
      rename: async () => {
        await renameFile({
          fileId: file.$id,
          name,
          path,
        });
      },
      share: async () => {
        await updateFileUsers({ fileId: file.$id, emails, path });
      },
      delete: async () => {
        await deleteFile({
          fileId: file.$id,
          bucketFileId: file.bucketFileId,
          path,
        });
      },
    };

    try {
      await actions[action.value as keyof typeof actions]();
      closeAllModals();
    } catch (error: unknown) {
      console.log(`Error : ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSameEmails = (emails: string[]): string[] => {
    const totalEmails = emails.length;
    const sortedEmails = emails.sort();

    const distinctEmails = [];

    for (let i = 0; i < totalEmails; i++) {
      const length = sortedEmails[i].length;

      if (
        i + 1 < totalEmails &&
        sortedEmails[i] === sortedEmails[i + 1].slice(0, length)
      )
        continue;

      distinctEmails.push(sortedEmails[i]);
    }

    return distinctEmails;
  };

  const handleRemoveUser = async (removingEmail: string) => {
    const updatedEmails = emails.filter((email) => email !== removingEmail);

    try {
      await updateFileUsers({ fileId: file.$id, emails: updatedEmails, path });
      closeAllModals();
    } catch {
      console.log("Failed to share file with users, please try again.");
    }
  };

  const renderDialogContent = () => {
    if (!action) return null;

    const { label, value } = action;

    return (
      <DialogContent className="shad-dialog button">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-light-100">
            {label}
          </DialogTitle>
          {value === "rename" && (
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          {value === "details" && <FileDetails file={file} />}
          {value === "share" && (
            <ShareInput
              file={file}
              onInputChange={(newEmails: string[]) => {
                setEmails((oldEmails) =>
                  filterSameEmails([...newEmails, ...oldEmails]),
                );
              }}
              onRemove={handleRemoveUser}
            />
          )}
          {value === "delete" && (
            <p className="delete-confirmation">
              Are you sure you want to delete{` `}
              <span className="delete-file-name">{file.name}</span>
            </p>
          )}
        </DialogHeader>
        {["rename", "delete", "share"].includes(value) && (
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button className="modal-cancel-button" onClick={closeAllModals}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              className="modal-submit-button"
              disabled={isLoading}
            >
              <p className="capitalize">{value}</p>
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  };

  const handleActionClick = (actionItem: ActionType) => {
    setAction(actionItem);

    if (["rename", "share", "details", "delete"].includes(actionItem.value)) {
      setIsModalOpen(true);
    }
  };

  const hasActionPermission = (action: string) => {
    const ownerActions = ["rename", "share", "delete"];

    return (
      !ownerActions.includes(action) ||
      (ownerActions.includes(action) && loggedInUser.$id === file.owner.$id)
    );
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image
            src="/assets/icons/dots.svg"
            alt="dots"
            width={34}
            height={34}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-[200px] truncate">
            {file.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actionsDropdownItems.map(
            (actionItem: ActionType) =>
              hasActionPermission(actionItem.value) && (
                <DropdownMenuItem
                  key={actionItem.value}
                  className="shad-dropdown-item"
                  onClick={() => handleActionClick(actionItem)}
                >
                  {actionItem.value === "download" ? (
                    <Link
                      href={constructDownloadUrl(file.bucketFileId)}
                      download={file.name}
                      className="flex items-center gap-2"
                    >
                      <Image
                        src={actionItem.icon}
                        alt={actionItem.value}
                        width={30}
                        height={30}
                      />
                      {actionItem.label}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Image
                        src={actionItem.icon}
                        alt={actionItem.label}
                        width={30}
                        height={30}
                      />
                      {actionItem.label}
                    </div>
                  )}
                </DropdownMenuItem>
              ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {renderDialogContent()}
    </Dialog>
  );
};

export default ActionDropdown;
