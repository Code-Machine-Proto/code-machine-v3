import { useParams } from "@solidjs/router";

export default function Workspace() {
  const params = useParams();
  return (
    <div class="flex h-screen">
      <div class="flex-1 bg-main-900 m-1 rounded-lg p-4">
        <p class="text-main-500">Éditeur de code — {params.id}</p>
      </div>
      <div class="flex-[1.5] flex flex-col gap-1 m-1">
        <div class="bg-main-900 rounded-lg p-2">
          <p class="text-main-500">Contrôles d'exécution</p>
        </div>
        <div class="flex-1 bg-main-900 rounded-lg p-4">
          <p class="text-main-500">Vue du circuit</p>
        </div>
        <div class="h-48 bg-main-900 rounded-lg p-4">
          <p class="text-main-500">Vue mémoire</p>
        </div>
      </div>
    </div>
  );
}
