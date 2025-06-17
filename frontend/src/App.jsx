// src/App.jsx
import NutritionPage from "./pages/NutritionPage";

function App() {
  return (
    <div className="min-h-screen bg-black flex justify-center items-start py-8">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden">
        <NutritionPage />
      </div>
    </div>
  );
}

export default App;
