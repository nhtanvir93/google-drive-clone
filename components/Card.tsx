import { File } from "@/types";
import React from "react";

interface Props {
  file: File;
}

const Card = ({ file }: Props) => {
  return <div>{file.name}</div>;
};

export default Card;
