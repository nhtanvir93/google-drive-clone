import { Models } from "node-appwrite";

declare type FileType = "document" | "image" | "video" | "audio" | "other";

export type User = {
  fullName: string;
  email: string;
  avatar: string;
  sessionUserId: string;
} & Models.Document;

export type File = {
  name: string;
  url: string;
  type: string;
  bucketFileId: string;
  extension: string;
  size: number;
  owner: User;
  users: string[];
} & Models.Document;
