import { Compiler } from "@/model/Compiler";
import { Model } from "@/model/Model";
import { useState } from "react";

interface Props {
  onLoad: (model: Model) => void;
}

export const ModelLoader: React.FC<Props> = (props) => {
  const [error, setError] = useState<boolean>(false);

  const onFileReaderLoad = async (event: ProgressEvent) => {
    const data = (event.target as any).result;
    try {
      setError(false);
      const model = await new Compiler().load(data);
      console.log(model);
      props.onLoad(model);
    } catch (error: any) {
      console.error(error);
      setError(true);
    }
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files !== null) {
      const reader = new FileReader();
      reader.onload = onFileReaderLoad;
      reader.readAsBinaryString(files[0]);
    }
  };

  return (
    <div className="p-4 border border-slate-400 rounded">
      <input type="file" multiple={false} onChange={onInputChange} />
      {error && (
        <div className="text-red-500">Uh-oh, something went wrong!</div>
      )}
    </div>
  );
};
