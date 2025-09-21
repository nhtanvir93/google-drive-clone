import Card from "@/components/Card";
import Sort from "@/components/Sort";
import { getFiles } from "@/lib/actions/file.actions";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { File, User } from "@/types";

interface Props {
  params: { type: string };
}

const FileList = async ({ params }: Props) => {
  const type = (await params).type;
  const files = await getFiles();
  const loggedInUser = await getCurrentUser();

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1 capitalize">{type}</h1>

        <div className="total-size-section">
          <p className="body-1">
            Total: <span className="h5">0 MB</span>
          </p>
          <div className="sort-container">
            <p className="body-1 hidden text-light-200 sm:block">Sort By:</p>
            <Sort />
          </div>
        </div>
      </section>
      {files?.total && files.total > 0 ? (
        <section className="file-list">
          {files.documents.map((file: File) => (
            <h1 key={file.$id} className="h1">
              <Card
                key={file.$id}
                file={file}
                loggedInUser={loggedInUser as User}
              />
            </h1>
          ))}
        </section>
      ) : (
        <p className="empty-list">No files uploaded</p>
      )}
    </div>
  );
};

export default FileList;
