import { Routes, Route, Navigate } from 'react-router-dom';
import AdminView from './views/Admin/AdminView.jsx';
import TVView from './views/TV/TVView.jsx';
import PlayView from './views/Play/PlayView.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminView />} />
      <Route path="/tv" element={<TVView />} />
      <Route path="/play" element={<PlayView />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
