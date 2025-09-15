"use server";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, Models, ID } from "node-appwrite";
import { parseStringify } from "@/lib/utils";

interface SignUpPayload {
  fullName: string;
  email: string;
}

export type User = {
  fullName: string;
  email: string;
  avatar: string;
} & Models.Document;

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  const result = await databases.listDocuments<User>(
    appwriteConfig.databaseId,
    appwriteConfig.usersTableId,
    [Query.equal("email", [email])],
  );

  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

const sendEmailOTP = async (email: string) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
};

export async function createAccount({
  fullName,
  email,
}: SignUpPayload): Promise<{ accountId: string }> {
  const existingUser = await getUserByEmail(email);
  const accountId = await sendEmailOTP(email);

  if (!accountId) throw new Error("Failed to send email OTP");

  if (!existingUser) {
    const { databases } = await createAdminClient();
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersTableId,
      ID.unique(),
      {
        fullName,
        email,
        avatar:
          "https://static.vecteezy.com/system/resources/thumbnails/036/594/092/small_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg",
      },
    );
  }

  return parseStringify({ accountId });
}
