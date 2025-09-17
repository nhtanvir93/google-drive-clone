"use client";

import React, { MouseEvent, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import Image from "next/image";
import { convertFileToUrl, getFileType } from "@/lib/utils";
import Thumbnail from "./Thumbnail";
import { MAX_FILE_SIZE } from "@/constants";
import { toast } from "sonner";
import { uploadFile } from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";

interface Props {
  ownerId: string;
  sessionUserId: string;
}

const FileUploader = ({ ownerId, sessionUserId }: Props) => {
  const [files, setFiles] = useState<File[]>([]);

  const path = usePathname();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setFiles((prev: File[]) => [...prev, ...acceptedFiles]);

      const uploadPromises = acceptedFiles.map(async (file) => {
        if (file.size > MAX_FILE_SIZE) {
          setFiles((prevFiles: File[]) =>
            prevFiles.filter((f) => f.name !== file.name),
          );

          return toast("", {
            description: (
              <p className="body-2 text-white">
                <span className="font-semibold">{file.name}</span> is too large.
                Max file size is 50MB.
              </p>
            ),
            className: "error-toast",
          });
        }

        return uploadFile({ file, ownerId, sessionUserId, path }).then(
          (uploadFile) => {
            if (uploadFile) {
              setFiles((prevFiles: File[]) =>
                prevFiles.filter((f) => f.name !== file.name),
              );
            }
          },
        );
      });

      await Promise.all(uploadPromises);
    },
    [ownerId, sessionUserId, path],
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleRemove = (e: MouseEvent<HTMLImageElement>, fileName: string) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  return (
    <div {...getRootProps()} className="cursor-pointer">
      <input {...getInputProps()} />
      <Button type="button" className="uploader-button">
        <Image
          src="/assets/icons/upload.svg"
          alt="upload"
          width={24}
          height={24}
        />
        <p>Upload</p>
      </Button>
      {files.length > 0 && (
        <div className="uploader-preview-list">
          <h4 className="h4 text-light-100">Uploading</h4>
          <ul>
            {files.map((file, index) => {
              const { type, extension } = getFileType(file.name);
              return (
                <li
                  key={`${file.name}-${index}`}
                  className="uploader-preview-item"
                >
                  <div className="flex items-center gap-3">
                    <Thumbnail
                      type={type}
                      extension={extension}
                      url={convertFileToUrl(file)}
                    />
                    <div className="preview-item-name">
                      <span className="inline-block h-[20px] overflow-hidden">
                        {file.name}
                      </span>
                      <Image
                        src="/assets/icons/file-loader.gif"
                        width={80}
                        height={26}
                        alt="loader"
                      />
                    </div>
                    <Image
                      src="/assets/icons/remove.svg"
                      width={24}
                      height={24}
                      alt="remove"
                      onClick={(e) => handleRemove(e, file.name)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
