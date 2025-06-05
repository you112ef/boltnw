// app/lib/llamaLocal.js
let wasmModule = null;
let modelInstance = null;

export async function loadWasm() {
  if (wasmModule) return wasmModule;
  // Ensure this path is correct based on your project structure.
  // It assumes 'public' is a sibling of 'app' or accessible from the root.
  const llamaModulePath = '/llama-wasm/llama.js';
  wasmModule = await import(/* @vite-ignore */ llamaModulePath);
  return wasmModule;
}

export async function loadModel(buffer) {
  const wasm = await loadWasm();
  if (modelInstance) {
    modelInstance.free();
    modelInstance = null;
  }
  // This is a placeholder for actual model loading logic with the wasm module.
  // You'll need to replace wasm.loadModel with the correct function from your llama.js WASM bindings.
  modelInstance = await wasm.loadModel(buffer);
  return modelInstance;
}

export async function runModel(prompt) {
  if (!modelInstance) throw new Error("النموذج غير محمل");
  // This is a placeholder for actual model running logic.
  // Replace modelInstance.run with the correct function from your llama.js WASM bindings.
  const output = await modelInstance.run(prompt);
  return output;
}

export function freeModel() {
  if (modelInstance) {
    modelInstance.free();
    modelInstance = null;
  }
}
