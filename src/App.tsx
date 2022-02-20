import React, { useState } from "react";
import { Model } from "@esandstedt/stellaris-model";

import { Loader } from "./components/Loader";
import { Renderer } from "./components/Renderer";

import "./App.css";
import "semantic-ui-css/semantic.min.css";

function App() {
  const [model, setModel] = useState<Model>();

  return (
    <div className="app">
      <div className="header">
        <h1>Stellaris Map Generator</h1>
      </div>
      {!model && (
        <div className="loader">
          <Loader onLoad={setModel} />
        </div>
      )}
      {model && <Renderer model={model} onClose={() => setModel(undefined)} />}
    </div>
  );
}

export default App;
