import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import AIAssistant from './AIAssistant';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
      <AIAssistant />
    </div>
  );
}
