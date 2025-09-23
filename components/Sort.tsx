"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortTypes } from "@/constants";
import { buildQueryParams } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const Sort = () => {
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (value: string) => {
    router.push(`${path}?${buildQueryParams(searchParams, "sort", value)}`);
  };

  return (
    <Select
      onValueChange={handleSort}
      defaultValue={searchParams.get("sort") || sortTypes[0].value}
    >
      <SelectTrigger className="sort-select">
        <SelectValue placeholder="Sort" />
      </SelectTrigger>
      <SelectContent className="sort-select-content">
        {sortTypes.map((sortType) => (
          <SelectItem
            key={sortType.label}
            value={sortType.value}
            className="shad-select-item"
          >
            {sortType.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Sort;
