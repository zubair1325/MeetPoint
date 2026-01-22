import { BrowserRouter, Routes, Route, Router } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import Authorization from "./pages/Authorization";
import { AuthProvider } from "./contexts/AuthContext";
import VideoMeet from "./pages/VideoMeet";
import HomeComponent from "./pages/home";
import History from "./pages/history";

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />}></Route>
            <Route path="/auth" element={<Authorization />}></Route>
            <Route path="/home" s element={<HomeComponent />} />
            <Route path="/:url" s element={<VideoMeet />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;



