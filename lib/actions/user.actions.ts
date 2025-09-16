"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, Models, ID } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { avatarPlaceholderUrl } from "@/constants";
import { redirect } from "next/navigation";

interface SignUpPayload {
  fullName: string;
  email: string;
}

interface OTPPayload {
  sessionUserId: string;
  otp: string;
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

export const sendEmailOTP = async (email: string) => {
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
}: SignUpPayload): Promise<{ sessionUserId: string }> {
  const existingUser = await getUserByEmail(email);

  const sessionUserId = await sendEmailOTP(email);
  if (!sessionUserId) throw new Error("Failed to send email OTP");

  if (!existingUser) {
    const { databases } = await createAdminClient();
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersTableId,
      ID.unique(),
      {
        fullName,
        email,
        avatar: avatarPlaceholderUrl,
        sessionUserId,
      },
    );
  }

  return parseStringify({ sessionUserId });
}

export const verifyEmailOTP = async ({
  sessionUserId,
  otp,
}: OTPPayload): Promise<{ sessionId: string } | undefined> => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createSession(sessionUserId, otp);
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    return parseStringify({ sessionId: session.$id });
  } catch (error: unknown) {
    handleError(error, "Failed to verify OTP");
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { account, databases } = await createSessionClient();

    const result = await account.get();
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersTableId,
      [Query.equal("sessionUserId", [result.$id])],
    );

    if (users.total <= 0) return null;
    return parseStringify(users.documents[0]);
  } catch (error: unknown) {
    console.error("Failed to fetch logged-in user", error);
    return null;
  }
};

export const signOutUser = async () => {
  const { account } = await createSessionClient();

  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error: unknown) {
    handleError(error, "Failed to sign out user");
  } finally {
    redirect("/sign-in");
  }
};
