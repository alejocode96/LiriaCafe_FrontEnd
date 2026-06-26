import { Outlet } from "react-router-dom";
// import Sidebar from "../components/Sidebar";
// import Header from "../components/Header";

// export default function MainLayout() {
//   return (
//     <div className="flex h-screen bg-zinc-900">
//       {/* <Sidebar />
//       <div className="flex flex-col flex-1 overflow-hidden">
//         <Header />
//         <main className="flex-1 overflow-auto p-6">
//           <Outlet />
//         </main>
//       </div> */}
//       INICIO
//     </div>
//   );
// }


import { useAuthStore } from "../store/auth.store";

export default function MainLayout() {
  const { usuario } = useAuthStore();

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#001a12",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "white",
        borderRadius: 24,
        padding: "48px 56px",
        textAlign: "center",
        maxWidth: 420,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 28,
          fontWeight: 800,
          color: "#003a30",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
        }}>
          ¡Bienvenido{usuario?.nombre ? `, ${usuario.nombre}` : ""}!
        </h1>
        <p style={{ color: "rgba(85,98,74,0.7)", fontSize: 15, margin: 0 }}>
          El sistema está listo. Las páginas están en construcción.
        </p>
      </div>
      <Outlet />
    </div>
  );
}