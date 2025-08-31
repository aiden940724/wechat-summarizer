import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import BatchSummarize from './pages/BatchSummarize';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/batch-summarize" replace />} />
        <Route path="/batch-summarize" element={<BatchSummarize />} />
      </Routes>
    </Layout>
  );
}

export default App;
