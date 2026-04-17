import AdminClient from "./AdminClient";

// Access control is handled entirely by middleware.ts
// which checks req.ip (real TCP connection IP, not spoofable headers)
// before this page is ever reached.
export default function AdminPage() {
  return <AdminClient />;
}