import React from "react";

import { Model, load } from "@esandstedt/stellaris-model";
//import { FileInput, Spinner } from "@blueprintjs/core";

interface Props {
  onLoad: (model: Model) => void;
  disabled?: boolean;
}

interface State {
  error: string | undefined;
  loading: boolean;
}

export class Loader extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      error: undefined,
      loading: false,
    };
  }

  onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files !== null) {
      const file = files[0];
      console.log(file);

      if (file) {
        this.setState({ error: undefined, loading: true });

        const reader = new FileReader();
        reader.onload = this.onReaderLoad;
        reader.readAsBinaryString(file);
      }
    }
  };

  onReaderLoad = (event: ProgressEvent) => {
    const result = (event.target as any).result;
    load(result)
      .then((model) => {
        this.setState({ loading: false });
        this.props.onLoad(model);
      })
      .catch((error) => {
        this.setState({ loading: false, error });
        console.error(error);
      });
  };

  render() {
    const { disabled } = this.props;
    //const { error, loading } = this.state;

    return (
      <>
        <input type="file" onChange={this.onChange} disabled={disabled} />
        {/*
        {loading && <Spinner size={Spinner.SIZE_SMALL} tagName="span" />}
        {error && <div style={{ color: "maroon" }}>Something went wrong.</div>}
         */}
      </>
    );
  }
}
