import Cliente from "@/components/Cliente/cliente";
import Menu from "@/components/MENU/menu";

export default function TestClientePage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Menu />

      {/* Contenido */}
      <main className="flex-1">
        <Cliente />
      </main>
    </div>
  );
}
