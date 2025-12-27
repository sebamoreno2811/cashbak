// Este archivo ya no se usa. Para evitar que quede código activo, lo dejamos redirigiendo.
// Si prefieres, puedes borrar el archivo del repo en lugar de sobrescribirlo.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompleteProfileFormPlaceholder() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}