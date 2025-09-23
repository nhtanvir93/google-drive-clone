"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { File } from "@/types";
import { getFiles } from "@/lib/actions/file.actions";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";
import { buildQueryParams, buildQueryParamsWithoutKey } from "@/lib/utils";
import { useDebounce } from "use-debounce";

const Search = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const searchQuery = searchParams.get("query") || "";

  const [query, setQuery] = useState("");
  const [debounceQuery] = useDebounce(query, 300);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<File[]>([]);

  const setTimeoutId = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!searchQuery) {
      setQuery("");
    }
  }, [searchQuery]);

  useEffect(() => {
    const searchFiles = async () => {
      try {
        const files = await getFiles({ query: debounceQuery });
        setResults(files?.documents as File[]);
      } catch {
        setResults([]);
      } finally {
        setOpen(true);
      }
    };

    if (query.length > 0) searchFiles();
    else {
      setOpen(false);
      setResults([]);
      router.replace(
        `${path}?${buildQueryParamsWithoutKey(searchParams, "query")}`,
      );
    }
  }, [debounceQuery]);

  const handleClickItem = (file: File) => {
    const type = ["video", "audio"].includes(file.type)
      ? "media"
      : file.type + "s";

    setOpen(false);
    setResults([]);
    router.push(`/${type}?${buildQueryParams(searchParams, "query", query)}`);
  };

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <Image
          src="/assets/icons/search.svg"
          alt="search"
          width={24}
          height={24}
        />
        <Input
          value={query as string}
          placeholder="Search..."
          className="search-input"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
        />

        {open && (
          <ul className="search-result">
            {results.length > 0 ? (
              results.map((file) => (
                <li
                  key={file.$id}
                  onClick={() => handleClickItem(file)}
                  className="flex items-center justify-between"
                >
                  <div className="flex cursor-pointer items-center gap-4">
                    <Thumbnail
                      type={file.type}
                      extension={file.extension}
                      url={file.url}
                      className="size-9 min-w-9"
                    />
                    <p className="subtitle-2 line-clamp-1 text-light-100">
                      {file.name}
                    </p>
                  </div>
                  <FormattedDateTime
                    date={file.$createdAt}
                    className="caption line-clamp-1 text-light-200"
                  />
                </li>
              ))
            ) : (
              <p className="empty-result">No file found</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;
