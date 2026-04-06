import { QueryProvider } from '@/components/providers/QueryProvider';

function App() {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600">InvenTrack</h1>
          <p className="text-neutral-500 mt-2">Retail Inventory & POS Management</p>
          <p className="text-sm text-neutral-400 mt-4">F1 Foundation — Ready for F2</p>
        </div>
      </div>
    </QueryProvider>
  );
}

export default App;
