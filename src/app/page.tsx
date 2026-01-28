import Canvas from '@/components/label-designer/Canvas';
import Header from '@/components/label-designer/Header';
import PropertiesPanel from '@/components/label-designer/PropertiesPanel';
import Sidebar from '@/components/label-designer/Sidebar';
import RightPanel from '@/components/label-designer/RightPanel';

export default function Home() {
  return (
    <main className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <RightPanel />
      </div>
    </main>
  );
}