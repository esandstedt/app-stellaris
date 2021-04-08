import React from "react";

import { Model, load } from "@esandstedt/stellaris-model";

function LoadingIcon() {
  return (
    <img
      className="loading-icon"
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABK0lEQVRIS7WV/REBMRDFfypBBagAFaACSqACOkAFqIAOUAE6oBLmkZhcuA+R25n8cXPJvrcvuy8VSo5KyfkpAtAHekDTrCJn3ryzNneAFVDzqowCMAOmJvENWAAH4PyrpN/YjIG5STQxyX/NmyqRZNmbvwNgF5zZHPQruAJV4G/mlpgLoG7ZAtLcv9jgQlyANTCMyV6sXAB1SANohXRLWokuwD3lXoLl8SuIBZDIE1si2ckJuBhbSdxBjEu2Q7oBRr5Etk01C/VA4e0cvYc05qBZ9ok58gFCrUJyyHkVXWOMz488sxOrZY5cmeaY5u3uIekquz46A6huaQPaZ23lq3/lPTjqLJlfVkhzSaT34iOKvE7qLi2xlpUo1OeyFtl5pqUXAQjs2Nex0gEeDTQ6GVDVhMoAAAAASUVORK5CYII="
      alt=""
    />
  );
}

function ErrorIcon() {
  return (
    <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABqklEQVRIS82UX07CQBjEZ9vExLQGPIFt9clQxROIJ1BPoDfQGwA30BvgDfAE4gkglvik7XoCIdKYkHTXLGlxqds/oCT2rWk7v2++zg7Bmi+yZn38H8DE2q8TTW8Kx5xFbZM+D8q4L+Xg3apXN7SoD8CKRanhe/afAULnoAXwJid4FKKE4xggbcN/ahVBCh3E0wcAqkzjJ0JQY+QBwGjKdHubDkZ5kEKAPL356jWE2GTX7ZV1kQtIT7/1MuwJwMderVHWRS4gtN0OCC7AcW8E3pm8itB2uyA45eC3pj+8zlpTJuDTqltMi8TuoTHd3qQDGjouF/eG7xHVcxUkEyBNf2cE3qX4WAbM7r8dzt9JQ5SArOnSgDIulIAkJen9pgGzRDm1GwJyBaBr+N55oQMpIeMp0y055ypAnDQKoCLOSZK0BPTDwTIZT0TmZ4WjZwbe7DAqAXnTq35yIpLnYsFB6LiiIQ+zeka1oiIXc0Bcx32Avxn+MGnNoi5beB46NQqQHc6io6TOFYClNJUvKwFS5MShqqyIGXPwjlwdhW26Ikidot+KLdVFfwX7ApIf/xl1V8qTAAAAAElFTkSuQmCC"
      alt=""
    />
  );
}

interface Props {
  onLoad: (model: Model) => void;
}

interface State {
  error: Error | undefined;
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

  onReaderLoad = async (event: ProgressEvent) => {
    const result = (event.target as any).result;
    try {
      const model = await load(result);
      this.setState({ loading: false });
      this.props.onLoad(model);
    } catch (error) {
      this.setState({ loading: false, error });
      console.error(error);
    }
  };

  render() {
    const { error, loading } = this.state;

    return (
      <>
        <div style={{ display: "flex" }}>
          <input type="file" onChange={this.onChange} disabled={loading} />
          {loading && <LoadingIcon />}
        </div>
        {error && (
          <div style={{ marginTop: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "black",
              }}
            >
              <ErrorIcon />
              <span>
                Uh-oh! Something went wrong while trying to render the map.
                Here's the stack trace:
              </span>
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                fontSize: "10pt",
                borderLeft: "2px solid #f5222d",
                marginLeft: "11px",
                marginTop: "5px",
                padding: "5px 0 5px 12px",
              }}
            >
              {error.stack}
            </div>
          </div>
        )}
      </>
    );
  }
}
