"use client";

import React, { useState } from "react";
import { ModelLoader } from "@/components/ModelLoader";
import { Model } from "@/model/Model";
import { Map } from "@/components/Map";
import { useWindowSize } from "@react-hook/window-size";

export default function Home() {
  const [model, setModel] = useState<Model | null>(null);
  const [width, height] = useWindowSize();
  if (model === null) {
    return (
      <div className="container mx-auto flex flex-col">
        <div className="text-2xl font-bold text-center mt-8 mb-4">
          Stellaris Map Generator
        </div>
        <div className="flex justify-center">
          <ModelLoader onLoad={(model) => setModel(model)} />
        </div>
      </div>
    );
  } else {
    return <Map model={model} width={width} height={height} />;
  }
}
