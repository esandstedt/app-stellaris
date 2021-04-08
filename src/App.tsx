import React, { useState } from "react";
import { Model } from "@esandstedt/stellaris-model";

import { Loader } from "./components/Loader";
import Svg from "./components/Svg";

import "./App.css";

const WIDTH = (() => {
  if (typeof window !== "undefined") {
    return Math.min(1200, window.innerWidth - 20);
  } else {
    return 1200;
  }
})();

function App() {
  const [model, setModel] = useState<Model>();

  return (
    <div className="app container">
      <div className="header">
        <h1 className="header-title">Stellaris Map</h1>
        <div className="header-extra">
          {model && (
            <>
              <button onClick={() => alert("not implemented")}>Download</button>
              <button onClick={() => setModel(undefined)}>Reset</button>
            </>
          )}
        </div>
      </div>
      {!model && (
        <div className="loader-wrapper">
          <Loader onLoad={setModel} />
        </div>
      )}
      {model && <Svg model={model} width={WIDTH} height={WIDTH} />}
    </div>
  );
}

export default App;
