import React, { useState } from "react";
import { Model } from "@esandstedt/stellaris-model";

import { Loader } from "./components/Loader";
import Svg from "./components/Svg";

import "./App.css";

function App() {
  const [model, setModel] = useState<Model>();
  const [svg, setSvg] = useState<{ download: () => void }>({
    download: () => {},
  });

  return (
    <div className="app container">
      <div className="header">
        <h1 className="header-title">Stellaris Map</h1>
        <div className="header-extra">
          {model && (
            <>
              <button onClick={() => svg.download()}>Download</button>
              <button onClick={() => setModel(undefined)}>Reset</button>
            </>
          )}
        </div>
      </div>
      {!model && (
        <div className="loader">
          <Loader onLoad={setModel} />
        </div>
      )}
      {model && <Svg model={model} setApi={setSvg} />}
    </div>
  );
}

export default App;
