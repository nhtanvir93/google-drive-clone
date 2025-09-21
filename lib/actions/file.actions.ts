"use server";

import { InputFile } from "node-appwrite/file";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { ID, Query, Models } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { File as FileDocument, User } from "@/types";
import { getCurrentUser } from "./user.actions";

interface UploadFilePayload {
  file: File;
  ownerId: string;
  sessionUserId: string;
  path: string;
}

interface RenameFilePayload {
  fileId: string;
  name: string;
  path: string;
}

interface ShareFilePayload {
  fileId: string;
  emails: string[];
  path: string;
}

interface DeletePayload {
  fileId: string;
  bucketFileId: string;
  path: string;
}

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

export const uploadFile = async ({
  file,
  ownerId,
  sessionUserId,
  path,
}: UploadFilePayload): Promise<FileDocument | undefined> => {
  const { databases, storage } = await createAdminClient();

  try {
    const inputFile = InputFile.fromBuffer(file, file.name);

    const bucketFile = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      inputFile,
    );

    const fileDocument = {
      name: bucketFile.name,
      extension: getFileType(bucketFile.name).extension,
      type: getFileType(bucketFile.name).type,
      url: constructFileUrl(bucketFile.$id),
      size: bucketFile.sizeOriginal,
      owner: ownerId,
      sessionUserId,
      users: [],
      bucketFileId: bucketFile.$id,
    };

    const newFile = await databases
      .createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesTableId,
        ID.unique(),
        fileDocument,
      )
      .catch(async (error: unknown) => {
        await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
        handleError(error, "Failed to create file document");
      });

    revalidatePath(path);

    return parseStringify(newFile);
  } catch (error: unknown) {
    handleError(error, "Failed to upload a file");
  }
};

const createQueries = (currentUser: User) => {
  const queries = [
    Query.select(["*", "owner.fullName"]),
    Query.or([
      Query.equal("owner", [currentUser.$id]),
      Query.contains("users", [currentUser.email]),
    ]),
  ];

  return queries;
};

export const getFiles = async (): Promise<
  Models.DocumentList<FileDocument> | undefined
> => {
  const { databases } = await createAdminClient();

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) throw new Error("User not found");

    const queries = createQueries(currentUser);
    const files = await databases.listDocuments<FileDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.filesTableId,
      queries,
    );

    return parseStringify(files);
  } catch (error: unknown) {
    handleError(error, "Failed to get files");
  }
};

export const renameFile = async ({ fileId, name, path }: RenameFilePayload) => {
  const { databases } = await createAdminClient();

  try {
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesTableId,
      fileId,
      {
        name,
      },
    );

    revalidatePath(path);
    return parseStringify(updatedFile);
  } catch (error: unknown) {
    handleError(error, "Failed to rename file");
  }
};

export const updateFileUsers = async ({
  fileId,
  emails,
  path,
}: ShareFilePayload) => {
  const { databases } = await createAdminClient();

  try {
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesTableId,
      fileId,
      {
        users: emails,
      },
    );

    revalidatePath(path);
    return parseStringify(updatedFile);
  } catch (error: unknown) {
    handleError(error, "Failed to update file users");
  }
};

export const deleteFile = async ({
  fileId,
  bucketFileId,
  path,
}: DeletePayload) => {
  const { databases, storage } = await createAdminClient();

  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesTableId,
      fileId,
    );

    await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);

    revalidatePath(path);

    return parseStringify({ status: "success" });
  } catch (error: unknown) {
    handleError(error, "Failed to delete file");
  }
};
