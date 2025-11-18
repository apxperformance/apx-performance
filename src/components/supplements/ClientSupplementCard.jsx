import SupplementCard from "./SupplementCard";

// Wrapper component for client view - uses the consolidated SupplementCard
export default function ClientSupplementCard({ supplement }) {
  return <SupplementCard supplement={supplement} variant="client" />;
}